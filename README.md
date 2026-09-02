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

It produces the five V1 CSV files and a `generation_summary.json`. Generated data is ignored by Git, so the repository remains small. The generator assigns roughly 92% of wallets as normal and 8% to scenario-driven anomalous behavior; the summary reports both wallet- and transaction-level scenario distributions.

Scenario labels are deliberate ground truth, not ML features: `normal`, `fan_in`, `fan_out`, `layering`, and `peel_chain`.

## Feature engineering

Create leakage-free wallet features (activity, flow, counterparty, timing, and network diversity):

```powershell
python -m src.features.build_wallet_features --raw-dir data/raw --output data/processed/wallet_features.csv
```

`ground_truth.csv` is not read by this command. It is used only later to evaluate a model.

## Anomaly scoring

Rank wallets using an explainable, label-free statistical baseline:

```powershell
python -m src.models.score_anomalies --input data/processed/wallet_features.csv --output data/processed/wallet_anomaly_scores.csv
```

The score uses transaction velocity, counterparty breadth, network diversity, and net-flow magnitude. It is a review priority, not proof of illicit activity.

## Evaluation

Evaluate saved scores against wallet-level ground truth. Labels are used only in this stage:

```powershell
python -m src.models.evaluate_anomalies --scores data/processed/wallet_anomaly_scores.csv --ground-truth data/raw/ground_truth.csv --output data/processed/anomaly_evaluation.json
```

The JSON report contains ROC-AUC, confusion matrices, precision, recall, and F1 at score thresholds (50/60/70/80) and top-k review queues (1%, 5%, 10%, 20%).
