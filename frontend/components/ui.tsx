import { ReactNode } from "react";
import type { RiskBand } from "../lib/api";

export function RiskBadge({ band }: { band: RiskBand | string }) {
  return <span className={`risk-badge ${String(band).toLowerCase()}`}>{band} RISK</span>;
}

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`panel ${className}`}>{children}</section>;
}

export function LoadingState({ label = "Loading BTC-SCOPE data…" }: { label?: string }) {
  return <div className="state-card loading"><span className="spinner" />{label}</div>;
}

export function ErrorState({ message }: { message: string }) {
  return <div className="state-card error-state"><strong>Unable to load data</strong><span>{message}</span></div>;
}

export const labelFor = (key: string) => ({
  tx_count: "Transactions", outgoing_tx_count: "Outgoing transactions", incoming_tx_count: "Incoming transactions",
  sent_btc: "BTC sent", received_btc: "BTC received", net_flow_btc: "Net BTC flow",
  unique_counterparties: "Unique counterparties", rapid_tx_pairs_15m: "Rapid transfer pairs (15 min)",
  ip_count: "Observed IP identities", country_count: "Countries", asn_count: "Network ASNs",
  in_degree: "Incoming transfer edges", out_degree: "Outgoing transfer edges", neighbor_count: "Connected wallets",
  fan_in_score: "Fan-in pattern", fan_out_score: "Fan-out pattern", chain_score: "Chain pattern",
}[key] || key.replaceAll("_", " "));

export function formatMetric(key: string, value: number): string {
  if (key.includes("btc")) return `${value.toLocaleString(undefined, { maximumFractionDigits: 4 })} BTC`;
  if (key.includes("score")) return value.toFixed(2);
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}
