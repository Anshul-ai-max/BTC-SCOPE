# BTC-SCOPE handoff

## Objective

SIH26146 — Bitcoin Transaction Traffic Analysis. BTC-SCOPE is a reproducible synthetic-data prototype for ranking and analyzing potentially unusual wallet behavior. It is not a real-world AML or attribution system.

## Architecture and repository structure

```text
data/raw/          generated wallets, transactions, observations, links, ground truth
data/processed/    behavioral, graph, model, score, and evaluation outputs
docs/              data contract, graph definitions, and this handoff
src/data_generation synthetic network generator
src/features/      behavioral wallet features
src/graph/         NetworkX graph features
src/models/        baseline, combined-data, Isolation Forest, and evaluation modules
tests/             standard-library unittest suite
models/            locally saved Isolation Forest artifact
```

## Data model

The generator produces five CSV files:

- `wallets.csv`: wallet identifier, creation time, wallet type, evaluation label.
- `transactions.csv`: directed transfer with transaction ID, timestamp, sender, receiver, amount, fee, and script type.
- `network_observations.csv`: transaction-linked source/destination network observations.
- `wallet_ip_links.csv`: aggregated wallet-to-IP links.
- `ground_truth.csv`: evaluation-only wallet and transaction scenario labels.

## Synthetic generator

`src/data_generation/generate_dataset.py` is seed-reproducible. The current dataset uses seed `42`, 20,000 wallets, and 100,000 transactions. Wallet labels are deliberately imbalanced:

- normal: 18,400 (92%)
- fan-in: 400 (2%)
- fan-out: 400 (2%)
- layering: 400 (2%)
- peel-chain: 400 (2%)

Legitimate high-activity and batch-payment normal wallets are included so normal behavior is heterogeneous. Transaction-level scenario distribution is recorded in `data/raw/generation_summary.json`.

## Pipelines

### Behavioral features

`src/features/build_wallet_features.py` creates `wallet_features.csv` from raw transactions and network observations. It includes transaction counts, values, counterparties, time activity, and network diversity.

### Graph analysis

`src/graph/build_graph_features.py` creates a NetworkX `MultiDiGraph`, preserving repeated transactions between a wallet pair. It produces `wallet_graph_features.csv` with degrees, neighbor counts, two-hop reach, transaction amount summaries, fan-in/out scores, and chain score. Current graph: 20,000 nodes and 100,000 edges. See `docs/graph-features.md`.

### Statistical anomaly baseline

`src/models/score_anomalies.py` is a transparent percentile-rank baseline. It scores behavioral features only and produces `wallet_anomaly_scores.csv`.

### Isolation Forest

`src/models/build_model_dataset.py` merges behavioral and graph features on `wallet_id` without labels. `src/models/train_anomaly_model.py` scales numeric features and trains a seed-fixed (`42`) Isolation Forest, saving `models/isolation_forest.joblib` and `ml_anomaly_scores.csv`.

## Evaluation and limitations

`ground_truth.csv` is read only by `evaluate_anomalies.py` and `evaluate_ml_model.py`.

Current synthetic evaluation:

- Statistical baseline ROC-AUC: 0.977155; PR-AUC reported in the ML comparison: 0.607938.
- Isolation Forest ROC-AUC: 0.979008; PR-AUC: 0.608428.
- At a top-5% review queue, the ML model has precision 0.632 and recall 0.395; the baseline has precision 0.631 and recall 0.394.
- At top 10%, the baseline is stronger (precision 0.786, recall 0.983) than the ML model (precision 0.731, recall 0.913).

These results are optimistic because the data is synthetic and scenarios are designed into the generator. Scores are review priorities, never proof of illicit activity. Risk-band definitions also differ between the baseline and ML model, so compare equal top-k queues rather than risk-band metrics alone.

## Ground-truth leakage rules

- Never read `ground_truth.csv` in generator, behavioral features, graph features, model-dataset construction, or model fitting.
- Never include `ground_truth`, `scenario`, labels, or label-derived fields in `model_features.csv`.
- Use `ground_truth.csv` only for post-scoring evaluation scripts and tests of evaluation behavior.

## Tests

Run all tests with:

```powershell
python -m unittest discover -s tests -v
```

Current suite: generator distribution and integrity, evaluation metrics, graph feature determinism/completeness, model-dataset leakage prevention, and Isolation Forest determinism/finite scores.

## Current generated outputs

`data/raw/` contains `wallets.csv`, `transactions.csv`, `network_observations.csv`, `wallet_ip_links.csv`, `ground_truth.csv`, and `generation_summary.json`.

`data/processed/` contains `wallet_features.csv`, `wallet_graph_features.csv`, `model_features.csv`, `wallet_anomaly_scores.csv`, `ml_anomaly_scores.csv`, `anomaly_evaluation.json`, and `ml_model_evaluation.json`.

`models/isolation_forest.joblib` is the local trained model artifact. Generated data and model artifacts are ignored by Git.

## Reproduction commands

```powershell
python -m pip install -r requirements.txt
python -m src.data_generation.generate_dataset --output-dir data/raw --wallet-count 20000 --transaction-count 100000 --seed 42
python -m src.features.build_wallet_features
python -m src.graph.build_graph_features
python -m src.models.score_anomalies
python -m src.models.evaluate_anomalies
python -m src.models.build_model_dataset
python -m src.models.train_anomaly_model
python -m src.models.evaluate_ml_model
python -m unittest discover -s tests -v
```

## Completed work

- Synthetic Bitcoin traffic data model and reproducible generator.
- Behavioral and NetworkX graph feature pipelines.
- Explainable statistical anomaly baseline and Isolation Forest model.
- Evaluation reports and automated tests.
- Private GitHub repository with source, tests, documentation, and dependency metadata.

## Remaining work

- Design an approved risk-scoring policy and explainability output.
- Build an API.
- Build a dashboard.
- Prepare the SIH demo, walkthrough, and evidence pack.

## Do not modify without approval

Future agents must not modify these files or the data/model semantics without explicit approval:

- `src/data_generation/generate_dataset.py`
- `src/features/build_wallet_features.py`
- `src/graph/build_graph_features.py`
- `src/models/score_anomalies.py`
- `src/models/evaluate_anomalies.py`
- `src/models/build_model_dataset.py`
- `src/models/train_anomaly_model.py`
- `src/models/evaluate_ml_model.py`
- `docs/data-model.md`
- `docs/graph-features.md`
- `tests/`

Do not commit generated CSV files or `models/isolation_forest.joblib`.
