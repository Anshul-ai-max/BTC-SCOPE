"""Build leakage-free, wallet-level features from BTC-SCOPE raw CSV files.

`ground_truth.csv` is deliberately never read here. It remains evaluation-only.
"""

from __future__ import annotations

import argparse
import csv
from collections import defaultdict
from datetime import datetime
from pathlib import Path


FEATURE_FIELDS = [
    "wallet_id", "tx_count", "outgoing_tx_count", "incoming_tx_count",
    "sent_btc", "received_btc", "net_flow_btc", "avg_sent_btc",
    "avg_received_btc", "unique_counterparties", "outgoing_counterparties",
    "incoming_counterparties", "active_days", "max_tx_per_hour",
    "rapid_tx_pairs_15m", "ip_count", "country_count", "asn_count",
]


def parse_time(value: str) -> datetime:
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def build_features(raw_dir: Path) -> list[dict[str, object]]:
    stats: dict[str, dict[str, object]] = {}
    tx_senders: dict[str, str] = {}

    with (raw_dir / "wallets.csv").open(newline="", encoding="utf-8") as file:
        for row in csv.DictReader(file):
            stats[row["wallet_id"]] = {
                "outgoing": 0, "incoming": 0, "sent": 0.0, "received": 0.0,
                "out_counterparties": set(), "in_counterparties": set(),
                "timestamps": [], "ips": set(), "countries": set(), "asns": set(),
            }

    with (raw_dir / "transactions.csv").open(newline="", encoding="utf-8") as file:
        for row in csv.DictReader(file):
            sender, receiver = row["input_wallet"], row["output_wallet"]
            amount, timestamp = float(row["amount_btc"]), parse_time(row["timestamp"])
            tx_senders[row["txid"]] = sender
            sender_stats, receiver_stats = stats[sender], stats[receiver]
            sender_stats["outgoing"] += 1
            sender_stats["sent"] += amount
            sender_stats["out_counterparties"].add(receiver)
            sender_stats["timestamps"].append(timestamp)
            receiver_stats["incoming"] += 1
            receiver_stats["received"] += amount
            receiver_stats["in_counterparties"].add(sender)
            receiver_stats["timestamps"].append(timestamp)

    with (raw_dir / "network_observations.csv").open(newline="", encoding="utf-8") as file:
        for row in csv.DictReader(file):
            wallet = tx_senders.get(row["txid"])
            if wallet is not None:
                stats[wallet]["ips"].add(row["src_ip"])
                stats[wallet]["countries"].add(row["country"])
                stats[wallet]["asns"].add(row["asn"])

    features: list[dict[str, object]] = []
    for wallet, value in stats.items():
        timestamps = sorted(value["timestamps"])
        hourly_counts: dict[tuple[int, int, int, int], int] = defaultdict(int)
        rapid_pairs = 0
        for index, timestamp in enumerate(timestamps):
            hourly_counts[(timestamp.year, timestamp.month, timestamp.day, timestamp.hour)] += 1
            if index and (timestamp - timestamps[index - 1]).total_seconds() <= 900:
                rapid_pairs += 1
        outgoing, incoming = int(value["outgoing"]), int(value["incoming"])
        sent, received = float(value["sent"]), float(value["received"])
        features.append({
            "wallet_id": wallet,
            "tx_count": outgoing + incoming,
            "outgoing_tx_count": outgoing,
            "incoming_tx_count": incoming,
            "sent_btc": f"{sent:.8f}",
            "received_btc": f"{received:.8f}",
            "net_flow_btc": f"{received - sent:.8f}",
            "avg_sent_btc": f"{sent / outgoing:.8f}" if outgoing else "0.00000000",
            "avg_received_btc": f"{received / incoming:.8f}" if incoming else "0.00000000",
            "unique_counterparties": len(value["out_counterparties"] | value["in_counterparties"]),
            "outgoing_counterparties": len(value["out_counterparties"]),
            "incoming_counterparties": len(value["in_counterparties"]),
            "active_days": len({timestamp.date() for timestamp in timestamps}),
            "max_tx_per_hour": max(hourly_counts.values(), default=0),
            "rapid_tx_pairs_15m": rapid_pairs,
            "ip_count": len(value["ips"]),
            "country_count": len(value["countries"]),
            "asn_count": len(value["asns"]),
        })
    return features


def main() -> None:
    parser = argparse.ArgumentParser(description="Build BTC-SCOPE wallet features.")
    parser.add_argument("--raw-dir", type=Path, default=Path("data/raw"))
    parser.add_argument("--output", type=Path, default=Path("data/processed/wallet_features.csv"))
    args = parser.parse_args()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    rows = build_features(args.raw_dir)
    with args.output.open("w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=FEATURE_FIELDS)
        writer.writeheader()
        writer.writerows(rows)
    print(f"Wrote {len(rows)} wallet feature rows to {args.output}")


if __name__ == "__main__":
    main()
