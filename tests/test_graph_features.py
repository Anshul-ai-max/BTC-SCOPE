"""Tests for deterministic, label-free graph feature construction."""

import csv
import math
import tempfile
import unittest
from pathlib import Path

from src.graph.build_graph_features import FEATURE_FIELDS, build_graph, graph_feature_rows, write_features


class GraphFeatureTests(unittest.TestCase):
    def test_graph_features_are_complete_and_deterministic(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            wallets = root / "wallets.csv"
            transactions = root / "transactions.csv"
            output = root / "wallet_graph_features.csv"
            wallets.write_text("wallet_id\nW1\nW2\nW3\nW4\n", encoding="utf-8")
            transactions.write_text(
                "txid,timestamp,input_wallet,output_wallet,amount_btc\n"
                "TX1,2026-01-01T00:00:00Z,W1,W2,1.0\n"
                "TX2,2026-01-01T00:01:00Z,W1,W2,2.0\n"
                "TX3,2026-01-01T00:02:00Z,W2,W3,3.0\n",
                encoding="utf-8",
            )
            graph = build_graph(transactions, wallets)
            first = graph_feature_rows(graph)
            second = graph_feature_rows(build_graph(transactions, wallets))
            write_features(first, output)

            self.assertTrue(output.exists())
            self.assertEqual(len(first), 4)
            self.assertEqual(first, second)
            self.assertEqual(graph.number_of_edges(), 3)
            self.assertEqual(set(first[0]), set(FEATURE_FIELDS))
            self.assertTrue(all(math.isfinite(float(value)) for row in first for key, value in row.items() if key != "wallet_id"))
            with output.open(newline="", encoding="utf-8") as file:
                self.assertEqual(len(list(csv.DictReader(file))), 4)
