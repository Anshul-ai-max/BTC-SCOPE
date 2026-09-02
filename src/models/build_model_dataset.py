"""Combine behavioral and graph features into a leakage-free model table."""

from __future__ import annotations

import argparse
import csv
from pathlib import Path


FORBIDDEN_COLUMNS = {"ground_truth", "scenario", "label", "is_anomalous", "target"}


def read_rows(path: Path) -> tuple[list[dict[str, str]], list[str]]:
    with path.open(newline="", encoding="utf-8") as file:
        reader = csv.DictReader(file)
        fields = reader.fieldnames or []
        if "wallet_id" not in fields:
            raise ValueError(f"{path} must contain wallet_id")
        forbidden = FORBIDDEN_COLUMNS.intersection(fields)
        if forbidden:
            raise ValueError(f"Label-derived columns are not allowed: {sorted(forbidden)}")
        return list(reader), fields


def build_model_rows(behavior_path: Path, graph_path: Path) -> tuple[list[dict[str, str]], list[str]]:
    behavior_rows, behavior_fields = read_rows(behavior_path)
    graph_rows, graph_fields = read_rows(graph_path)
    graph_by_wallet = {row["wallet_id"]: row for row in graph_rows}
    graph_features = [field for field in graph_fields if field != "wallet_id"]
    overlapping = (set(behavior_fields) - {"wallet_id"}).intersection(graph_features)
    if overlapping:
        raise ValueError(f"Duplicate feature names: {sorted(overlapping)}")
    fields = [*behavior_fields, *graph_features]
    rows = []
    for row in behavior_rows:
        graph_row = graph_by_wallet.get(row["wallet_id"])
        if graph_row is not None:
            rows.append({**row, **{feature: graph_row[feature] for feature in graph_features}})
    return rows, fields


def write_rows(rows: list[dict[str, str]], fields: list[str], output: Path) -> None:
    output.parent.mkdir(parents=True, exist_ok=True)
    with output.open("w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=fields)
        writer.writeheader()
        writer.writerows(rows)


def main() -> None:
    parser = argparse.ArgumentParser(description="Build combined BTC-SCOPE model features.")
    parser.add_argument("--behavior", type=Path, default=Path("data/processed/wallet_features.csv"))
    parser.add_argument("--graph", type=Path, default=Path("data/processed/wallet_graph_features.csv"))
    parser.add_argument("--output", type=Path, default=Path("data/processed/model_features.csv"))
    args = parser.parse_args()
    rows, fields = build_model_rows(args.behavior, args.graph)
    write_rows(rows, fields, args.output)
    print(f"Wrote {len(rows)} wallets × {len(fields) - 1} features to {args.output}")


if __name__ == "__main__":
    main()
