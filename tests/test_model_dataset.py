"""Tests for the leakage-free combined model dataset."""

import csv
import tempfile
import unittest
from pathlib import Path

from src.models.build_model_dataset import build_model_rows, write_rows


class ModelDatasetTests(unittest.TestCase):
    def test_combines_wallet_features_without_labels(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            behavior, graph, output = root / "behavior.csv", root / "graph.csv", root / "model.csv"
            behavior.write_text("wallet_id,tx_count\nW1,3\nW2,4\n", encoding="utf-8")
            graph.write_text("wallet_id,in_degree\nW1,1\nW2,2\n", encoding="utf-8")
            rows, fields = build_model_rows(behavior, graph)
            write_rows(rows, fields, output)
            self.assertEqual(len(rows), 2)
            self.assertEqual(fields, ["wallet_id", "tx_count", "in_degree"])
            self.assertNotIn("ground_truth", fields)
            with output.open(newline="", encoding="utf-8") as file:
                self.assertEqual(len(list(csv.DictReader(file))), 2)
