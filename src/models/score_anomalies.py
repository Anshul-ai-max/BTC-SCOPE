"""Rank BTC-SCOPE wallets by unusual behaviour without using labels.

This is a transparent baseline, not a production AML decision system. It uses
percentile ranks so no third-party ML package is required.
"""

from __future__ import annotations

import argparse
import csv
from pathlib import Path


SIGNALS = {
    "tx_count": 0.12,
    "unique_counterparties": 0.14,
    "max_tx_per_hour": 0.17,
    "rapid_tx_pairs_15m": 0.17,
    "ip_count": 0.10,
    "country_count": 0.10,
    "asn_count": 0.10,
    "abs_net_flow_btc": 0.10,
}


def percentile_ranks(values: list[float]) -> list[float]:
    """Return average-tie percentile ranks in the inclusive [0, 1] range."""
    count = len(values)
    if count <= 1:
        return [0.0] * count
    sorted_indices = sorted(range(count), key=values.__getitem__)
    ranks = [0.0] * count
    position = 0
    while position < count:
        end = position
        while end + 1 < count and values[sorted_indices[end + 1]] == values[sorted_indices[position]]:
            end += 1
        rank = ((position + end) / 2) / (count - 1)
        for item in sorted_indices[position:end + 1]:
            ranks[item] = rank
        position = end + 1
    return ranks


def score_rows(rows: list[dict[str, str]]) -> list[dict[str, object]]:
    numeric: dict[str, list[float]] = {signal: [] for signal in SIGNALS}
    for row in rows:
        for signal in SIGNALS:
            if signal == "abs_net_flow_btc":
                numeric[signal].append(abs(float(row["net_flow_btc"])))
            else:
                numeric[signal].append(float(row[signal]))
    ranks = {signal: percentile_ranks(values) for signal, values in numeric.items()}
    output: list[dict[str, object]] = []
    for index, row in enumerate(rows):
        components = sorted(
            ((signal, ranks[signal][index] * weight) for signal, weight in SIGNALS.items()),
            key=lambda item: item[1], reverse=True,
        )
        score = sum(value for _, value in components) * 100
        output.append({
            "wallet_id": row["wallet_id"],
            "anomaly_score": f"{score:.2f}",
            "risk_band": "high" if score >= 80 else "medium" if score >= 60 else "low",
            "top_signals": "; ".join(signal for signal, _ in components[:3]),
        })
    return sorted(output, key=lambda row: float(str(row["anomaly_score"])), reverse=True)


def main() -> None:
    parser = argparse.ArgumentParser(description="Score BTC-SCOPE wallet anomalies.")
    parser.add_argument("--input", type=Path, default=Path("data/processed/wallet_features.csv"))
    parser.add_argument("--output", type=Path, default=Path("data/processed/wallet_anomaly_scores.csv"))
    args = parser.parse_args()
    with args.input.open(newline="", encoding="utf-8") as file:
        scored = score_rows(list(csv.DictReader(file)))
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open("w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=["wallet_id", "anomaly_score", "risk_band", "top_signals"])
        writer.writeheader()
        writer.writerows(scored)
    print(f"Wrote {len(scored)} anomaly scores to {args.output}")
    for row in scored[:5]:
        print(f"{row['wallet_id']}: {row['anomaly_score']} ({row['risk_band']}) — {row['top_signals']}")


if __name__ == "__main__":
    main()
