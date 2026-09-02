"""Basic invariant checks for the synthetic dataset generator."""

import unittest

from src.data_generation.generate_dataset import DatasetGenerator


class DatasetGeneratorTests(unittest.TestCase):
    def test_generator_produces_linked_data(self) -> None:
        generator = DatasetGenerator(wallet_count=200, transaction_count=100, seed=7)
        generator.generate()

        transactions = generator.transactions
        transaction_ids = {row["txid"] for row in transactions}
        wallet_ids = {row["wallet_id"] for row in generator.wallet_rows()}

        self.assertEqual(len(transactions), 100)
        self.assertEqual(len(transaction_ids), 100)
        self.assertTrue(all(row["input_wallet"] in wallet_ids for row in transactions))
        self.assertTrue(all(row["output_wallet"] in wallet_ids for row in transactions))
        self.assertTrue(all(row["input_wallet"] != row["output_wallet"] for row in transactions))
        self.assertTrue({row["txid"] for row in generator.observations}.issubset(transaction_ids))

    def test_anomalous_wallets_are_rare(self) -> None:
        generator = DatasetGenerator(wallet_count=500, transaction_count=1_000, seed=11)
        generator.generate()
        normal_share = sum(scenario == "normal" for scenario in generator.wallet_scenarios.values()) / 500
        self.assertGreaterEqual(normal_share, 0.90)
        self.assertLessEqual(normal_share, 0.95)
        self.assertEqual(len(generator.ground_truth_rows()), 500 + len(generator.labels))
