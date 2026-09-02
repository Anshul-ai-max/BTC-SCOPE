"""Evaluate wallet anomaly rankings against BTC-SCOPE ground truth.

Ground truth is read only here, after scoring. It must never be used by the
anomaly scorer or feature-engineering pipeline.
"""

from __future__ import annotations

import argparse
import csv
import json
from pathlib import Path


ANOMALOUS_SCENARIOS = {"fan_in", "fan_out", "layering", "peel_chain"}


def metrics(labels: list[int], predictions: list[int]) -> dict[str, object]:
    tp = sum(label == 1 and prediction == 1 for label, prediction in zip(labels, predictions))
    fp = sum(label == 0 and prediction == 1 for label, prediction in zip(labels, predictions))
    tn = sum(label == 0 and prediction == 0 for label, prediction in zip(labels, predictions))
    fn = sum(label == 1 and prediction == 0 for label, prediction in zip(labels, predictions))
    precision = tp / (tp + fp) if tp + fp else 0.0
    recall = tp / (tp + fn) if tp + fn else 0.0
    f1 = 2 * precision * recall / (precision + recall) if precision + recall else 0.0
    return {
        "precision": round(precision, 6), "recall": round(recall, 6), "f1": round(f1, 6),
        "confusion_matrix": {"tp": tp, "fp": fp, "tn": tn, "fn": fn},
    }


def roc_auc(labels: list[int], scores: list[float]) -> float | None:
    """Compute AUC with average ranks for ties; returns None for one-class data."""
    positives, negatives = sum(labels), len(labels) - sum(labels)
    if not positives or not negatives:
        return None
    ordered = sorted(range(len(scores)), key=scores.__getitem__)
    ranks = [0.0] * len(scores)
    position = 0
    while position < len(scores):
        end = position
        while end + 1 < len(scores) and scores[ordered[end + 1]] == scores[ordered[position]]:
            end += 1
        average_rank = (position + 1 + end + 1) / 2
        for index in ordered[position:end + 1]:
            ranks[index] = average_rank
        position = end + 1
    positive_rank_sum = sum(rank for rank, label in zip(ranks, labels) if label)
    return round((positive_rank_sum - positives * (positives + 1) / 2) / (positives * negatives), 6)


def evaluate_rows(score_rows: list[dict[str, str]], anomalous_wallets: set[str]) -> dict[str, object]:
    rows = sorted(score_rows, key=lambda row: float(row["anomaly_score"]), reverse=True)
    labels = [int(row["wallet_id"] in anomalous_wallets) for row in rows]
    scores = [float(row["anomaly_score"]) for row in rows]
    score_thresholds = {
        str(threshold): metrics(labels, [int(score >= threshold) for score in scores])
        for threshold in (50, 60, 70, 80)
    }
    top_k: dict[str, dict[str, object]] = {}
    for percentage in (1, 5, 10, 20):
        count = max(1, round(len(rows) * percentage / 100))
        result = metrics(labels, [int(index < count) for index in range(len(rows))])
        result["reviewed_wallets"] = count
        top_k[f"{percentage}%"] = result
    return {
        "wallets_evaluated": len(rows),
        "positive_wallets": sum(labels),
        "negative_wallets": len(rows) - sum(labels),
        "roc_auc": roc_auc(labels, scores),
        "score_thresholds": score_thresholds,
        "top_k_percentages": top_k,
        "precision_at": {key: top_k[key]["precision"] for key in ("1%", "5%", "10%")},
        "recall_at": {key: top_k[key]["recall"] for key in ("1%", "5%", "10%")},
    }


def anomalous_wallet_ids(ground_truth_path: Path) -> set[str]:
    anomalous: set[str] = set()
    with ground_truth_path.open(newline="", encoding="utf-8") as file:
        for row in csv.DictReader(file):
            if row["entity_type"] == "wallet" and row["scenario"] in ANOMALOUS_SCENARIOS:
                anomalous.add(row["entity_id"])
    return anomalous


def main() -> None:
    parser = argparse.ArgumentParser(description="Evaluate BTC-SCOPE anomaly scores.")
    parser.add_argument("--scores", type=Path, default=Path("data/processed/wallet_anomaly_scores.csv"))
    parser.add_argument("--ground-truth", type=Path, default=Path("data/raw/ground_truth.csv"))
    parser.add_argument("--output", type=Path, default=Path("data/processed/anomaly_evaluation.json"))
    args = parser.parse_args()
    with args.scores.open(newline="", encoding="utf-8") as file:
        report = evaluate_rows(list(csv.DictReader(file)), anomalous_wallet_ids(args.ground_truth))
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, indent=2), encoding="utf-8")
    top_5 = report["top_k_percentages"]["5%"]
    print(f"Evaluated {report['wallets_evaluated']} wallets; positives: {report['positive_wallets']}; ROC-AUC: {report['roc_auc']}")
    print(f"Top 5% — precision: {top_5['precision']:.3f}, recall: {top_5['recall']:.3f}, F1: {top_5['f1']:.3f}")
    print(f"Saved evaluation to {args.output}")


if __name__ == "__main__":
    main()
