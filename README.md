# BTC-SCOPE

## AI-Powered Monitoring & Analysis of Bitcoin Transaction Traffic

BTC-SCOPE is an offline AI/ML prototype for Bitcoin transaction traffic analysis, anomaly detection, wallet/network correlation, risk scoring, and explainable investigative intelligence.

The system is designed around the **SIH26146 — AI-Powered Monitoring & Analysis of Bitcoin Transaction Traffic** requirements and uses synthetic Bitcoin transaction and network metadata for reproducible development and evaluation.

> **Prototype scope:** BTC-SCOPE is a synthetic-data research/prototyping system. It is not presented as a real-world AML decision system, wallet-attribution system, or proof of illicit activity.

## Core Capabilities

- Synthetic Bitcoin transaction and network metadata generation
- Wallet, transaction, and network-layer correlation
- Wallet-IP relationship modelling
- Transaction-network graph construction with NetworkX
- Behavioral and graph feature engineering
- Isolation Forest based unsupervised anomaly detection
- Explainable 0–100 wallet risk scoring
- Ranked investigative alert queues
- Wallet network/link analysis
- Read-only FastAPI backend
- Next.js investigation dashboard
- Offline-first architecture
- Linux deployment target

## SIH26146 Requirement Coverage

| Problem Statement Requirement | BTC-SCOPE Implementation |
|---|---|
| Bulk transaction/network metadata | Synthetic Bitcoin transaction and network datasets |
| Timestamp | Implemented |
| Source/destination IP | Implemented in network observations |
| Source/destination port | Implemented in network observations |
| TXID | Implemented |
| Wallet addresses | Represented as stable synthetic wallet IDs |
| Transaction amounts | Implemented |
| Transaction fee | Implemented |
| Script type | Implemented |
| Country / ASN | Implemented in synthetic network observations |
| Wallet-IP correlation | `wallet_ip_links.csv` |
| Entity / transaction graph | NetworkX directed transaction graph |
| Behavioral analysis | Wallet-level behavioral features |
| Graph analysis | Wallet-level graph features |
| AI/ML anomaly detection | Isolation Forest |
| Ranked alerts | Risk-scored wallet alert queue |
| Explainability | Contributing reasons for wallet risk scores |
| Dashboard | Next.js investigation dashboard |
| API | Read-only FastAPI service |
| Offline architecture | Local datasets + local processing |
| Linux deployment | Target platform; deployment packaging and testing planned |

## Repository Layout

- `data/raw/` — generated source datasets; do not commit large datasets.
- `data/processed/` — derived datasets/features; do not commit large datasets.
- `docs/data-model.md` — V1 data contract and table relationships.
- `src/data_generation/` — synthetic data generator.
- `src/features/` — feature engineering.
- `src/models/` — anomaly detection, evaluation, and risk scoring.
- `src/graph/` — transaction graph construction and analysis.
- `src/api/` — read-only application API.
- `frontend/` — Next.js investigation dashboard.
- `notebooks/` — exploratory work only.

## Data Model

The V1 generator creates five CSV datasets:

- `wallets.csv`
- `transactions.csv`
- `network_observations.csv`
- `wallet_ip_links.csv`
- `ground_truth.csv`

The data model includes transaction timestamps, wallet IDs, TXIDs, amounts, fees, script types, source/destination IPs and ports, ASN, country, and wallet-IP relationships.

See [docs/data-model.md](docs/data-model.md) for the complete schema and relationships.

### Important modelling note

The current prototype intentionally simplifies Bitcoin's UTXO structure into one directed wallet-to-wallet transfer per transaction row. This keeps the synthetic benchmark reproducible and suitable for model prototyping; it should not be interpreted as a complete representation of the Bitcoin ledger.

## Setup

The current development workflow can be run locally with Python. Linux/Ubuntu deployment is the target environment and will be documented and tested as a post-submission deployment step.

Install the Python dependencies:

```bash
python -m pip install -r requirements.txt
```

## Generate Synthetic Dataset

Run from the repository root:

```bash
python -m src.data_generation.generate_dataset --output-dir data/raw --wallet-count 5000 --transaction-count 20000 --seed 42
```

For the larger benchmark used during evaluation:

```bash
python -m src.data_generation.generate_dataset --output-dir data/raw --wallet-count 20000 --transaction-count 100000 --seed 42
```

Generated data is ignored by Git so that the repository remains lightweight.

Scenario labels are deliberate ground truth for evaluation only:

- `normal`
- `fan_in`
- `fan_out`
- `layering`
- `peel_chain`

The model pipeline does not use these labels as input features.

## Feature Engineering

Create leakage-free wallet features covering activity, flow, counterparty, timing, and network diversity:

```bash
python -m src.features.build_wallet_features --raw-dir data/raw --output data/processed/wallet_features.csv
```

`ground_truth.csv` is not read by this command.

## Graph Analysis

Build wallet-level transaction-network features:

```bash
python -m pip install -r requirements.txt

python -m src.graph.build_graph_features \
  --transactions data/raw/transactions.csv \
  --wallets data/raw/wallets.csv \
  --output data/processed/wallet_graph_features.csv
```

The graph uses a directed MultiDiGraph so repeated wallet-to-wallet transactions are retained.

See [docs/graph-features.md](docs/graph-features.md) for feature definitions.

## Statistical Anomaly Baseline

Rank wallets using an explainable, label-free statistical baseline:

```bash
python -m src.models.score_anomalies \
  --input data/processed/wallet_features.csv \
  --output data/processed/wallet_anomaly_scores.csv
```

The score uses transaction velocity, counterparty breadth, network diversity, and net-flow magnitude. It represents review priority, not proof of illicit activity.

## Combined ML Anomaly Detection

BTC-SCOPE uses a working **Isolation Forest ML model** trained without ground-truth labels.

Build the combined model dataset:

```bash
python -m src.models.build_model_dataset
```

Train the model:

```bash
python -m src.models.train_anomaly_model
```

Evaluate the saved ML scores:

```bash
python -m src.models.evaluate_ml_model
```

The pipeline combines behavioral and graph features and produces:

- `data/processed/model_features.csv`
- `models/isolation_forest.joblib`
- `data/processed/ml_anomaly_scores.csv`
- `data/processed/ml_model_evaluation.json`

Model evaluation compares ROC-AUC, PR-AUC, risk-band precision/recall/F1, and top-k review performance against the statistical baseline.

## Risk Scoring and Explainability

Create a transparent 0–100 review-priority score from existing behavioral, graph, statistical, and ML signals:

```bash
python -m src.models.risk_scoring
```

Each wallet receives:

- Risk score
- LOW / MEDIUM / HIGH risk band
- Up to five contributing reasons

The score is intended to prioritize analyst review; a high-risk score is not proof of illicit activity.

See [docs/risk-scoring.md](docs/risk-scoring.md) for the methodology and fixed weights.

## Evaluation

Evaluate saved anomaly scores against wallet-level ground truth:

```bash
python -m src.models.evaluate_anomalies \
  --scores data/processed/wallet_anomaly_scores.csv \
  --ground-truth data/raw/ground_truth.csv \
  --output data/processed/anomaly_evaluation.json
```

Ground-truth labels are used only for evaluation and are excluded from feature engineering and model inputs.

## Read-only API

Start the FastAPI service after the required processed outputs exist:

```bash
python -m uvicorn src.api.main:app --host 127.0.0.1 --port 8000
```

Available endpoints include:

| Endpoint | Purpose |
|---|---|
| `GET /health` | Verifies required processed outputs can be read |
| `GET /wallet/{wallet_id}` | Returns wallet risk score, reasons, behavioral metrics, graph metrics, and anomaly scores |
| `GET /alerts/top?limit=20` | Returns the highest-risk wallets |
| `GET /wallet/{wallet_id}/network?limit=12` | Returns bounded one-hop wallet relationships and risk context |

The API is read-only and does not read `ground_truth.csv`.

See [docs/api.md](docs/api.md) for endpoint details.

## Frontend

The repository includes a Next.js dashboard for:

- Overview of Bitcoin transaction intelligence
- Ranked alerts
- Wallet investigation
- Network/link analysis

Frontend development and production deployment commands are defined in `frontend/package.json`.

The frontend is intended to communicate with the local FastAPI service during offline deployment.

## Current Prototype Status

### Implemented

- Synthetic Bitcoin transaction and network dataset generation
- Network observations with IP, port, ASN, and country fields
- Wallet-IP relationship modelling
- Behavioral feature engineering
- Transaction graph construction
- Graph feature extraction
- Statistical anomaly baseline
- Isolation Forest anomaly detection
- Model evaluation
- Explainable risk scoring
- Ranked alert generation
- Wallet network investigation endpoint
- FastAPI backend
- Next.js dashboard

### Next Deployment Step

The post-submission deployment phase will package and test the complete BTC-SCOPE pipeline for **Ubuntu/Linux offline execution**, including a reproducible environment setup and end-to-end run instructions.

## Project Limitations

- The current benchmark uses synthetic data.
- The Bitcoin transaction representation is simplified for V1 prototyping.
- Synthetic evaluation results should not be interpreted as real-world AML performance.
- Risk scores identify activity for review; they do not establish criminality or wallet ownership.
- Real-world deployment would require validation on appropriate datasets, stronger data ingestion/correlation, and operational security controls.

## Research Direction

BTC-SCOPE is informed by research in:

- Virtual-asset AML/CFT and investigative risk
- Bitcoin transaction graph analysis
- Graph-based financial forensics
- Unsupervised anomaly detection
- Explainable investigative analytics

See the project's presentation for the selected research references and technical mapping.

## License / Project Status

BTC-SCOPE is currently a prototype developed for research, demonstration, and hackathon evaluation.
