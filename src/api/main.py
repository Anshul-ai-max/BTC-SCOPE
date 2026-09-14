"""Read-only FastAPI surface for existing BTC-SCOPE CSV outputs.

The API never reads ``ground_truth.csv``. Data is cached at application level,
so dashboard requests do not repeatedly parse the 100,000-row CSV files.
"""

from __future__ import annotations

import csv
import json
import os
from collections import Counter, defaultdict
from dataclasses import dataclass
from pathlib import Path
from typing import Annotated, Any

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware


REQUIRED_FILES = {
    "risk": "wallet_risk_scores.csv", "behavioral": "wallet_features.csv",
    "graph": "wallet_graph_features.csv", "baseline": "wallet_anomaly_scores.csv",
    "ml": "ml_anomaly_scores.csv",
}
PROJECT_ROOT = Path(__file__).resolve().parents[2]
RAW_TRANSACTIONS_FILE = "transactions.csv"
RAW_WALLETS_FILE = "wallets.csv"
RAW_OBSERVATIONS_FILE = "network_observations.csv"
DEVELOPMENT_ORIGINS = ("http://localhost:3000", "http://127.0.0.1:3000")


def read_rows(path: Path, description: str) -> list[dict[str, str]]:
    try:
        with path.open(newline="", encoding="utf-8") as file:
            return list(csv.DictReader(file))
    except FileNotFoundError as error:
        raise HTTPException(status_code=500, detail=f"Required {description} file is missing: {path.name}") from error


def numeric(row: dict[str, str], key: str) -> float | int:
    value = float(row[key])
    return int(value) if value.is_integer() else value


def as_float(row: dict[str, str], key: str) -> float:
    return float(row.get(key, 0) or 0)


def reasons(row: dict[str, str]) -> list[str]:
    return [row.get(f"reason_{index}", "") for index in range(1, 6) if row.get(f"reason_{index}", "")]


def cors_origins() -> list[str]:
    configured = [item.strip() for item in os.getenv("BTC_SCOPE_CORS_ORIGINS", "").split(",") if item.strip()]
    return list(dict.fromkeys([*DEVELOPMENT_ORIGINS, *configured]))


@dataclass
class DatasetStore:
    """In-memory, read-only representation of the synthetic research dataset."""

    processed_dir: Path
    loaded: bool = False

    def load(self) -> None:
        if self.loaded:
            return
        self.raw_dir = self.processed_dir.parent / "raw"
        tables = {
            name: {row["wallet_id"]: row for row in read_rows(self.processed_dir / filename, "processed data")}
            for name, filename in REQUIRED_FILES.items()
        }
        self.risk, self.behavioral, self.graph = tables["risk"], tables["behavioral"], tables["graph"]
        self.baseline, self.ml = tables["baseline"], tables["ml"]
        self.wallets = {
            row["wallet_id"]: {"wallet_id": row["wallet_id"], "created_at": row.get("created_at", ""), "wallet_type": row.get("wallet_type", "")}
            for row in read_rows(self.raw_dir / RAW_WALLETS_FILE, "raw wallet")
        }
        self.transactions = read_rows(self.raw_dir / RAW_TRANSACTIONS_FILE, "raw transaction")
        self.transactions_by_wallet: dict[str, list[dict[str, str]]] = defaultdict(list)
        self.latest_transaction_by_wallet: dict[str, str] = {}
        for transaction in self.transactions:
            for wallet_id in (transaction["input_wallet"], transaction["output_wallet"]):
                self.transactions_by_wallet[wallet_id].append(transaction)
                timestamp = transaction["timestamp"]
                if timestamp > self.latest_transaction_by_wallet.get(wallet_id, ""):
                    self.latest_transaction_by_wallet[wallet_id] = timestamp
        self.loaded = True

    def ensure_wallet(self, wallet_id: str) -> None:
        self.load()
        if wallet_id not in self.risk:
            raise HTTPException(status_code=404, detail=f"Unknown wallet: {wallet_id}")
        missing = [name for name, table in (("behavioral", self.behavioral), ("graph", self.graph), ("baseline", self.baseline), ("ml", self.ml)) if wallet_id not in table]
        if missing:
            raise HTTPException(status_code=500, detail=f"Wallet data is incomplete for {wallet_id}: {', '.join(missing)}")

    def wallet_payload(self, wallet_id: str) -> dict[str, Any]:
        self.ensure_wallet(wallet_id)
        risk, behavioral, graph = self.risk[wallet_id], self.behavioral[wallet_id], self.graph[wallet_id]
        return {
            "wallet_id": wallet_id, "risk_score": numeric(risk, "risk_score"), "risk_band": risk["risk_band"],
            "reasons": reasons(risk), "created_at": self.wallets.get(wallet_id, {}).get("created_at", ""),
            "last_seen": self.latest_transaction_by_wallet.get(wallet_id, ""),
            "behavioral_metrics": {key: numeric(behavioral, key) for key in ("tx_count", "outgoing_tx_count", "incoming_tx_count", "sent_btc", "received_btc", "net_flow_btc", "avg_sent_btc", "avg_received_btc", "unique_counterparties", "outgoing_counterparties", "incoming_counterparties", "active_days", "max_tx_per_hour", "rapid_tx_pairs_15m", "ip_count", "country_count", "asn_count")},
            "graph_metrics": {key: numeric(graph, key) for key in ("in_degree", "out_degree", "total_degree", "unique_in_neighbors", "unique_out_neighbors", "neighbor_count", "in_out_degree_ratio", "two_hop_neighbors", "average_sent_amount", "average_received_amount", "max_sent_amount", "max_received_amount", "fan_in_score", "fan_out_score", "chain_score")},
            "anomaly_scores": {"statistical": numeric(self.baseline[wallet_id], "anomaly_score"), "isolation_forest": numeric(self.ml[wallet_id], "anomaly_score")},
        }

    def alert_payload(self, wallet_id: str) -> dict[str, Any]:
        self.ensure_wallet(wallet_id)
        row, features = self.risk[wallet_id], self.behavioral[wallet_id]
        return {"wallet_id": wallet_id, "risk_score": numeric(row, "risk_score"), "risk_band": row["risk_band"], "reasons": reasons(row), "timestamp": self.latest_transaction_by_wallet.get(wallet_id, ""), "tx_count": numeric(features, "tx_count")}

    def connections(self, wallet_id: str) -> list[dict[str, Any]]:
        self.ensure_wallet(wallet_id)
        connections: dict[tuple[str, str], dict[str, Any]] = {}
        for row in self.transactions_by_wallet.get(wallet_id, []):
            if row["input_wallet"] == wallet_id:
                neighbor, direction = row["output_wallet"], "outgoing"
            else:
                neighbor, direction = row["input_wallet"], "incoming"
            connection = connections.setdefault((direction, neighbor), {"wallet_id": neighbor, "direction": direction, "transaction_count": 0, "total_amount_btc": 0.0})
            connection["transaction_count"] += 1
            connection["total_amount_btc"] += as_float(row, "amount_btc")
        result = []
        for connection in connections.values():
            neighbor_risk = self.risk.get(connection["wallet_id"])
            result.append({**connection, "total_amount_btc": round(connection["total_amount_btc"], 8), "risk_score": numeric(neighbor_risk, "risk_score") if neighbor_risk else None, "risk_band": neighbor_risk["risk_band"] if neighbor_risk else None})
        return sorted(result, key=lambda row: (-float(row["total_amount_btc"]), str(row["wallet_id"])))

    def observations(self) -> list[dict[str, str]]:
        if not hasattr(self, "_observations"):
            self._observations = read_rows(self.raw_dir / RAW_OBSERVATIONS_FILE, "raw network observation")
        return self._observations


def create_app(processed_dir: Path = PROJECT_ROOT / "data" / "processed") -> FastAPI:
    app = FastAPI(title="BTC-SCOPE API", version="0.2.0")
    store = DatasetStore(processed_dir)
    app.add_middleware(CORSMiddleware, allow_origins=cors_origins(), allow_credentials=False, allow_methods=["GET"], allow_headers=["*"])

    @app.get("/health")
    def health() -> dict[str, str]:
        store.load()
        return {"status": "ok"}

    @app.get("/stats")
    def stats() -> dict[str, Any]:
        store.load()
        distribution = Counter(row["risk_band"] for row in store.risk.values())
        return {"status": "OPERATIONAL", "wallet_count": len(store.risk), "transaction_count": len(store.transactions), "risk_distribution": {"high": distribution["HIGH"], "medium": distribution["MEDIUM"], "low": distribution["LOW"], "total": len(store.risk)}}

    @app.get("/wallet/{wallet_id}")
    def wallet(wallet_id: str) -> dict[str, Any]:
        return store.wallet_payload(wallet_id)

    @app.get("/wallets")
    def wallets(limit: Annotated[int, Query(ge=1, le=200)] = 100, offset: Annotated[int, Query(ge=0)] = 0, risk_band: str | None = None) -> dict[str, Any]:
        store.load()
        rows = sorted(store.risk.values(), key=lambda row: (-as_float(row, "risk_score"), row["wallet_id"]))
        if risk_band:
            band = risk_band.upper()
            if band not in {"LOW", "MEDIUM", "HIGH"}:
                raise HTTPException(status_code=422, detail="risk_band must be LOW, MEDIUM, or HIGH")
            rows = [row for row in rows if row["risk_band"] == band]
        ids = [row["wallet_id"] for row in rows]
        return {"wallets": [store.wallet_payload(wallet_id) for wallet_id in ids[offset: offset + limit]], "total": len(ids), "offset": offset, "limit": limit}

    @app.get("/alerts/top")
    def top_alerts(limit: Annotated[int, Query(ge=1, le=100)] = 20) -> dict[str, Any]:
        store.load()
        ids = [row["wallet_id"] for row in sorted(store.risk.values(), key=lambda row: (-as_float(row, "risk_score"), row["wallet_id"]))[:limit]]
        return {"alerts": [store.alert_payload(wallet_id) for wallet_id in ids]}

    @app.get("/wallet/{wallet_id}/network")
    def wallet_network(wallet_id: str, limit: Annotated[int, Query(ge=1, le=100)] = 12) -> dict[str, Any]:
        store.ensure_wallet(wallet_id)
        selected = store.risk[wallet_id]
        connections = store.connections(wallet_id)
        return {"wallet_id": wallet_id, "risk_score": numeric(selected, "risk_score"), "risk_band": selected["risk_band"], "connections": connections[:limit], "connection_count": len(connections)}

    @app.get("/transactions")
    def transactions(limit: Annotated[int, Query(ge=1, le=200)] = 50, offset: Annotated[int, Query(ge=0)] = 0, wallet: str | None = None) -> dict[str, Any]:
        store.load()
        if wallet and wallet not in store.risk:
            raise HTTPException(status_code=404, detail=f"Unknown wallet: {wallet}")
        rows = store.transactions_by_wallet.get(wallet, []) if wallet else store.transactions
        def payload(row: dict[str, str]) -> dict[str, Any]:
            source_risk = store.risk.get(row["input_wallet"])
            return {"txid": row["txid"], "timestamp": row["timestamp"], "amount_btc": as_float(row, "amount_btc"), "fee_btc": as_float(row, "fee_btc"), "input_wallet": row["input_wallet"], "output_wallet": row["output_wallet"], "script_type": row.get("script_type", ""), "sender_risk_score": numeric(source_risk, "risk_score") if source_risk else None, "sender_risk_band": source_risk["risk_band"] if source_risk else None, "sender_reason": reasons(source_risk)[0] if source_risk and reasons(source_risk) else None}
        return {"transactions": [payload(row) for row in rows[offset: offset + limit]], "total": len(rows), "offset": offset, "limit": limit}

    @app.get("/graph")
    def graph(focus: str | None = None, limit: Annotated[int, Query(ge=1, le=100)] = 20) -> dict[str, Any]:
        store.load()
        selected_id = focus or min(store.risk, key=lambda wallet_id: (-as_float(store.risk[wallet_id], "risk_score"), wallet_id))
        store.ensure_wallet(selected_id)
        selected, connections = store.wallet_payload(selected_id), store.connections(selected_id)[:limit]
        nodes = [{"wallet_id": selected_id, "risk_score": selected["risk_score"], "risk_band": selected["risk_band"], "connections": len(connections)}]
        edges = []
        for connection in connections:
            nodes.append({"wallet_id": connection["wallet_id"], "risk_score": connection["risk_score"], "risk_band": connection["risk_band"], "connections": connection["transaction_count"]})
            outgoing = connection["direction"] == "outgoing"
            edges.append({"source": selected_id if outgoing else connection["wallet_id"], "target": connection["wallet_id"] if outgoing else selected_id, "direction": connection["direction"], "amount_btc": connection["total_amount_btc"], "transaction_count": connection["transaction_count"]})
        return {"focus_wallet_id": selected_id, "nodes": nodes, "edges": edges}

    @app.get("/network-intel")
    def network_intel() -> dict[str, Any]:
        store.load()
        per_country: dict[str, dict[str, Any]] = {}
        ips, asns, high_risk_ips = set(), set(), set()
        transaction_wallet = {row["txid"]: row["input_wallet"] for row in store.transactions}
        for observation in store.observations():
            country, ip = observation.get("country") or "Unknown", observation.get("src_ip") or ""
            ips.add(ip); asns.add(observation.get("asn") or "")
            item = per_country.setdefault(country, {"ips": set(), "transactions": 0, "high": 0})
            item["ips"].add(ip); item["transactions"] += 1
            sender = transaction_wallet.get(observation["txid"])
            if sender and store.risk.get(sender, {}).get("risk_band") == "HIGH":
                item["high"] += 1; high_risk_ips.add(ip)
        countries = [{"country": country, "ip_count": len(item["ips"]), "transaction_count": item["transactions"], "high_risk_transaction_count": item["high"], "risk_band": "HIGH" if item["high"] else "LOW"} for country, item in per_country.items()]
        return {"observed_ip_count": len(ips), "country_count": len(per_country), "high_risk_ip_count": len(high_risk_ips), "asn_count": len(asns - {""}), "countries": sorted(countries, key=lambda item: (-item["transaction_count"], item["country"]))}

    @app.get("/analytics")
    def analytics() -> dict[str, Any]:
        store.load()
        daily: dict[str, Counter[str]] = defaultdict(Counter)
        for row in store.transactions:
            daily[row["timestamp"][:10]][store.risk.get(row["input_wallet"], {}).get("risk_band", "LOW")] += 1
        distribution = Counter(row["risk_band"] for row in store.risk.values())
        timeline = [{"date": date, "low_risk_sender_transactions": counts["LOW"], "medium_risk_sender_transactions": counts["MEDIUM"], "high_risk_sender_transactions": counts["HIGH"]} for date, counts in sorted(daily.items())]
        monthly: dict[str, Counter[str]] = defaultdict(Counter)
        for wallet_id, row in store.wallets.items():
            if wallet_id in store.risk:
                monthly[row.get("created_at", "")[:7] or "Unknown"][store.risk[wallet_id]["risk_band"]] += 1
        return {"wallet_count": len(store.risk), "transaction_count": len(store.transactions), "risk_distribution": {"high": distribution["HIGH"], "medium": distribution["MEDIUM"], "low": distribution["LOW"], "total": len(store.risk)}, "transaction_timeline": timeline, "monthly_wallet_risk_distribution": [{"month": month, "high": counts["HIGH"], "medium": counts["MEDIUM"], "low": counts["LOW"]} for month, counts in sorted(monthly.items())]}

    @app.get("/models/performance")
    def model_performance() -> dict[str, Any]:
        """Expose existing offline evaluation artifacts only; never fabricate values."""
        path = processed_dir / "ml_model_evaluation.json"
        if not path.exists():
            return {"evaluations": []}
        with path.open(encoding="utf-8") as file:
            data = json.load(file)
        evaluations = []
        for name, key in (("Isolation Forest", "ml_isolation_forest"), ("Statistical Anomaly Baseline", "statistical_baseline")):
            metrics = data.get(key)
            if metrics:
                evaluations.append({"model_name": name, "roc_auc": metrics.get("roc_auc"), "pr_auc": metrics.get("pr_auc"), "precision_at_5": metrics.get("top_k", {}).get("5%", {}).get("precision"), "recall_at_5": metrics.get("top_k", {}).get("5%", {}).get("recall"), "evaluation_source": path.name})
        return {"evaluations": evaluations}

    @app.get("/activity")
    def activity(limit: Annotated[int, Query(ge=1, le=50)] = 8) -> dict[str, Any]:
        store.load(); events = []
        for row in sorted(store.transactions, key=lambda transaction: transaction["timestamp"], reverse=True):
            sender, risk = row["input_wallet"], store.risk.get(row["input_wallet"])
            if risk and risk["risk_band"] == "HIGH":
                events.append({"id": row["txid"], "timestamp": row["timestamp"], "type": "detection", "entity_id": sender, "description": "High-risk sender appeared in a synthetic transaction.", "risk_band": "HIGH", "risk_score": numeric(risk, "risk_score")})
            if len(events) >= limit:
                break
        return {"events": events}

    return app


app = create_app()
