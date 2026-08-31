"""Basic invariant checks for the synthetic dataset generator."""

from src.data_generation.generate_dataset import DatasetGenerator


def test_generator_produces_linked_data() -> None:
    generator = DatasetGenerator(wallet_count=200, transaction_count=100, seed=7)
    generator.generate()

    transactions = generator.transactions
    transaction_ids = {row["txid"] for row in transactions}
    wallet_ids = {row["wallet_id"] for row in generator.wallet_rows()}

    assert len(transactions) == 100
    assert len(transaction_ids) == 100
    assert all(row["input_wallet"] in wallet_ids for row in transactions)
    assert all(row["output_wallet"] in wallet_ids for row in transactions)
    assert all(row["input_wallet"] != row["output_wallet"] for row in transactions)
    assert {row["txid"] for row in generator.observations}.issubset(transaction_ids)
