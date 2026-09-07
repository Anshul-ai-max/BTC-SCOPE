"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "../../components/AppShell";
import { ErrorState, LoadingState, RiskBadge } from "../../components/ui";
import { Alert, RiskBand, btcScopeApi } from "../../lib/api";

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"ALL" | RiskBand>("ALL");
  useEffect(() => { btcScopeApi.getAlerts(100).then((result) => setAlerts(result.alerts)).catch((cause: Error) => setError(cause.message)); }, []);
  const visible = useMemo(() => alerts.filter((alert) => (filter === "ALL" || alert.risk_band === filter) && alert.wallet_id.includes(query.trim().toUpperCase())), [alerts, filter, query]);
  return <AppShell>
    <div className="page-heading"><h1>Risk Alerts</h1><p>Wallets that show unusual activity and may need investigation.</p></div>
    <div className="alert-toolbar"><label className="search-field"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search wallet ID… (e.g. W012109)" /></label><div className="filter-pills">{(["ALL", "HIGH", "MEDIUM", "LOW"] as const).map((band) => <button className={filter === band ? "selected" : ""} onClick={() => setFilter(band)} key={band}>{band === "ALL" ? "All loaded" : `${band[0]}${band.slice(1).toLowerCase()} Risk`}</button>)}</div></div>
    {error ? <ErrorState message={error} /> : !alerts.length ? <LoadingState label="Loading the highest-priority wallets…" /> : <>
      <div className="alert-list">{visible.map((alert) => <article className={`alert-card ${alert.risk_band.toLowerCase()}`} key={alert.wallet_id}><div className="alert-identity"><span className="alert-icon">{alert.risk_band === "HIGH" ? "⚠" : "◉"}</span><div><code>{alert.wallet_id}</code><RiskBadge band={alert.risk_band} /></div><div className="score"><small>Risk Score</small><strong>{alert.risk_score.toFixed(2)}</strong></div></div><div className="alert-explanation"><small>Why was it flagged?</small><ul>{alert.reasons.slice(0, 3).map((reason) => <li key={reason}>{reason}</li>)}</ul></div><Link className="button" href={`/wallet/${alert.wallet_id}`}>Investigate Wallet →</Link></article>)}</div>
      {!visible.length && <div className="state-card">No loaded alerts match that wallet ID or risk filter.</div>}
      <p className="list-note">Showing {visible.length} of the top {alerts.length} risk-ranked wallets returned by the read-only API.</p>
    </>}
  </AppShell>;
}
