/** Typed client for the read-only BTC-SCOPE FastAPI service. */

import type { Alert, AnalyticsSummary, ActivityEvent, ModelEvaluation, NetworkEdge, NetworkIntelligenceSummary, NetworkNode, SystemStats, Transaction, Wallet } from "@/types/btc-scope";

const BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, { headers: { Accept: "application/json" }, cache: "no-store" });
  } catch {
    throw new ApiError(0, "BTC-SCOPE API is unreachable. Start FastAPI or check NEXT_PUBLIC_API_URL.");
  }
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { detail?: string } | null;
    throw new ApiError(response.status, body?.detail ?? `API request failed (${response.status}).`);
  }
  return response.json() as Promise<T>;
}

type RawWallet = {
  wallet_id: string; risk_score: number; risk_band: "LOW" | "MEDIUM" | "HIGH"; reasons: string[];
  created_at: string; last_seen: string;
  behavioral_metrics: Record<string, number>; graph_metrics: Record<string, number>;
  anomaly_scores: { statistical: number; isolation_forest: number };
};

function numberAt(row: Record<string, number>, key: string) { return row[key] ?? 0; }

function toWallet(raw: RawWallet): Wallet {
  const behavior = raw.behavioral_metrics;
  const graph = raw.graph_metrics;
  return {
    id: raw.wallet_id, riskScore: raw.risk_score, riskBand: raw.risk_band,
    totalTransactions: numberAt(behavior, "tx_count"),
    totalBTC: numberAt(behavior, "sent_btc") + numberAt(behavior, "received_btc"),
    firstSeen: raw.created_at, lastSeen: raw.last_seen, flagReasons: raw.reasons,
    behavioralFeatures: {
      transactionFrequency: numberAt(behavior, "tx_count") / Math.max(1, numberAt(behavior, "active_days")),
      avgTransactionAmount: numberAt(behavior, "avg_sent_btc"),
      maxTransactionAmount: numberAt(graph, "max_sent_amount"),
      rapidActivityScore: numberAt(behavior, "rapid_tx_pairs_15m") / Math.max(1, numberAt(behavior, "tx_count") - 1),
      fanInRatio: numberAt(graph, "fan_in_score"), fanOutRatio: numberAt(graph, "fan_out_score"),
      transactionCount: numberAt(behavior, "tx_count"),
      incomingTransactionCount: numberAt(behavior, "incoming_tx_count"),
      outgoingTransactionCount: numberAt(behavior, "outgoing_tx_count"),
      sentBTC: numberAt(behavior, "sent_btc"),
      receivedBTC: numberAt(behavior, "received_btc"),
      uniqueCounterparties: numberAt(behavior, "unique_counterparties"),
      rapidTransactionPairs15m: numberAt(behavior, "rapid_tx_pairs_15m"),
      ipCount: numberAt(behavior, "ip_count"),
      countryCount: numberAt(behavior, "country_count"),
      asnCount: numberAt(behavior, "asn_count"),
    },
    graphFeatures: {
      degree: numberAt(graph, "total_degree"), inDegree: numberAt(graph, "in_degree"), outDegree: numberAt(graph, "out_degree"),
      neighborCount: numberAt(graph, "neighbor_count"), twoHopNeighbors: numberAt(graph, "two_hop_neighbors"), fanInScore: numberAt(graph, "fan_in_score"),
      fanOutScore: numberAt(graph, "fan_out_score"), chainScore: numberAt(graph, "chain_score"),
    },
    anomalyScores: { statisticalAnomaly: raw.anomaly_scores.statistical, isolationForest: raw.anomaly_scores.isolation_forest, overallRisk: raw.risk_score },
  };
}

export async function getHealth(): Promise<SystemStats> {
  const data = await request<{ status: "OPERATIONAL"; wallet_count: number; transaction_count: number; risk_distribution: { high: number; medium: number; low: number } }>("/stats");
  return { totalWallets: data.wallet_count, totalTransactions: data.transaction_count, highRiskWallets: data.risk_distribution.high, mediumRiskWallets: data.risk_distribution.medium, lowRiskWallets: data.risk_distribution.low, systemStatus: data.status };
}

export async function getWallets(limit = 100): Promise<Wallet[]> {
  const data = await request<{ wallets: RawWallet[] }>(`/wallets?limit=${limit}`);
  return data.wallets.map(toWallet);
}

export async function getWallet(walletId: string): Promise<Wallet> {
  return toWallet(await request<RawWallet>(`/wallet/${encodeURIComponent(walletId)}`));
}

export async function getTopAlerts(limit = 20): Promise<Alert[]> {
  const data = await request<{ alerts: Array<{ wallet_id: string; risk_score: number; risk_band: "LOW" | "MEDIUM" | "HIGH"; reasons: string[]; timestamp: string; tx_count: number }> }>(`/alerts/top?limit=${limit}`);
  return data.alerts.map((alert) => ({ id: alert.wallet_id, walletId: alert.wallet_id, riskScore: alert.risk_score, riskBand: alert.risk_band, reasons: alert.reasons, timestamp: alert.timestamp, status: "NEW", detectionType: alert.reasons[0] ?? "Wallet risk score", txCount: alert.tx_count }));
}

export async function getTransactions(walletId?: string, limit = 50): Promise<{ transactions: Transaction[]; total: number }> {
  const query = new URLSearchParams({ limit: String(limit) });
  if (walletId) query.set("wallet", walletId);
  const data = await request<{ transactions: Array<{ txid: string; timestamp: string; amount_btc: number; fee_btc: number; input_wallet: string; output_wallet: string; sender_risk_score: number | null; sender_risk_band: "LOW" | "MEDIUM" | "HIGH" | null; sender_reason: string | null }>; total: number }>(`/transactions?${query}`);
  return { total: data.total, transactions: data.transactions.map((transaction) => ({ txid: transaction.txid, timestamp: transaction.timestamp, amount: transaction.amount_btc, fee: transaction.fee_btc, inputAddresses: [transaction.input_wallet], outputAddresses: [transaction.output_wallet], riskScore: transaction.sender_risk_score ?? 0, flagged: transaction.sender_risk_band === "HIGH", detectionReason: transaction.sender_reason ?? undefined })) };
}

export async function getWalletNetwork(walletId?: string): Promise<{ nodes: NetworkNode[]; edges: NetworkEdge[]; focusWalletId: string }> {
  const data = await request<{ focus_wallet_id: string; nodes: Array<{ wallet_id: string; risk_score: number | null; risk_band: "LOW" | "MEDIUM" | "HIGH" | null; connections: number }>; edges: Array<{ source: string; target: string; direction: "incoming" | "outgoing"; amount_btc: number }> }>(`/graph${walletId ? `?focus=${encodeURIComponent(walletId)}` : ""}`);
  return { focusWalletId: data.focus_wallet_id, nodes: data.nodes.map((node) => ({ id: node.wallet_id, type: "wallet", riskBand: node.risk_band ?? "LOW", riskScore: node.risk_score ?? 0, label: node.wallet_id, connections: node.connections })), edges: data.edges.map((edge, index) => ({ id: `${edge.source}-${edge.target}-${index}`, source: edge.source, target: edge.target, amount: edge.amount_btc, direction: edge.direction === "outgoing" ? "out" : "in" })) };
}

export async function getNetworkIntelligence(): Promise<NetworkIntelligenceSummary> {
  const data = await request<{ observed_ip_count: number; country_count: number; high_risk_ip_count: number; asn_count: number; countries: Array<{ country: string; ip_count: number; transaction_count: number; high_risk_transaction_count: number; risk_band: "LOW" | "HIGH" }> }>("/network-intel");
  return { observedIPs: data.observed_ip_count, countries: data.country_count, suspiciousIPs: data.high_risk_ip_count, asns: data.asn_count, geoEntries: data.countries.map((country) => ({ country: country.country, flag: "", ips: country.ip_count, transactions: country.transaction_count, suspicious: country.high_risk_transaction_count, riskBand: country.risk_band })) };
}

export async function getModelEvaluations(): Promise<ModelEvaluation[]> {
  const data = await request<{ evaluations: Array<{ model_name: string; roc_auc?: number; pr_auc?: number; precision_at_5?: number; recall_at_5?: number; evaluation_source: string }> }>("/models/performance");
  return data.evaluations.map((model) => ({ modelName: model.model_name, rocAuc: model.roc_auc, prAuc: model.pr_auc, precisionAt5: model.precision_at_5, recallAt5: model.recall_at_5, lastEvaluated: model.evaluation_source, version: "offline evaluation" }));
}

export async function getAnalytics(): Promise<AnalyticsSummary> {
  const data = await request<{ wallet_count: number; transaction_count: number; risk_distribution: AnalyticsSummary["riskDistribution"]; transaction_timeline: Array<{ date: string; low_risk_sender_transactions: number; medium_risk_sender_transactions: number; high_risk_sender_transactions: number }>; monthly_wallet_risk_distribution: AnalyticsSummary["monthlyRiskTrend"] }>("/analytics");
  return { totalWallets: data.wallet_count, totalTransactions: data.transaction_count, riskDistribution: data.risk_distribution, transactionTimeline: data.transaction_timeline.map((row) => ({ date: row.date, normal: row.low_risk_sender_transactions, suspicious: row.medium_risk_sender_transactions, flagged: row.high_risk_sender_transactions })), monthlyRiskTrend: data.monthly_wallet_risk_distribution, modelComparison: await getModelEvaluations() };
}

export async function getActivity(): Promise<ActivityEvent[]> {
  const data = await request<{ events: Array<{ id: string; timestamp: string; type: "detection"; entity_id: string; description: string; risk_band: "HIGH"; risk_score: number }> }>("/activity");
  return data.events.map((event) => ({ id: event.id, timestamp: event.timestamp, type: event.type, entityId: event.entity_id, description: event.description, riskBand: event.risk_band, riskScore: event.risk_score }));
}
