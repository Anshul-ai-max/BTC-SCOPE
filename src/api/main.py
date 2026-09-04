"""Read-only FastAPI surface for existing BTC-SCOPE processed outputs."""

from __future__ import annotations

import csv
from pathlib import Path
from typing import Annotated

from fastapi import FastAPI, HTTPException, Query


REQUIRED_FILES = {
    "risk": "wallet_risk_scores.csv",
    "behavioral": "wallet_features.csv",
    "graph": "wallet_graph_features.csv",
    "baseline": "wallet_anomaly_scores.csv",
    "ml": "ml_anomaly_scores.csv",
}
PROJECT_ROOT = Path(__file__).resolve().parents[2]


def read_wallet_rows(path: Path) -> dict[str, dict[str, str]]:
    try:
        with path.open(newline="", encoding="utf-8") as file:
            return {row["wallet_id"]: row for row in csv.DictReader(file)}
    except FileNotFoundError as error:
        raise HTTPException(status_code=500, detail=f"Required processed data file is missing: {path.name}") from error


def load_data(processed_dir: Path) -> dict[str, dict[str, dict[str, str]]]:
    return {name: read_wallet_rows(processed_dir / filename) for name, filename in REQUIRED_FILES.items()}


def numeric(row: dict[str, str], key: str) -> float | int:
    value = float(row[key])
    return int(value) if value.is_integer() else value


def create_app(processed_dir: Path = PROJECT_ROOT / "data" / "processed") -> FastAPI:
    app = FastAPI(title="BTC-SCOPE API", version="0.1.0")

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

    return app


app = create_app()
