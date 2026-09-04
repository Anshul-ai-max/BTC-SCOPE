"""Tests for the read-only BTC-SCOPE FastAPI layer."""

import unittest

from fastapi.testclient import TestClient

from src.api.main import app


class ApiTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.client = TestClient(app)

    def test_health(self) -> None:
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "ok"})

    def test_known_wallet_lookup(self) -> None:
        response = self.client.get("/wallet/W012109")
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["wallet_id"], "W012109")
        self.assertTrue(payload["reasons"])
        self.assertIn("behavioral_metrics", payload)
        self.assertIn("graph_metrics", payload)
        self.assertIn("anomaly_scores", payload)

    def test_unknown_wallet(self) -> None:
        self.assertEqual(self.client.get("/wallet/W999999").status_code, 404)

    def test_top_alerts(self) -> None:
        response = self.client.get("/alerts/top?limit=5")
        self.assertEqual(response.status_code, 200)
        alerts = response.json()["alerts"]
        self.assertEqual(len(alerts), 5)
        self.assertEqual(alerts, sorted(alerts, key=lambda alert: alert["risk_score"], reverse=True))

    def test_limit_validation(self) -> None:
        self.assertEqual(self.client.get("/alerts/top?limit=0").status_code, 422)
        self.assertEqual(self.client.get("/alerts/top?limit=101").status_code, 422)
