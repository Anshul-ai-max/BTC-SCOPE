"""Build wallet-level structural features from the BTC-SCOPE transaction graph.

Ground truth is deliberately not an input. A MultiDiGraph retains every
transaction even when the same wallet pair transacts repeatedly.
"""

from __future__ import annotations

import argparse
import csv
import math
from collections import defaultdict
from pathlib import Path

import networkx as nx


FEATURE_FIELDS = [
    "wallet_id", "in_degree", "out_degree", "total_degree",
    "unique_in_neighbors", "unique_out_neighbors", "neighbor_count",
    "in_out_degree_ratio", "two_hop_neighbors", "average_sent_amount",
    "average_received_amount", "max_sent_amount", "max_received_amount",
    "fan_in_score", "fan_out_score", "chain_score",
]


def load_wallet_ids(wallets_path: Path | None) -> list[str]:
    if wallets_path is None or not wallets_path.exists():
        return []
    with wallets_path.open(newline="", encoding="utf-8") as file:
        return [row["wallet_id"] for row in csv.DictReader(file)]


def build_graph(transactions_path: Path, wallets_path: Path | None = None) -> nx.MultiDiGraph:
    graph = nx.MultiDiGraph()
    graph.add_nodes_from(load_wallet_ids(wallets_path))
    with transactions_path.open(newline="", encoding="utf-8") as file:
        for row in csv.DictReader(file):
            graph.add_edge(
                row["input_wallet"], row["output_wallet"],
                txid=row["txid"], amount_btc=float(row["amount_btc"]), timestamp=row["timestamp"],
            )
    return graph


def graph_feature_rows(graph: nx.MultiDiGraph) -> list[dict[str, object]]:
    sent_amounts: dict[str, list[float]] = defaultdict(list)
    received_amounts: dict[str, list[float]] = defaultdict(list)
    for sender, receiver, data in graph.edges(data=True):
        amount = float(data["amount_btc"])
        sent_amounts[sender].append(amount)
        received_amounts[receiver].append(amount)

    rows: list[dict[str, object]] = []
    for wallet in sorted(graph.nodes()):
        in_degree = graph.in_degree(wallet)
        out_degree = graph.out_degree(wallet)
        in_neighbors = set(graph.predecessors(wallet))
        out_neighbors = set(graph.successors(wallet))
        two_hop = {
            destination
            for neighbor in out_neighbors
            for destination in graph.successors(neighbor)
            if destination != wallet
        }
        total_degree = in_degree + out_degree
        # +1 smoothing avoids undefined/infinite values for source/sink wallets.
        ratio = (in_degree + 1) / (out_degree + 1)
        fan_in = len(in_neighbors) * math.log1p(in_degree)
        fan_out = len(out_neighbors) * math.log1p(out_degree)
        balance = min(in_degree, out_degree) / max(in_degree, out_degree) if max(in_degree, out_degree) else 0.0
        chain_score = len(two_hop) * balance
        sent, received = sent_amounts[wallet], received_amounts[wallet]
        rows.append({
            "wallet_id": wallet,
            "in_degree": in_degree,
            "out_degree": out_degree,
            "total_degree": total_degree,
            "unique_in_neighbors": len(in_neighbors),
            "unique_out_neighbors": len(out_neighbors),
            "neighbor_count": len(in_neighbors | out_neighbors),
            "in_out_degree_ratio": f"{ratio:.8f}",
            "two_hop_neighbors": len(two_hop),
            "average_sent_amount": f"{sum(sent) / len(sent):.8f}" if sent else "0.00000000",
            "average_received_amount": f"{sum(received) / len(received):.8f}" if received else "0.00000000",
            "max_sent_amount": f"{max(sent):.8f}" if sent else "0.00000000",
            "max_received_amount": f"{max(received):.8f}" if received else "0.00000000",
            "fan_in_score": f"{fan_in:.8f}",
            "fan_out_score": f"{fan_out:.8f}",
            "chain_score": f"{chain_score:.8f}",
        })
    return rows


def write_features(rows: list[dict[str, object]], output_path: Path) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=FEATURE_FIELDS)
        writer.writeheader()
        writer.writerows(rows)


def main() -> None:
    parser = argparse.ArgumentParser(description="Build BTC-SCOPE wallet graph features.")
    parser.add_argument("--transactions", type=Path, default=Path("data/raw/transactions.csv"))
    parser.add_argument("--wallets", type=Path, default=Path("data/raw/wallets.csv"))
    parser.add_argument("--output", type=Path, default=Path("data/processed/wallet_graph_features.csv"))
    args = parser.parse_args()
    graph = build_graph(args.transactions, args.wallets)
    rows = graph_feature_rows(graph)
    write_features(rows, args.output)
    print(f"Graph nodes: {graph.number_of_nodes()}; edges: {graph.number_of_edges()}")
    print(f"Wrote {len(rows)} wallet graph-feature rows to {args.output}")


if __name__ == "__main__":
    main()
