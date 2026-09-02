"""Tests for label-free anomaly-score evaluation."""

import unittest

from src.models.evaluate_anomalies import evaluate_rows, roc_auc


class EvaluationTests(unittest.TestCase):
    def test_metrics_and_top_k(self) -> None:
        rows = [
            {"wallet_id": "W1", "anomaly_score": "90"},
            {"wallet_id": "W2", "anomaly_score": "80"},
            {"wallet_id": "W3", "anomaly_score": "10"},
            {"wallet_id": "W4", "anomaly_score": "5"},
        ]
        report = evaluate_rows(rows, {"W1", "W3"})
        threshold = report["score_thresholds"]["80"]
        self.assertEqual(threshold["confusion_matrix"], {"tp": 1, "fp": 1, "tn": 1, "fn": 1})
        self.assertEqual(report["top_k_percentages"]["1%"]["reviewed_wallets"], 1)
        self.assertEqual(roc_auc([1, 0], [0.9, 0.1]), 1.0)
