"""Tests for reproducible, finite Isolation Forest outputs."""

import unittest

import numpy as np

from src.models.train_anomaly_model import VALID_RISK_BANDS, fit_and_score, risk_bands


class AnomalyModelTests(unittest.TestCase):
    def test_scores_are_finite_and_deterministic(self) -> None:
        matrix = np.array([[0.0, 1.0], [0.1, 1.1], [0.2, 1.2], [9.0, 9.0], [0.3, 1.3]] * 5)
        _, first = fit_and_score(matrix)
        _, second = fit_and_score(matrix)
        self.assertTrue(np.isfinite(first).all())
        self.assertTrue(np.allclose(first, second))
        self.assertTrue(set(risk_bands(first)).issubset(VALID_RISK_BANDS))
