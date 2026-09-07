"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { AppShell } from "../../components/AppShell";
import { ErrorState, LoadingState, Panel, RiskBadge } from "../../components/ui";
import { ApiError, NetworkConnection, WalletNetwork, btcScopeApi } from "../../lib/api";

const DEFAULT_WALLET = "W012109";

export default function NetworkPage() {
  return <Suspense fallback={<AppShell><LoadingState label="Preparing network view…" /></AppShell>}><NetworkContent /></Suspense>;
}

function NetworkContent() {
  const search = useSearchParams();
  const walletId = (search.get("wallet") || DEFAULT_WALLET).toUpperCase();
  const [network, setNetwork] = useState<WalletNetwork | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { btcScopeApi.getWalletNetwork(walletId).then(setNetwork).catch((cause: ApiError) => setError(cause.message)); }, [walletId]);
  return <AppShell><div className="page-heading network-heading"><div><h1>Wallet Network</h1><p>One-hop transaction relationships aggregated from the existing synthetic transaction data.</p></div><Link href={`/wallet/${walletId}`} className="button quiet">Investigate Wallet →</Link></div>{error ? <ErrorState message={error} /> : !network ? <LoadingState label="Loading transaction network…" /> : <NetworkView network={network} />}</AppShell>;
}

function NetworkView({ network }: { network: WalletNetwork }) {
  const incoming = network.connections.filter((node) => node.direction === "incoming");
  const outgoing = network.connections.filter((node) => node.direction === "outgoing");
  return <div className="network-layout"><div><Panel className="graph-panel"><div className="graph-toolbar"><span>⌕ {network.wallet_id}</span><div><span className="legend high" />High <span className="legend medium" />Medium <span className="legend low" />Low</div></div><div className="network-canvas"><svg className="network-lines" viewBox="0 0 1000 620" preserveAspectRatio="none" aria-hidden="true"><defs><marker id="arrow-in" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8" fill="#00f0ff" /></marker><marker id="arrow-out" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8" fill="#ffb4ab" /></marker></defs>{network.connections.map((connection, index) => <line key={`${connection.direction}-${connection.wallet_id}`} x1={connection.direction === "incoming" ? 150 : 850} y1={nodeY(index, connection.direction)} x2="500" y2="310" stroke={connection.direction === "incoming" ? "#00f0ff" : "#ffb4ab"} strokeWidth={Math.min(5, 1 + connection.transaction_count / 2)} strokeDasharray={connection.direction === "incoming" ? "7 6" : undefined} markerEnd={connection.direction === "incoming" ? "url(#arrow-in)" : "url(#arrow-out)"} opacity=".75" />)}</svg><Node className="selected" walletId={network.wallet_id} score={network.risk_score} band={network.risk_band} /><div className="node-column incoming">{incoming.map((node, index) => <Node key={`in-${node.wallet_id}`} walletId={node.wallet_id} score={node.risk_score} band={node.risk_band} detail={`${node.total_amount_btc.toFixed(2)} BTC in · ${node.transaction_count} tx`} />)}</div><div className="node-column outgoing">{outgoing.map((node, index) => <Node key={`out-${node.wallet_id}`} walletId={node.wallet_id} score={node.risk_score} band={node.risk_band} detail={`${node.total_amount_btc.toFixed(2)} BTC out · ${node.transaction_count} tx`} />)}</div></div><p className="graph-caption">Arrows use actual transfer direction. Only the top {network.connections.length} aggregated one-hop relationships are displayed; no labels or intelligence are inferred.</p></Panel><div className="network-summary"><Summary label="Connections returned" value={network.connection_count} icon="⌘" /><Summary label="Incoming relationships" value={incoming.length} icon="←" /><Summary label="Outgoing relationships" value={outgoing.length} icon="→" /></div></div><Panel className="network-details"><h2>Selected Wallet</h2><div className="selected-summary"><code>{network.wallet_id}</code><RiskBadge band={network.risk_band} /><strong>{network.risk_score.toFixed(2)} <small>/ 100</small></strong></div><h3>Connected Wallets</h3><div className="connection-list">{network.connections.map((connection) => <ConnectionRow key={`${connection.direction}-${connection.wallet_id}`} connection={connection} />)}</div><Link className="button" href={`/wallet/${network.wallet_id}`}>Open Investigation →</Link></Panel></div>;
}

function nodeY(index: number, direction: string) { return 80 + ((index % 6) * 90) + (direction === "outgoing" ? 20 : 0); }
function Node({ walletId, score, band, detail, className = "" }: { walletId: string; score: number | null; band: string | null; detail?: string; className?: string }) { return <div className={`network-node ${className} ${(band || "LOW").toLowerCase()}`}><span className="node-dot" /><code>{walletId}</code><small>{detail || `Risk: ${score?.toFixed(2) ?? "n/a"}`}</small></div>; }
function Summary({ label, value, icon }: { label: string; value: number; icon: string }) { return <div><i>{icon}</i><strong>{value}</strong><span>{label}</span></div>; }
function ConnectionRow({ connection }: { connection: NetworkConnection }) { return <Link href={`/wallet/${connection.wallet_id}`} className="connection-row"><span className={connection.direction}>{connection.direction === "incoming" ? "→" : "←"}</span><code>{connection.wallet_id}</code><RiskBadge band={connection.risk_band || "LOW"} /><small>{connection.total_amount_btc.toFixed(2)} BTC · {connection.transaction_count} tx</small></Link>; }
