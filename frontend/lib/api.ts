/**
 * BTC-SCOPE API Service Layer
 *
 * Architecture: PAGE → API FUNCTION → TYPED DATA → UI COMPONENT
 *
 * All functions currently return synthetic mock data.
 * To connect to the FastAPI backend, replace the fallback values with
 * real fetch() calls to `${BASE_URL}/api/...`.
 *
 * Base URL: process.env.NEXT_PUBLIC_API_URL (default: http://localhost:8000)
 */

import type {
  Wallet,
  Alert,
  Transaction,
  NetworkNode,
  NetworkEdge,
  ModelEvaluation,
  ActivityEvent,
  SystemStats,
  AnalyticsSummary,
  NetworkIntelligenceSummary,
  RiskContribution,
} from "@/types/btc-scope";

import {
  WALLETS,
  RISK_CONTRIBUTIONS_W012109,
  ALERTS,
  TRANSACTIONS,
  NETWORK_NODES,
  NETWORK_EDGES,
  NETWORK_INTEL,
  MODEL_EVALUATIONS,
  ANALYTICS_SUMMARY,
  ACTIVITY_EVENTS,
  SYSTEM_STATS,
} from "./mock-data";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

/** Generic fetch with automatic mock fallback when backend is unavailable. */
async function apiFetch<T>(path: string, fallback: T, options?: RequestInit): Promise<T> {
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as T;
  } catch {
    return fallback;
  }
}

// ─── System ───────────────────────────────────────────────────────────────────
export async function getHealth(): Promise<SystemStats> {
  return apiFetch("/api/stats", SYSTEM_STATS);
}

// ─── Wallets ──────────────────────────────────────────────────────────────────
export async function getWallets(): Promise<Wallet[]> {
  return apiFetch("/api/wallets", WALLETS);
}

export async function getWallet(walletId: string): Promise<Wallet | null> {
  return apiFetch(
    `/api/wallets/${walletId}`,
    WALLETS.find((w) => w.id === walletId) ?? null,
  );
}

export async function getWalletRiskContributions(walletId: string): Promise<RiskContribution[]> {
  // Currently only W012109 has detailed contributions; extend as needed.
  return apiFetch(
    `/api/wallets/${walletId}/contributions`,
    walletId === "W012109" ? RISK_CONTRIBUTIONS_W012109 : [],
  );
}

// ─── Alerts ───────────────────────────────────────────────────────────────────
export async function getTopAlerts(limit = 20): Promise<Alert[]> {
  return apiFetch("/api/alerts", ALERTS.slice(0, limit));
}

export async function getAlert(alertId: string): Promise<Alert | null> {
  return apiFetch(
    `/api/alerts/${alertId}`,
    ALERTS.find((a) => a.id === alertId) ?? null,
  );
}

// ─── Transactions ─────────────────────────────────────────────────────────────
export async function getTransactions(walletId?: string): Promise<Transaction[]> {
  const path = walletId ? `/api/transactions?wallet=${walletId}` : "/api/transactions";
  const fallback = walletId
    ? TRANSACTIONS.filter(
        (t) =>
          t.inputAddresses.includes(walletId) ||
          t.outputAddresses.includes(walletId),
      )
    : TRANSACTIONS;
  return apiFetch(path, fallback);
}

// ─── Network Graph ────────────────────────────────────────────────────────────
export async function getWalletNetwork(walletId?: string): Promise<{
  nodes: NetworkNode[];
  edges: NetworkEdge[];
}> {
  const path = walletId ? `/api/graph?focus=${walletId}` : "/api/graph";
  return apiFetch(path, { nodes: NETWORK_NODES, edges: NETWORK_EDGES });
}

// ─── Network Intelligence ─────────────────────────────────────────────────────
export async function getNetworkIntelligence(): Promise<NetworkIntelligenceSummary> {
  return apiFetch("/api/network-intel", NETWORK_INTEL);
}

// ─── AI Models ────────────────────────────────────────────────────────────────
export async function getModelEvaluations(): Promise<ModelEvaluation[]> {
  return apiFetch("/api/models/performance", MODEL_EVALUATIONS);
}

// ─── Analytics ────────────────────────────────────────────────────────────────
export async function getAnalytics(): Promise<AnalyticsSummary> {
  return apiFetch("/api/analytics", ANALYTICS_SUMMARY);
}

// ─── Activity ─────────────────────────────────────────────────────────────────
export async function getActivity(): Promise<ActivityEvent[]> {
  return apiFetch("/api/activity", ACTIVITY_EVENTS);
}
