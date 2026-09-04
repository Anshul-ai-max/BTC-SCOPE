"""Transparent, label-free BTC-SCOPE wallet risk scoring and explanations."""

from __future__ import annotations

import argparse
import csv
import math
from pathlib import Path


OUTPUT_FIELDS = ["wallet_id", "risk_score", "risk_band", "reason_1", "reason_2", "reason_3", "reason_4", "reason_5"]
SIGNALS = {
    "statistical_anomaly": ("statistical_anomaly_score", 0.16, "Unusual combined behavioral profile"),
    "ml_anomaly": ("ml_anomaly_score", 0.14, "Unusual combined behavioral and graph profile"),
    "rapid_activity": ("rapid_tx_pairs_15m", 0.10, "Unusually rapid transaction activity"),
    "transaction_activity": ("tx_count", 0.08, "Unusually high transaction activity"),
    "transaction_volume": ("transaction_volume", 0.08, "Unusually high transaction volume"),
    "counterparty_diversity": ("unique_counterparties", 0.07, "High counterparty diversity"),
    "network_diversity": ("network_diversity", 0.07, "Unusual network identity diversity"),
    "fan_in": ("fan_in_score", 0.08, "Strong fan-in transaction pattern"),
    "fan_out": ("fan_out_score", 0.08, "Strong fan-out transaction pattern"),
    "chain": ("chain_score", 0.07, "Strong transaction-chain pattern"),
    "graph_connectivity": ("neighbor_count", 0.07, "High wallet connectivity"),
}


def read_by_wallet(path: Path) -> dict[str, dict[str, str]]:
    with path.open(newline="", encoding="utf-8") as file:
        return {row["wallet_id"]: row for row in csv.DictReader(file)}


def number(row: dict[str, str], field: str) -> float:
    try:
        value = float(row.get(field, "0"))
        return value if math.isfinite(value) else 0.0
    except (TypeError, ValueError):
        return 0.0


def percentile_ranks(values: list[float]) -> list[float]:
    count = len(values)
    if count <= 1:
        return [0.0] * count
    ordered = sorted(range(count), key=values.__getitem__)
    ranks = [0.0] * count
    start = 0
    while start < count:
        end = start
        while end + 1 < count and values[ordered[end + 1]] == values[ordered[start]]:
            end += 1
        rank = ((start + end) / 2) / (count - 1)
        for index in ordered[start:end + 1]:
            ranks[index] = rank
        start = end + 1
    return ranks


def build_risk_rows(
    behavioral: dict[str, dict[str, str]], graph: dict[str, dict[str, str]],
    baseline: dict[str, dict[str, str]], ml: dict[str, dict[str, str]],
) -> list[dict[str, str]]:
    wallets = sorted(set(behavioral) & set(graph) & set(baseline) & set(ml))
    values: dict[str, list[float]] = {name: [] for name in SIGNALS}
    for wallet in wallets:
        behavior, graph_row = behavioral[wallet], graph[wallet]
        values["statistical_anomaly"].append(number(baseline[wallet], "anomaly_score"))
        values["ml_anomaly"].append(number(ml[wallet], "anomaly_score"))
        values["rapid_activity"].append(number(behavior, "rapid_tx_pairs_15m"))
        values["transaction_activity"].append(number(behavior, "tx_count"))
        values["transaction_volume"].append(number(behavior, "sent_btc") + number(behavior, "received_btc"))
        values["counterparty_diversity"].append(number(behavior, "unique_counterparties"))
        values["network_diversity"].append(number(behavior, "ip_count") + number(behavior, "country_count") + number(behavior, "asn_count"))
        values["fan_in"].append(number(graph_row, "fan_in_score"))
        values["fan_out"].append(number(graph_row, "fan_out_score"))
        values["chain"].append(number(graph_row, "chain_score"))
        values["graph_connectivity"].append(number(graph_row, "neighbor_count"))
    ranks = {name: percentile_ranks(signal_values) for name, signal_values in values.items()}
    rows = []
    for index, wallet in enumerate(wallets):
        contributions = sorted(
            ((name, ranks[name][index] * weight, explanation) for name, (_, weight, explanation) in SIGNALS.items()),
            key=lambda item: (-item[1], item[0]),
        )
        score = round(min(100.0, max(0.0, sum(value for _, value, _ in contributions) * 100)), 2)
        band = "HIGH" if score >= 70 else "MEDIUM" if score >= 40 else "LOW"
        reasons = [explanation for _, contribution, explanation in contributions if contribution > 0][:5]
        if not reasons:
            reasons = ["No elevated behavioral or graph signal", "No elevated anomaly-model signal"]
        reasons += [""] * (5 - len(reasons))
        rows.append({
            "wallet_id": wallet, "risk_score": f"{score:.2f}", "risk_band": band,
            **{f"reason_{position + 1}": reason for position, reason in enumerate(reasons)},
        })
    return rows


def write_rows(rows: list[dict[str, str]], output: Path) -> None:
    output.parent.mkdir(parents=True, exist_ok=True)
    with output.open("w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=OUTPUT_FIELDS)
        writer.writeheader()
        writer.writerows(rows)


def main() -> None:
    parser = argparse.ArgumentParser(description="Build transparent BTC-SCOPE wallet risk scores.")
    parser.add_argument("--behavioral", type=Path, default=Path("data/processed/wallet_features.csv"))
    parser.add_argument("--graph", type=Path, default=Path("data/processed/wallet_graph_features.csv"))
    parser.add_argument("--baseline", type=Path, default=Path("data/processed/wallet_anomaly_scores.csv"))
    parser.add_argument("--ml", type=Path, default=Path("data/processed/ml_anomaly_scores.csv"))
    parser.add_argument("--output", type=Path, default=Path("data/processed/wallet_risk_scores.csv"))
    args = parser.parse_args()
    rows = build_risk_rows(read_by_wallet(args.behavioral), read_by_wallet(args.graph), read_by_wallet(args.baseline), read_by_wallet(args.ml))
    write_rows(rows, args.output)
    counts = {band: sum(row["risk_band"] == band for row in rows) for band in ("LOW", "MEDIUM", "HIGH")}
    print(f"Wrote {len(rows)} risk scores to {args.output}; LOW={counts['LOW']}, MEDIUM={counts['MEDIUM']}, HIGH={counts['HIGH']}")


if __name__ == "__main__":
    main()
