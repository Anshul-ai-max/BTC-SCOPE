"""Read-only FastAPI surface for existing BTC-SCOPE processed outputs."""

from __future__ import annotations

import csv
from pathlib import Path
from typing import Annotated

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware


REQUIRED_FILES = {
    "risk": "wallet_risk_scores.csv",
    "behavioral": "wallet_features.csv",
    "graph": "wallet_graph_features.csv",
    "baseline": "wallet_anomaly_scores.csv",
    "ml": "ml_anomaly_scores.csv",
}
PROJECT_ROOT = Path(__file__).resolve().parents[2]
RAW_TRANSACTIONS_FILE = "transactions.csv"
DEVELOPMENT_ORIGINS = ("http://localhost:3000", "http://127.0.0.1:3000")


def read_wallet_rows(path: Path) -> dict[str, dict[str, str]]:
    try:
        with path.open(newline="", encoding="utf-8") as file:
            return {row["wallet_id"]: row for row in csv.DictReader(file)}
    except FileNotFoundError as error:
        raise HTTPException(status_code=500, detail=f"Required processed data file is missing: {path.name}") from error


def load_data(processed_dir: Path) -> dict[str, dict[str, dict[str, str]]]:
    return {name: read_wallet_rows(processed_dir / filename) for name, filename in REQUIRED_FILES.items()}


def read_transactions(path: Path, wallet_id: str) -> dict[str, dict[str, object]]:
    """Return a bounded, aggregated one-hop view without reading labels."""
    try:
        with path.open(newline="", encoding="utf-8") as file:
            connections: dict[str, dict[str, object]] = {}
            for row in csv.DictReader(file):
                if row["input_wallet"] == wallet_id:
                    neighbor, direction = row["output_wallet"], "outgoing"
                elif row["output_wallet"] == wallet_id:
                    neighbor, direction = row["input_wallet"], "incoming"
                else:
                    continue
                key = f"{direction}:{neighbor}"
                connection = connections.setdefault(key, {
                    "wallet_id": neighbor,
                    "direction": direction,
                    "transaction_count": 0,
                    "total_amount_btc": 0.0,
                })
                connection["transaction_count"] = int(connection["transaction_count"]) + 1
                connection["total_amount_btc"] = float(connection["total_amount_btc"]) + float(row["amount_btc"])
            return connections
    except FileNotFoundError as error:
        raise HTTPException(status_code=500, detail=f"Required raw data file is missing: {path.name}") from error


def numeric(row: dict[str, str], key: str) -> float | int:
    value = float(row[key])
    return int(value) if value.is_integer() else value


def create_app(processed_dir: Path = PROJECT_ROOT / "data" / "processed") -> FastAPI:
    app = FastAPI(title="BTC-SCOPE API", version="0.1.0")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=list(DEVELOPMENT_ORIGINS),
        allow_credentials=False,
        allow_methods=["GET"],
        allow_headers=["*"],
    )

    @app.get("/health")
    def health() -> dict[str, str]:
        load_data(processed_dir)
        return {"status": "ok"}

    @app.get("/wallet/{wallet_id}")
    def wallet(wallet_id: str) -> dict[str, object]:
        data = load_data(processed_dir)
        if wallet_id not in data["risk"]:
            raise HTTPException(status_code=404, detail=f"Unknown wallet: {wallet_id}")
        missing = [name for name, rows in data.items() if wallet_id not in rows]
        if missing:
            raise HTTPException(status_code=500, detail=f"Wallet data is incomplete for {wallet_id}: {', '.join(missing)}")
        risk, behavioral, graph = data["risk"][wallet_id], data["behavioral"][wallet_id], data["graph"][wallet_id]
        return {
            "wallet_id": wallet_id,
            "risk_score": numeric(risk, "risk_score"),
            "risk_band": risk["risk_band"],
            "reasons": [risk[f"reason_{index}"] for index in range(1, 6) if risk[f"reason_{index}"]],
            "behavioral_metrics": {
                key: numeric(behavioral, key) for key in (
                    "tx_count", "sent_btc", "received_btc", "unique_counterparties",
                    "rapid_tx_pairs_15m", "ip_count", "country_count", "asn_count",
                )
            },
            "graph_metrics": {
                key: numeric(graph, key) for key in (
                    "in_degree", "out_degree", "neighbor_count", "fan_in_score",
                    "fan_out_score", "chain_score",
                )
            },
            "anomaly_scores": {
                "statistical": numeric(data["baseline"][wallet_id], "anomaly_score"),
                "isolation_forest": numeric(data["ml"][wallet_id], "anomaly_score"),
            },
        }

    @app.get("/alerts/top")
    def top_alerts(limit: Annotated[int, Query(ge=1, le=100)] = 20) -> dict[str, object]:
        risk_rows = load_data(processed_dir)["risk"].values()
        alerts = sorted(risk_rows, key=lambda row: float(row["risk_score"]), reverse=True)[:limit]
        return {"alerts": [{
            "wallet_id": row["wallet_id"],
            "risk_score": numeric(row, "risk_score"),
            "risk_band": row["risk_band"],
            "reasons": [row[f"reason_{index}"] for index in range(1, 6) if row[f"reason_{index}"]],
        } for row in alerts]}

    @app.get("/wallet/{wallet_id}/network")
    def wallet_network(wallet_id: str, limit: Annotated[int, Query(ge=1, le=20)] = 12) -> dict[str, object]:
        """Return actual one-hop synthetic transaction relationships for a wallet."""
        data = load_data(processed_dir)
        if wallet_id not in data["risk"]:
            raise HTTPException(status_code=404, detail=f"Unknown wallet: {wallet_id}")
        transactions_path = processed_dir.parent / "raw" / RAW_TRANSACTIONS_FILE
        connections = list(read_transactions(transactions_path, wallet_id).values())
        for connection in connections:
            risk = data["risk"].get(str(connection["wallet_id"]))
            connection["risk_score"] = numeric(risk, "risk_score") if risk else None
            connection["risk_band"] = risk["risk_band"] if risk else None
            connection["total_amount_btc"] = round(float(connection["total_amount_btc"]), 8)
        connections.sort(key=lambda row: (-float(row["total_amount_btc"]), str(row["wallet_id"])))
        selected_risk = data["risk"][wallet_id]
        return {
            "wallet_id": wallet_id,
            "risk_score": numeric(selected_risk, "risk_score"),
            "risk_band": selected_risk["risk_band"],
            "connections": connections[:limit],
            "connection_count": len(connections),
        }

    return app


app = create_app()
