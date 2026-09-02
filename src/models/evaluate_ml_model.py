"""Evaluate ML and statistical anomaly scores; labels are used only here."""

from __future__ import annotations

import argparse
import csv
import json
from pathlib import Path

from sklearn.metrics import average_precision_score

from src.models.evaluate_anomalies import anomalous_wallet_ids, metrics, roc_auc


def read_scores(path: Path) -> list[dict[str, str]]:
    with path.open(newline="", encoding="utf-8") as file:
        return list(csv.DictReader(file))


def evaluate_score_file(rows: list[dict[str, str]], anomalous: set[str], use_risk_band: bool) -> dict[str, object]:
    ordered = sorted(rows, key=lambda row: float(row["anomaly_score"]), reverse=True)
    labels = [int(row["wallet_id"] in anomalous) for row in ordered]
    scores = [float(row["anomaly_score"]) for row in ordered]
    predictions = [int(row.get("risk_band") == "high") for row in ordered] if use_risk_band else [int(score >= 70) for score in scores]
    top_k: dict[str, dict[str, float]] = {}
    for percent in (1, 5, 10):
        count = max(1, round(len(ordered) * percent / 100))
        result = metrics(labels, [int(index < count) for index in range(len(ordered))])
        top_k[f"{percent}%"] = {"precision": result["precision"], "recall": result["recall"]}
    return {
        "roc_auc": roc_auc(labels, scores),
        "pr_auc": round(float(average_precision_score(labels, scores)), 6),
        "risk_band_metrics": metrics(labels, predictions),
        "top_k": top_k,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Evaluate BTC-SCOPE ML anomaly model.")
    parser.add_argument("--ml-scores", type=Path, default=Path("data/processed/ml_anomaly_scores.csv"))
    parser.add_argument("--baseline-scores", type=Path, default=Path("data/processed/wallet_anomaly_scores.csv"))
    parser.add_argument("--ground-truth", type=Path, default=Path("data/raw/ground_truth.csv"))
    parser.add_argument("--output", type=Path, default=Path("data/processed/ml_model_evaluation.json"))
    args = parser.parse_args()
    anomalous = anomalous_wallet_ids(args.ground_truth)
    ml_report = evaluate_score_file(read_scores(args.ml_scores), anomalous, use_risk_band=True)
    baseline_report = evaluate_score_file(read_scores(args.baseline_scores), anomalous, use_risk_band=True)
    report = {"ml_isolation_forest": ml_report, "statistical_baseline": baseline_report}
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(f"ML ROC-AUC: {ml_report['roc_auc']}; PR-AUC: {ml_report['pr_auc']}")
    print(f"Baseline ROC-AUC: {baseline_report['roc_auc']}; PR-AUC: {baseline_report['pr_auc']}")
    print(f"Saved comparison to {args.output}")


if __name__ == "__main__":
    main()
