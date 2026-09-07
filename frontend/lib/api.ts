export type RiskBand = "LOW" | "MEDIUM" | "HIGH";

export type Alert = {
  wallet_id: string;
  risk_score: number;
  risk_band: RiskBand;
  reasons: string[];
};

export type Wallet = Alert & {
  behavioral_metrics: Record<string, number>;
  graph_metrics: Record<string, number>;
  anomaly_scores: {
    statistical: number;
    isolation_forest: number;
  };
};

export type NetworkConnection = {
  wallet_id: string;
  direction: "incoming" | "outgoing";
  transaction_count: number;
  total_amount_btc: number;
  risk_score: number | null;
  risk_band: RiskBand | null;
};

export type WalletNetwork = {
  wallet_id: string;
  risk_score: number;
  risk_band: RiskBand;
  connections: NetworkConnection[];
  connection_count: number;
};

const apiUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(message: string, public readonly status?: number) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${apiUrl}${path}`, { cache: "no-store" });
  } catch {
    throw new ApiError("BTC-SCOPE API is unavailable. Start FastAPI and check NEXT_PUBLIC_API_URL.");
  }
  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { detail?: string } | null;
    throw new ApiError(payload?.detail || `API request failed (${response.status})`, response.status);
  }
  return response.json() as Promise<T>;
}

export const btcScopeApi = {
  health: () => request<{ status: string }>("/health"),
  getAlerts: (limit = 20) => request<{ alerts: Alert[] }>(`/alerts/top?limit=${limit}`),
  getWallet: (walletId: string) => request<Wallet>(`/wallet/${encodeURIComponent(walletId)}`),
  getWalletNetwork: (walletId: string, limit = 12) =>
    request<WalletNetwork>(`/wallet/${encodeURIComponent(walletId)}/network?limit=${limit}`),
};
