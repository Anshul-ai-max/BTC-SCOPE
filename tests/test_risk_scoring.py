"""Tests for deterministic, ground-truth-free wallet risk scoring."""

import math
import unittest

from src.models.risk_scoring import OUTPUT_FIELDS, build_risk_rows


class RiskScoringTests(unittest.TestCase):
    def test_risk_scores_are_complete_finite_and_deterministic(self) -> None:
        behavioral = {
            "W1": {"tx_count": "10", "rapid_tx_pairs_15m": "2", "sent_btc": "5", "received_btc": "3", "unique_counterparties": "4", "ip_count": "1", "country_count": "1", "asn_count": "1"},
            "W2": {"tx_count": "1", "rapid_tx_pairs_15m": "0", "sent_btc": "0", "received_btc": "1", "unique_counterparties": "1", "ip_count": "0", "country_count": "0", "asn_count": "0"},
        }
        graph = {"W1": {"fan_in_score": "8", "fan_out_score": "7", "chain_score": "6", "neighbor_count": "5"}, "W2": {"fan_in_score": "0", "fan_out_score": "0", "chain_score": "0", "neighbor_count": "1"}}
        baseline = {"W1": {"anomaly_score": "90"}, "W2": {"anomaly_score": "10"}}
        ml = {"W1": {"anomaly_score": "0.2"}, "W2": {"anomaly_score": "-0.1"}}
        first = build_risk_rows(behavioral, graph, baseline, ml)
        second = build_risk_rows(behavioral, graph, baseline, ml)
        self.assertEqual(first, second)
        self.assertEqual(len(first), 2)
        self.assertEqual(set(first[0]), set(OUTPUT_FIELDS))
        for row in first:
            self.assertTrue(0 <= float(row["risk_score"]) <= 100)
            self.assertTrue(math.isfinite(float(row["risk_score"])))
            self.assertIn(row["risk_band"], {"LOW", "MEDIUM", "HIGH"})
            self.assertTrue(row["reason_1"])
