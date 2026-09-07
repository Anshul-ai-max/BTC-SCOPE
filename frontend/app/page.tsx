"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "../components/AppShell";
import { ErrorState, LoadingState, Panel, RiskBadge } from "../components/ui";
import { Alert, btcScopeApi } from "../lib/api";

const distribution = [
  { band: "HIGH", count: 3873, percent: 19.4, text: "Urgent review needed" },
  { band: "MEDIUM", count: 8486, percent: 42.4, text: "Irregular behavior patterns" },
  { band: "LOW", count: 7641, percent: 38.2, text: "Normal expected activity" },
] as const;

export default function OverviewPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [error, setError] = useState("");
  useEffect(() => { btcScopeApi.getAlerts(5).then((result) => setAlerts(result.alerts)).catch((cause: Error) => setError(cause.message)); }, []);

  return <AppShell>
    <div className="page-heading">
      <div className="eyebrow">✦ INTELLIGENCE MONITOR</div>
      <h1>Bitcoin Activity Overview</h1>
      <p>BTC-SCOPE analyzes transaction activity to find wallets that behave unusually.</p>
    </div>
    <div className="metric-grid">
      <Metric name="Wallets Analyzed" value="20,000" icon="◌" />
      <Metric name="Transactions" value="100,000" icon="⇄" />
      <Metric name="High Risk" value="3,873" icon="⚠" tone="high" />
      <Metric name="Medium Risk" value="8,486" icon="◉" tone="medium" />
    </div>
    <Panel>
      <div className="section-title"><div><h2>Risk Overview</h2><p>Distribution across monitored Bitcoin addresses</p></div><code>Total: 20,000 Wallets</code></div>
      <div className="risk-bar" aria-label="Risk distribution">
        {distribution.map((item) => <span className={item.band.toLowerCase()} style={{ width: `${item.percent}%` }} key={item.band} />)}
      </div>
      <div className="distribution-grid">
        {distribution.map((item) => <div className="distribution-card" key={item.band}><span className={`dot ${item.band.toLowerCase()}`} /><div><b>{item.band} Risk</b><strong className={item.band.toLowerCase()}>{item.count.toLocaleString()} <small>({item.percent}%)</small></strong><p>{item.text}</p></div></div>)}
      </div>
    </Panel>
    <Panel>
      <div className="section-title"><div><h2>Wallets Needing Attention</h2><p>Top priority entities requiring immediate forensic examination</p></div><code>Prioritized by risk score</code></div>
      {error ? <ErrorState message={error} /> : !alerts.length ? <LoadingState /> : <div className="attention-table"><div className="table-head"><span>Wallet</span><span>Risk score</span><span>Risk level</span><span>Reason</span><span /></div>{alerts.map((alert) => <div className="table-row" key={alert.wallet_id}><code>{alert.wallet_id}</code><b>{alert.risk_score.toFixed(2)}</b><RiskBadge band={alert.risk_band} /><span>{alert.reasons[0] || "No reason available"}</span><Link className="button compact" href={`/wallet/${alert.wallet_id}`}>Investigate →</Link></div>)}</div>}
    </Panel>
    <Panel>
      <div className="section-title"><div><h2>How BTC-SCOPE Works</h2><p>A straightforward progression explaining how risk is identified and presented</p></div></div>
      <div className="how-grid">
        <How number="1" title="Transaction Activity" icon="▤">Ingests and records incoming and outgoing Bitcoin transaction patterns across monitored addresses.</How>
        <How number="2" title="Behavior Analysis" icon="⌘">Evaluates transfer timing, volume bursts, frequency spikes, and interconnected relationships.</How>
        <How number="3" title="Risk Score" icon="↗">Calculates a calibrated 0–100 priority index flagging wallets needing review.</How>
        <How number="4" title="Explanation" icon="▧">Produces plain-language summaries of the observed behavioral and graph signals.</How>
      </div>
    </Panel>
    <Panel className="performance-panel">
      <div className="section-title"><div><h2>Model Performance</h2><p>Results shown on a synthetic benchmark dataset.</p></div><code>Evaluation Specs</code></div>
      <div className="performance-grid"><Performance name="Statistical Baseline" roc="0.977" pr="0.608" /><Performance name="Machine Learning Model" roc="0.979" pr="0.608" highlight /></div>
    </Panel>
  </AppShell>;
}

function Metric({ name, value, icon, tone = "" }: { name: string; value: string; icon: string; tone?: string }) {
  return <div className={`metric-card ${tone}`}><div><span>{name}</span><strong>{value}</strong></div><i>{icon}</i></div>;
}
function How({ number, title, icon, children }: { number: string; title: string; icon: string; children: string }) {
  return <div className="how-card"><div><b>{number}</b><i>{icon}</i></div><h3>{title}</h3><p>{children}</p></div>;
}
function Performance({ name, roc, pr, highlight = false }: { name: string; roc: string; pr: string; highlight?: boolean }) {
  return <div className={`performance-card ${highlight ? "highlight" : ""}`}><span>{name}</span><div><label>ROC-AUC<strong>{roc}</strong></label><label>PR-AUC<strong>{pr}</strong></label></div></div>;
}
