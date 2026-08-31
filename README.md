# BTC-SCOPE

Synthetic Bitcoin transaction and network-analysis project for SIH26146.

## Repository layout

- `data/raw/` — generated source datasets; do not commit large datasets.
- `data/processed/` — derived datasets/features; do not commit large datasets.
- `docs/data-model.md` — V1 data contract and table relationships.
- `src/data_generation/` — synthetic data generator.
- `src/features/` — feature engineering.
- `src/models/` — modelling code.
- `src/graph/` — graph construction and analysis.
- `src/api/` — eventual application API.
- `notebooks/` — exploratory work only.

## V1 data model

The generator will create five CSVs: `wallets`, `transactions`, `network_observations`, `wallet_ip_links`, and `ground_truth`. The precise fields and rules are in [docs/data-model.md](docs/data-model.md).

## Setup

This first version uses only the Python standard library. Run the generator from the repository root:

```powershell
python -m src.data_generation.generate_dataset --output-dir data/raw --wallet-count 5000 --transaction-count 20000 --seed 42
```

It produces the five V1 CSV files and a `generation_summary.json`. Generated data is ignored by Git, so the repository remains small.

Scenario labels are deliberate ground truth, not ML features: `normal`, `fan_in`, `fan_out`, `layering`, and `peel_chain`.
