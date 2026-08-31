# BTC-SCOPE V1 data model

All timestamps use UTC in ISO 8601 format. IDs are stable strings. Generated data belongs in `data/raw`; the `ground_truth` file is excluded from feature engineering and model inputs.

## `wallets.csv`

One row per synthetic wallet.

| Field | Type | Constraint | Meaning |
|---|---|---|---|
| `wallet_id` | string | primary key, e.g. `W000001` | Wallet identifier |
| `created_at` | datetime | required | First simulated creation time |
| `wallet_type` | string | required | `personal`, `exchange`, `merchant`, or `service` |
| `ground_truth` | string | required | Scenario label used only for evaluation |

## `transactions.csv`

One directed transfer per row. This deliberately simplifies Bitcoin's UTXO structure for the first model version.

| Field | Type | Constraint | Meaning |
|---|---|---|---|
| `txid` | string | primary key, e.g. `TX000001` | Transaction identifier |
| `timestamp` | datetime | required | Simulated broadcast time |
| `input_wallet` | string | FK → `wallets.wallet_id` | Sending wallet |
| `output_wallet` | string | FK → `wallets.wallet_id`; different from sender | Receiving wallet |
| `amount_btc` | decimal | > 0 | Transfer amount |
| `fee_btc` | decimal | >= 0 | Transaction fee |
| `script_type` | string | required | `P2WPKH`, `P2PKH`, or `P2TR` |

## `network_observations.csv`

Potentially multiple observations may relate to a transaction.

| Field | Type | Constraint | Meaning |
|---|---|---|---|
| `observation_id` | string | primary key, e.g. `OBS000001` | Observation identifier |
| `timestamp` | datetime | required | Observation time |
| `txid` | string | FK → `transactions.txid` | Observed transaction |
| `src_ip` | string | required | Source node IP address |
| `dst_ip` | string | required | Destination node IP address |
| `src_port` | integer | 1–65535 | Source port |
| `dst_port` | integer | 1–65535 | Destination port, normally 8333 |
| `asn` | string | required | Source network ASN, e.g. `AS12345` |
| `country` | string | ISO 3166-1 alpha-2 | Source country |

## `wallet_ip_links.csv`

An inferred wallet-to-IP relationship, aggregated across observations.

| Field | Type | Constraint | Meaning |
|---|---|---|---|
| `wallet_id` | string | FK → `wallets.wallet_id` | Wallet |
| `ip` | string | required | Linked IP address |
| `first_seen` | datetime | required | First linked observation |
| `last_seen` | datetime | >= `first_seen` | Last linked observation |
| `observation_count` | integer | > 0 | Number of supporting observations |

Composite key: (`wallet_id`, `ip`).

## `ground_truth.csv`

Evaluation-only labels. Do not merge this file into ML input features.

| Field | Type | Constraint | Meaning |
|---|---|---|---|
| `entity_id` | string | required | Labelled wallet or transaction ID |
| `entity_type` | string | `wallet` or `transaction` | Entity class |
| `scenario` | string | required | `normal`, `fan_in`, `fan_out`, `layering`, or `peel_chain` |
| `start_time` | datetime | required | Scenario start |
| `end_time` | datetime | >= `start_time` | Scenario end |

## Relationships

```text
wallets (1) ──< transactions >── (1) wallets
                    |
                    └──< network_observations

wallets (1) ──< wallet_ip_links
ground_truth labels wallets and transactions
```
