# Risk scoring and explainability

`src.models.risk_scoring` creates a deterministic review-priority score; it does not determine whether a wallet is illicit.

## Method

The stage joins four existing label-free outputs on `wallet_id`: behavioral features, graph features, the statistical anomaly score, and the Isolation Forest anomaly score. It never reads `ground_truth.csv`.

Each raw signal is converted to its percentile rank across wallets (0 to 1). This prevents large raw values, such as BTC volume, from dominating smaller-scale signals. The final score is the weighted sum of these normalized signals, rescaled to 0–100.

| Signal group | Weight | Signals |
|---|---:|---|
| Existing anomaly evidence | 30% | Statistical anomaly score (16%), Isolation Forest score (14%) |
| Activity and value | 26% | Rapid transfers (10%), transaction count (8%), sent + received BTC (8%) |
| Relationship and network breadth | 21% | Counterparties (7%), IP/country/ASN diversity (7%), graph neighbors (7%) |
| Graph patterns | 23% | Fan-in (8%), fan-out (8%), chain behavior (7%) |

Bands are fixed: LOW 0–39, MEDIUM 40–69, HIGH 70–100. Explanations are the strongest positive weighted contributors, so each row contains up to five concrete behavioral reasons rather than generic text.

## Output

`data/processed/wallet_risk_scores.csv` contains wallet ID, score, band, and five ordered explanation fields.
