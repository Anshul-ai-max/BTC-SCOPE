# BTC-SCOPE

**Bitcoin Transaction Intelligence & Anomaly Investigation Platform**

> AI-powered blockchain monitoring, forensic analysis, and cybersecurity intelligence interface.

---

## ⚠️ Demo Mode Notice

This frontend currently operates with **synthetic demo data** (offline dataset). No live Bitcoin network monitoring is performed. All data is clearly labelled as synthetic.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, TypeScript) |
| Styling | Tailwind CSS v4 |
| Charts | Recharts |
| Graph | React Flow |
| Icons | Lucide React |
| Animations | CSS + Tailwind |

---

## Screens

| Route | Screen |
|-------|--------|
| `/` | Command Center / Overview |
| `/alerts` | Threat Alerts |
| `/blockchain` | Wallet Investigation (`?wallet=W012109`) |
| `/network` | Entity Graph (`?focus=W012109`) |
| `/ai-intelligence` | AI Intelligence Engine |
| `/transactions` | Transaction Analysis |
| `/analytics` | Analytics Dashboard |
| `/data-ingestion` | Data Ingestion Pipeline |
| `/investigations` | Investigation Workspace |
| `/network-intel` | Network & Geo Intelligence |
| `/settings` | Platform Settings |

---

## Backend Integration

All API calls are centralized in [`lib/api.ts`](./lib/api.ts).

Each function gracefully falls back to synthetic demo data when the backend is unavailable.

To connect to your FastAPI backend:

1. Copy `.env.local.example` to `.env.local`
2. Set `NEXT_PUBLIC_API_URL` to your backend URL
3. The API functions will automatically switch from mock data to live data

---

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Build

```bash
npm run build
npm start
```

---

## Project Structure

```
btc-scope/
├── app/                    # Next.js App Router pages
│   ├── page.tsx            # Command Center
│   ├── alerts/             # Threat Alerts
│   ├── blockchain/         # Wallet Investigation
│   ├── network/            # Entity Graph
│   ├── ai-intelligence/    # AI Engine
│   ├── transactions/       # Transaction Analysis
│   ├── analytics/          # Analytics
│   ├── data-ingestion/     # Data Pipeline
│   ├── investigations/     # Investigation Workspace
│   ├── network-intel/      # Geo Intelligence
│   └── settings/           # Settings
├── components/
│   ├── layout/             # Sidebar, TopBar
│   └── ui/                 # Shared UI components
└── lib/
    ├── types.ts            # TypeScript interfaces
    ├── mockData.ts         # Synthetic demo data (replace with API)
    ├── api.ts              # Backend API service layer
    └── utils.ts            # Utility functions
```
