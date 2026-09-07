# API

The BTC-SCOPE API is read-only. It reads processed CSV outputs only and never reads `ground_truth.csv`.

Start it from the repository root:

```powershell
python -m uvicorn src.api.main:app --reload
```

| Endpoint | Purpose |
|---|---|
| `GET /health` | Verifies the required processed CSV files can be read. |
| `GET /wallet/{wallet_id}` | Returns a wallet's risk score, reasons, selected behavioral and graph metrics, and both anomaly scores. Unknown wallets return 404. |
| `GET /alerts/top?limit=20` | Returns the highest-risk wallets. `limit` must be 1–100; invalid values return 422. |
| `GET /wallet/{wallet_id}/network?limit=12` | Returns up to 20 real one-hop synthetic transaction relationships, including direction, aggregated amount, and the neighbor's existing risk score/band. |

If a required processed output is missing, the API returns HTTP 500 with the missing filename.

For local frontend development, CORS permits read-only requests from `http://localhost:3000` and `http://127.0.0.1:3000`. The network endpoint reads `transactions.csv` only to aggregate graph edges; it never reads `ground_truth.csv`.
