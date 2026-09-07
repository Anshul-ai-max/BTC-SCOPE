# BTC-SCOPE frontend

This is the four-section Next.js dashboard for the synthetic BTC-SCOPE research prototype. The interface is based on the supplied Stitch export in `stitch/`; that export remains a design reference rather than a separate runtime.

## Prerequisites

- Python with the repository dependencies installed.
- Node.js 20.9+ and npm.

## Start the complete application

From the repository root, start the existing read-only FastAPI service:

```powershell
python -m uvicorn src.api.main:app --reload
```

In a second terminal, start the frontend:

```powershell
cd frontend
Copy-Item .env.example .env.local
npm install
npm run dev
```

Open `http://localhost:3000`.

## API configuration

`NEXT_PUBLIC_API_URL` defaults to `http://localhost:8000`. Set it in `.env.local` only when FastAPI runs elsewhere:

```text
NEXT_PUBLIC_API_URL=http://localhost:8000
```

The frontend uses a centralized client in `lib/api.ts`. It reads only these FastAPI endpoints:

- `GET /health`
- `GET /alerts/top?limit=…`
- `GET /wallet/{wallet_id}`
- `GET /wallet/{wallet_id}/network?limit=…`

FastAPI allows GET requests from the local Next development server. Neither the frontend nor the API reads `ground_truth.csv`.

## Verification

```powershell
npm run build
```

The dashboard's current integration verification is the Next.js production build plus the repository's Python test suite. No separate frontend test runner is configured yet; the UI is mostly API-bound composition, and the build catches the relevant TypeScript and route errors.

## Scope

The Network screen displays actual, aggregated one-hop synthetic transaction relationships returned by the read-only API. It does not claim real-world attribution, transaction history outside that view, or intelligence not present in the dataset.
