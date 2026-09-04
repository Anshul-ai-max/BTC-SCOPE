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

If a required processed output is missing, the API returns HTTP 500 with the missing filename.
