"use client";

import Link from "next/link";
import {
  ShieldAlert,
  Activity,
  AlertTriangle,
  ArrowRight,
  Clock,
  Brain,
  Target,
  Share2,
  BarChart2,
  TrendingUp,
  Zap,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import { AnimatedNumber, RiskBadge, SectionHeader, StatusDot, DatasetBadge } from "@/components/ui";
import { ALERTS } from "@/lib/mock-data/alerts";
import { ACTIVITY_EVENTS } from "@/lib/mock-data/activity";
import { MODEL_EVALUATIONS } from "@/lib/mock-data/models";
import { TRANSACTION_TIMELINE } from "@/lib/mock-data/analytics";
import { getRiskColor, formatRelativeTime } from "@/lib/utils";

// ─── Constants ────────────────────────────────────────────────────────────────
const RISK_DIST = [
  { name: "High Risk",   value: 3873,  color: "#dc2626", pct: "19.37%" },
  { name: "Medium Risk", value: 8486,  color: "#d97706", pct: "42.43%" },
  { name: "Low Risk",    value: 7641,  color: "#059669", pct: "38.21%" },
];

const TOOLTIP_LIGHT = {
  contentStyle: {
    background: "#ffffff",
    border: "1px solid #e4e7ec",
    borderRadius: 8,
    fontSize: 12,
    color: "#111827",
  },
  labelStyle: { color: "#111827", fontWeight: 600 },
  itemStyle:  { color: "#4b5563" },
};

export default function CommandCenter() {
  const newAlerts = ALERTS.filter((a) => a.status === "NEW").length;

  return (
    <div className="p-5 space-y-5 min-h-full page-enter">

      {/* ─── Page header ─────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <BarChart2 className="w-3.5 h-3.5 text-[#0f76ad]" />
            <span className="section-label">COMMAND CENTER</span>
          </div>
          <h1 className="text-[22px] font-bold text-[#111827] tracking-tight leading-tight">
            Bitcoin Transaction Intelligence
          </h1>
          <p className="text-[#6b7280] text-sm mt-0.5">
            Forensic analysis · anomaly detection · risk scoring
          </p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <StatusDot status="online" label="ANALYSIS READY" />
          <DatasetBadge />
        </div>
      </div>

      {/* ─── KPI strip ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 stagger-children">
        {[
          { label: "Wallets",         value: 20000,  color: "#0f76ad", sub: "Entities analysed"      },
          { label: "Transactions",    value: 100000, color: "#0f76ad", sub: "Synthetic dataset"       },
          { label: "HIGH Risk",       value: 3873,   color: "#dc2626", sub: "19.37% · needs review"  },
          { label: "MEDIUM Risk",     value: 8486,   color: "#d97706", sub: "42.43%"                 },
          { label: "Investigations",  value: 47,     color: "#6366f1", sub: "Open cases"             },
          { label: "New Alerts",      value: newAlerts, color: "#dc2626", sub: "Pending review"      },
        ].map(({ label, value, color, sub }) => (
          <div
            key={label}
            className="card card-hover p-4 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-[10px]" style={{ background: color }} />
            <p className="mono text-[20px] font-bold leading-none mt-1" style={{ color }}>
              <AnimatedNumber value={value} duration={900} />
            </p>
            <p className="text-[#4b5563] text-[11.5px] mt-1.5 font-medium leading-snug">{label}</p>
            <p className="text-[#9ca3af] text-[10px] mt-0.5 leading-snug">{sub}</p>
          </div>
        ))}
      </div>

      {/* ─── Main grid ──────────────────────────────────────────── */}
      <div className="grid grid-cols-12 gap-4">

        {/* Transaction volume chart */}
        <div className="col-span-12 xl:col-span-8 card p-5">
          <SectionHeader label="TRANSACTION VOLUME — SYNTHETIC DATASET">
            <div className="flex items-center gap-4">
              {[
                { label: "Normal",      color: "#0f76ad" },
                { label: "Suspicious",  color: "#d97706" },
                { label: "Flagged",     color: "#dc2626" },
              ].map(({ label, color }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                  <span className="text-[10px] text-[#6b7280]">{label}</span>
                </div>
              ))}
            </div>
          </SectionHeader>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={TRANSACTION_TIMELINE} margin={{ top: 5, right: 5, bottom: 0, left: -22 }}>
              <defs>
                <linearGradient id="gN" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#0f76ad" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#0f76ad" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gS" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#d97706" stopOpacity={0.22} />
                  <stop offset="95%" stopColor="#d97706" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gF" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#dc2626" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fill: "#9ca3af", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#9ca3af", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip {...TOOLTIP_LIGHT} />
              <Area type="monotone" dataKey="normal"     stroke="#0f76ad" strokeWidth={1.5} fill="url(#gN)" />
              <Area type="monotone" dataKey="suspicious" stroke="#d97706" strokeWidth={1.5} fill="url(#gS)" />
              <Area type="monotone" dataKey="flagged"    stroke="#dc2626" strokeWidth={1.5} fill="url(#gF)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Risk distribution donut */}
        <div className="col-span-12 md:col-span-6 xl:col-span-4 card p-5">
          <SectionHeader label="RISK DISTRIBUTION" />
          <div className="flex justify-center">
            <PieChart width={170} height={170}>
              <Pie data={RISK_DIST} cx={85} cy={85} innerRadius={48} outerRadius={74} paddingAngle={3} dataKey="value">
                {RISK_DIST.map((entry, i) => (
                  <Cell key={i} fill={entry.color} opacity={0.85} />
                ))}
              </Pie>
            </PieChart>
          </div>
          <div className="space-y-2 mt-1">
            {RISK_DIST.map(({ name, value, color, pct }) => (
              <div key={name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                  <span className="text-[#4b5563] text-xs">{name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="mono text-xs font-semibold" style={{ color }}>{value.toLocaleString()}</span>
                  <span className="text-[#9ca3af] text-[10px]">{pct}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top risk alerts */}
        <div className="col-span-12 md:col-span-6 xl:col-span-4 card p-5">
          <SectionHeader label="TOP RISK ALERTS">
            <Link href="/alerts" className="text-[#0f76ad] text-xs flex items-center gap-1 hover:opacity-80">
              All alerts <ArrowRight className="w-3 h-3" />
            </Link>
          </SectionHeader>
          <div className="space-y-1.5">
            {ALERTS.filter((a) => a.riskBand === "HIGH").slice(0, 5).map((alert) => (
              <Link
                key={alert.id}
                href={`/wallet/${alert.walletId}`}
                className="flex items-center gap-3 p-2.5 rounded-lg bg-[#f7f8fa] border border-[#e4e7ec] hover:border-[#dc2626]/25 hover:bg-[#dc2626]/03 transition-all"
              >
                <div className="w-0.5 self-stretch rounded-full flex-shrink-0" style={{ background: getRiskColor(alert.riskBand) }} />
                <div className="flex-1 min-w-0">
                  <p className="mono text-[#111827] text-xs font-semibold">{alert.walletId}</p>
                  <p className="text-[#6b7280] text-[10px] truncate">{alert.detectionType}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="mono text-xs font-bold" style={{ color: getRiskColor(alert.riskBand) }}>
                    {alert.riskScore.toFixed(1)}
                  </p>
                  <RiskBadge band={alert.riskBand} />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Model performance */}
        <div className="col-span-12 md:col-span-6 xl:col-span-4 card p-5">
          <SectionHeader label="DETECTION MODELS">
            <Link href="/ai-intelligence" className="text-[#6366f1] text-xs hover:opacity-80">Details →</Link>
          </SectionHeader>
          <div className="space-y-5">
            {MODEL_EVALUATIONS.map((model) => (
              <div key={model.modelName}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Brain className="w-3.5 h-3.5 text-[#6366f1]" />
                    <span className="text-[#111827] text-xs font-medium">{model.modelName}</span>
                  </div>
                  <span className="mono text-[10px] text-[#9ca3af]">{model.version}</span>
                </div>
                {model.rocAuc !== undefined ? (
                  <>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[#6b7280] text-[10px]">ROC-AUC (offline eval)</span>
                      <span className="mono text-xs font-bold text-[#059669]">{model.rocAuc.toFixed(3)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[#e4e7ec] overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${model.rocAuc * 100}%`,
                          background: "linear-gradient(90deg, #6366f1, #0f76ad)",
                        }}
                      />
                    </div>
                  </>
                ) : (
                  <p className="text-[#9ca3af] text-[10px] mb-1">Aggregation &amp; explanation layer</p>
                )}
                <p className="text-[#9ca3af] text-[9px] mt-1">
                  Evaluated · {model.lastEvaluated}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent activity */}
        <div className="col-span-12 xl:col-span-4 card p-5">
          <SectionHeader label="INVESTIGATION ACTIVITY">
            <div className="live-dot" />
          </SectionHeader>
          <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
            {ACTIVITY_EVENTS.map((event) => (
              <div
                key={event.id}
                className="flex items-start gap-3 p-2 rounded-lg hover:bg-[#f7f8fa] transition-colors"
              >
                <div className="mt-0.5 flex-shrink-0">
                  {event.type === "alert" && (
                    <ShieldAlert className="w-3 h-3" style={{ color: getRiskColor(event.riskBand) }} />
                  )}
                  {event.type === "detection" && (
                    <Brain className="w-3 h-3 text-[#6366f1]" />
                  )}
                  {event.type === "investigation" && (
                    <Target className="w-3 h-3 text-[#0f76ad]" />
                  )}
                  {event.type === "system" && (
                    <Activity className="w-3 h-3 text-[#059669]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[#111827] text-[11.5px] leading-snug">{event.description}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {event.entityId !== "SYSTEM" && (
                      <span className="mono text-[#6b7280] text-[10px]">{event.entityId}</span>
                    )}
                    <span className="text-[#9ca3af] text-[10px] flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5" />
                      {formatRelativeTime(event.timestamp)}
                    </span>
                  </div>
                </div>
                {event.riskScore !== undefined && (
                  <span className="mono text-[11px] font-bold flex-shrink-0" style={{ color: getRiskColor(event.riskBand) }}>
                    {event.riskScore.toFixed(1)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Graph summary ──────────────────────────────────────── */}
      <div className="card p-5">
        <SectionHeader label="TRANSACTION GRAPH SUMMARY">
          <Link href="/network" className="btn-primary text-xs py-1.5">
            <Share2 className="w-3.5 h-3.5" />
            Open Entity Graph
          </Link>
        </SectionHeader>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Graph Nodes",         value: "20,000",   icon: Share2,        color: "#0f76ad" },
            { label: "Transaction Edges",    value: "148,492",  icon: TrendingUp,    color: "#6366f1" },
            { label: "Suspicious Clusters",  value: "247",      icon: ShieldAlert,   color: "#dc2626" },
            { label: "Isolated Anomalies",   value: "1,834",    icon: AlertTriangle, color: "#d97706" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div
              key={label}
              className="flex items-center gap-3 p-3.5 rounded-xl border border-[#e4e7ec] bg-[#f7f8fa] hover:border-[#d1d5db] hover:bg-white transition-colors"
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: `${color}10`, border: `1px solid ${color}22` }}
              >
                <Icon className="w-3.5 h-3.5" style={{ color }} />
              </div>
              <div className="min-w-0">
                <p className="mono text-[#111827] text-base font-bold leading-tight">{value}</p>
                <p className="text-[#6b7280] text-[11px] mt-0.5">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Benchmark disclaimer ────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-[#fffbeb] border border-[#fde68a]">
        <Zap className="w-3.5 h-3.5 text-[#d97706] flex-shrink-0" />
        <p className="text-[#92400e] text-xs">
          <strong>Synthetic Research Dataset · Offline Benchmark:</strong> All data is
          synthetic. This is not live Bitcoin monitoring. Metrics are from offline evaluation
          on the BTC-SCOPE benchmark dataset.
        </p>
      </div>
    </div>
  );
}
