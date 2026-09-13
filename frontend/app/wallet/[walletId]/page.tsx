"use client";

import { useState, Suspense } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ShieldAlert,
  Brain,
  Network,
  ArrowLeft,
  Copy,
  Check,
  TrendingUp,
  Activity,
  AlertTriangle,
  GitBranch,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import {
  RiskBadge,
  RiskBar,
  SectionHeader,
  AnimatedNumber,
  EvidenceBar,
} from "@/components/ui";
import { WALLETS, RISK_CONTRIBUTIONS_W012109, WALLET_TIMELINE_W012109 } from "@/lib/mock-data/wallets";
import {
  getRiskColor,
  getRiskBgColor,
  getRiskBorderColor,
  getRiskGlow,
  formatTimestamp,
  formatBTC,
} from "@/lib/utils";

const EVIDENCE_COLORS: Record<string, string> = {
  behavioral:  "#38bdf8",
  graph:       "#818cf8",
  statistical: "#fbbf24",
  network:     "#34d399",
};

function WalletInvestigationContent() {
  const params = useParams();
  const walletId = typeof params.walletId === "string" ? params.walletId : "W012109";
  const wallet = WALLETS.find((w) => w.id === walletId) ?? WALLETS[0];
  const contributions = walletId === "W012109" ? RISK_CONTRIBUTIONS_W012109 : [];
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (field: string, value: string) => {
    navigator.clipboard.writeText(value).catch(() => {});
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const riskColor = getRiskColor(wallet.riskBand);

  return (
    <div className="inv-workspace bg-[#0c1220] min-h-full p-5 space-y-5">
      {/* Subtle investigation grid bg */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(56,189,248,0.018) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,0.018) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          zIndex: 0,
        }}
      />

      <div className="relative z-10 space-y-5">
        {/* Breadcrumb */}
        <div className="flex items-center gap-3 flex-wrap">
          <Link
            href="/alerts"
            className="flex items-center gap-1 text-[#3f5168] text-xs hover:text-[#38bdf8] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Risk Alerts
          </Link>
          <span className="text-[#253448]">/</span>
          <span className="section-label text-[#3f5168]">WALLET INVESTIGATION</span>
          <span className="text-[#253448]">/</span>
          <span className="mono text-[#e8edf5] text-xs">{wallet.id}</span>
        </div>

        {/* ─── Hero wallet card ─────────────────────────── */}
        <div
          className="inv-panel p-6 relative overflow-hidden"
          style={{
            borderColor: getRiskBorderColor(wallet.riskBand),
            boxShadow: `${getRiskGlow(wallet.riskBand)}, 0 4px 24px rgba(0,0,0,0.4)`,
          }}
        >
          {/* Subtle glow bg */}
          <div
            className="absolute top-0 right-0 w-64 h-64 rounded-full pointer-events-none opacity-15"
            style={{
              background: `radial-gradient(circle at center, ${riskColor}, transparent 70%)`,
              transform: "translate(30%, -30%)",
            }}
          />

          <div className="flex flex-wrap items-start gap-6 relative z-10">
            {/* Wallet ID & summary */}
            <div className="flex-1 min-w-48">
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{
                    background: getRiskBgColor(wallet.riskBand),
                    border: `1px solid ${getRiskBorderColor(wallet.riskBand)}`,
                  }}
                >
                  <ShieldAlert className="w-5 h-5" style={{ color: riskColor }} />
                </div>
                <div>
                  <p className="mono text-[#e8edf5] text-xl font-bold tracking-tight">{wallet.id}</p>
                  <RiskBadge band={wallet.riskBand} />
                </div>
              </div>
              <p className="text-[#7d8fa3] text-sm">
                First seen: <span className="text-[#e8edf5] mono text-xs">{formatTimestamp(wallet.firstSeen)}</span>
              </p>
              <p className="text-[#7d8fa3] text-sm mt-0.5">
                Last active: <span className="text-[#e8edf5] mono text-xs">{formatTimestamp(wallet.lastSeen)}</span>
              </p>
            </div>

            {/* Risk score */}
            <div className="text-center px-6 py-2 border-x border-[#1e2d3d]">
              <p className="section-label mb-1">RISK SCORE</p>
              <p
                className="mono font-black leading-none"
                style={{ color: riskColor, fontSize: 52, textShadow: `0 0 30px ${riskColor}50` }}
              >
                <AnimatedNumber value={wallet.riskScore} decimals={2} duration={1200} />
              </p>
              <p className="text-[#7d8fa3] text-xs mt-1">out of 100</p>
              <RiskBar score={wallet.riskScore} height={4} dark className="mt-2 w-32" />
            </div>

            {/* Quick stats */}
            <div className="flex gap-5 flex-wrap">
              {[
                { label: "TRANSACTIONS", value: wallet.totalTransactions.toLocaleString(), icon: Activity },
                { label: "BTC VOLUME",   value: formatBTC(wallet.totalBTC),                icon: TrendingUp },
                { label: "CONNECTIONS",  value: wallet.graphFeatures.degree.toString(),    icon: GitBranch },
                { label: "IF SCORE",     value: wallet.anomalyScores.isolationForest.toFixed(3), icon: Brain },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="text-center">
                  <Icon className="w-3.5 h-3.5 text-[#3f5168] mx-auto mb-1" />
                  <p className="mono text-[#e8edf5] text-base font-bold">{value}</p>
                  <p className="text-[10px] text-[#3f5168] tracking-wider">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Action bar */}
          <div className="flex gap-3 mt-5 pt-5 border-t border-[#1e2d3d] relative z-10">
            <Link href={`/network?focus=${wallet.id}`} className="btn-inv text-xs">
              <Network className="w-3.5 h-3.5" />
              Entity Graph
            </Link>
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#818cf8]/30 text-[#818cf8] text-xs hover:bg-[#818cf8]/08 transition-colors">
              <Brain className="w-3.5 h-3.5" />
              Feature Explainer
            </button>
            <div className="ml-auto flex items-center gap-1.5">
              <span className="text-[#3f5168] text-xs">ID:</span>
              <span className="mono text-[#7d8fa3] text-xs">{wallet.id}</span>
              <button
                onClick={() => handleCopy("walletId", wallet.id)}
                className="p-1 rounded hover:bg-[#1e2d3d] text-[#3f5168] hover:text-[#38bdf8] transition-colors"
              >
                {copiedField === "walletId"
                  ? <Check className="w-3 h-3 text-[#34d399]" />
                  : <Copy className="w-3 h-3" />
                }
              </button>
            </div>
          </div>
        </div>

        {/* ─── WHY THIS WALLET WAS FLAGGED ──────────────── */}
        <div
          className="inv-panel p-5"
          style={{ borderColor: `${riskColor}25`, boxShadow: `0 0 30px ${riskColor}08` }}
        >
          <div className="flex items-center gap-3 mb-5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: `${riskColor}15`, border: `1px solid ${riskColor}25` }}
            >
              <AlertTriangle className="w-4 h-4" style={{ color: riskColor }} />
            </div>
            <div>
              <h2 className="text-[#e8edf5] font-bold text-base">WHY THIS WALLET WAS FLAGGED</h2>
              <p className="text-[#7d8fa3] text-xs">Evidence hierarchy · feature contributions</p>
            </div>
          </div>

          {contributions.length > 0 ? (
            <div className="space-y-4">
              {contributions.map((contrib) => {
                const color = EVIDENCE_COLORS[contrib.evidenceType] ?? "#7d8fa3";
                return (
                  <div
                    key={contrib.factor}
                    className="p-4 rounded-xl border transition-all"
                    style={{ background: `${color}07`, borderColor: `${color}20` }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-start gap-2">
                        <span
                          className="text-[9px] font-bold px-1.5 py-0.5 rounded mt-0.5 uppercase tracking-wider"
                          style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}
                        >
                          {contrib.evidenceType}
                        </span>
                        <div>
                          <p className="text-[#e8edf5] text-sm font-semibold">{contrib.factor}</p>
                          <p className="text-[#7d8fa3] text-xs mt-0.5">{contrib.description}</p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-4">
                        <p className="mono text-xl font-black" style={{ color }}>{contrib.score}</p>
                        <p className="text-[#3f5168] text-[10px]">weight {(contrib.weight * 100).toFixed(0)}%</p>
                      </div>
                    </div>
                    <EvidenceBar score={contrib.score} color={color} />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-3">
              {wallet.flagReasons.map((reason, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-[#1e2d3d]">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: riskColor }} />
                  <p className="text-[#e8edf5] text-sm">{reason}</p>
                </div>
              ))}
              {wallet.flagReasons.length === 0 && (
                <p className="text-[#7d8fa3] text-sm italic">No flag reasons recorded.</p>
              )}
            </div>
          )}
        </div>

        {/* ─── Metrics grid ─────────────────────────────── */}
        <div className="grid grid-cols-12 gap-4">

          {/* Behavioral metrics */}
          <div className="col-span-12 md:col-span-6 xl:col-span-4 inv-panel p-5">
            <SectionHeader label="BEHAVIORAL METRICS">
              <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded" style={{ color: "#38bdf8", background: "rgba(56,189,248,0.10)", border: "1px solid rgba(56,189,248,0.20)" }}>
                BEHAVIORAL
              </span>
            </SectionHeader>
            <div className="space-y-3">
              {[
                { label: "Transaction Frequency", value: `${wallet.behavioralFeatures.transactionFrequency.toFixed(1)}/day`, score: Math.min(100, wallet.behavioralFeatures.transactionFrequency * 8) },
                { label: "Rapid Activity Score",  value: `${(wallet.behavioralFeatures.rapidActivityScore * 100).toFixed(0)}%`, score: wallet.behavioralFeatures.rapidActivityScore * 100 },
                { label: "Fan-In Ratio",          value: `${wallet.behavioralFeatures.fanInRatio.toFixed(1)}x`, score: Math.min(100, wallet.behavioralFeatures.fanInRatio * 11.5) },
                { label: "Fan-Out Ratio",         value: `${wallet.behavioralFeatures.fanOutRatio.toFixed(1)}x`, score: Math.min(100, wallet.behavioralFeatures.fanOutRatio * 8) },
                { label: "Amount Variance",       value: `${(wallet.behavioralFeatures.amountVariance * 100).toFixed(0)}%`, score: wallet.behavioralFeatures.amountVariance * 100 },
              ].map(({ label, value, score }) => (
                <div key={label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[#7d8fa3] text-xs">{label}</span>
                    <span className="mono text-[#38bdf8] text-xs font-semibold">{value}</span>
                  </div>
                  <RiskBar score={score} height={5} dark />
                </div>
              ))}
            </div>
          </div>

          {/* Graph metrics */}
          <div className="col-span-12 md:col-span-6 xl:col-span-4 inv-panel p-5">
            <SectionHeader label="GRAPH METRICS">
              <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded" style={{ color: "#818cf8", background: "rgba(129,140,248,0.10)", border: "1px solid rgba(129,140,248,0.20)" }}>
                GRAPH
              </span>
            </SectionHeader>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Degree",     value: wallet.graphFeatures.degree },
                { label: "In-Degree",  value: wallet.graphFeatures.inDegree },
                { label: "Out-Degree", value: wallet.graphFeatures.outDegree },
                { label: "Community",  value: wallet.graphFeatures.communityId },
              ].map(({ label, value }) => (
                <div key={label} className="p-3 rounded-lg bg-[#0c1220] border border-[#1e2d3d] text-center">
                  <p className="mono text-lg font-bold text-[#818cf8]">{value}</p>
                  <p className="text-[10px] text-[#3f5168]">{label}</p>
                </div>
              ))}
            </div>
            <div className="space-y-3 mt-4">
              {[
                { label: "Betweenness Centrality", value: wallet.graphFeatures.betweennessCentrality },
                { label: "Clustering Coefficient", value: wallet.graphFeatures.clusteringCoefficient },
                { label: "PageRank",               value: wallet.graphFeatures.pageRank },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[#7d8fa3] text-xs">{label}</span>
                    <span className="mono text-[#818cf8] text-xs font-semibold">{value.toFixed(3)}</span>
                  </div>
                  <RiskBar score={value * 100} height={5} dark />
                </div>
              ))}
            </div>
          </div>

          {/* Anomaly scores */}
          <div className="col-span-12 xl:col-span-4 inv-panel p-5">
            <SectionHeader label="MODEL EVIDENCE">
              <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded" style={{ color: "#fbbf24", background: "rgba(251,191,36,0.10)", border: "1px solid rgba(251,191,36,0.20)" }}>
                STATISTICAL
              </span>
            </SectionHeader>
            <div className="space-y-4">
              {[
                { label: "Statistical Anomaly Score", value: wallet.anomalyScores.statisticalAnomaly,          unit: "/100", color: "#fbbf24", note: "Z-score / IQR based" },
                { label: "Isolation Forest Score",    value: wallet.anomalyScores.isolationForest * 100,       unit: "",     color: "#f87171", raw: wallet.anomalyScores.isolationForest.toFixed(4), note: "0–1 · higher = more anomalous" },
              ].map(({ label, value, unit, color, raw, note }) => (
                <div key={label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[#7d8fa3] text-xs">{label}</span>
                    <div className="flex items-center gap-1.5">
                      {raw && <span className="mono text-[#3f5168] text-[10px]">({raw})</span>}
                      <span className="mono font-bold text-sm" style={{ color }}>{value.toFixed(1)}{unit}</span>
                    </div>
                  </div>
                  {note && <p className="text-[#3f5168] text-[10px] mb-1">{note}</p>}
                  <div className="h-2 rounded-full bg-[#1a2436] overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(value, 100)}%`,
                        background: `linear-gradient(90deg, ${color}55, ${color})`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Combined risk */}
            <div
              className="mt-4 p-3 rounded-xl text-center"
              style={{ background: getRiskBgColor(wallet.riskBand), border: `1px solid ${getRiskBorderColor(wallet.riskBand)}` }}
            >
              <p className="text-[#7d8fa3] text-[10px] tracking-[0.08em] mb-1">COMBINED RISK SCORE</p>
              <p className="mono text-3xl font-black" style={{ color: riskColor }}>
                {wallet.anomalyScores.overallRisk.toFixed(2)}
              </p>
              <div className="mt-1.5"><RiskBadge band={wallet.riskBand} /></div>
            </div>
          </div>

          {/* Transaction timeline */}
          <div className="col-span-12 xl:col-span-8 inv-panel p-5">
            <SectionHeader label="TRANSACTION ACTIVITY TIMELINE" />
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={WALLET_TIMELINE_W012109} margin={{ top: 5, right: 5, bottom: 0, left: -15 }}>
                <defs>
                  <linearGradient id="txGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="btcGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#fbbf24" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fill: "#3f5168", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#3f5168", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: "rgba(13,17,23,0.97)", border: "1px solid #1e2d3d", borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: "#e8edf5" }}
                />
                <Area type="monotone" dataKey="txCount"   name="Transactions" stroke="#38bdf8" strokeWidth={2} fill="url(#txGrad)" />
                <Area type="monotone" dataKey="btcVolume" name="BTC Volume"    stroke="#fbbf24" strokeWidth={2} fill="url(#btcGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Connected counterparties */}
          <div className="col-span-12 xl:col-span-4 inv-panel p-5">
            <SectionHeader label="CONNECTED COUNTERPARTIES">
              <Link href={`/network?focus=${wallet.id}`} className="text-[#38bdf8] text-xs flex items-center gap-1">
                View graph <Network className="w-3 h-3" />
              </Link>
            </SectionHeader>
            <div className="space-y-2">
              {[
                { id: "W008834", riskBand: "HIGH",   riskScore: 88.91, txCount: 47 },
                { id: "W017332", riskBand: "HIGH",   riskScore: 91.4,  txCount: 32 },
                { id: "W019872", riskBand: "MEDIUM", riskScore: 61.2,  txCount: 18 },
                { id: "W015678", riskBand: "MEDIUM", riskScore: 58.3,  txCount: 14 },
                { id: "W011445", riskBand: "LOW",    riskScore: 23.4,  txCount: 7  },
              ].map((cp) => (
                <Link
                  key={cp.id}
                  href={`/wallet/${cp.id}`}
                  className="flex items-center gap-3 p-2.5 rounded-lg bg-[#0c1220] border border-[#1e2d3d] hover:border-[#253448] transition-all"
                >
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: getRiskColor(cp.riskBand as "HIGH" | "MEDIUM" | "LOW") }} />
                  <span className="mono text-[#e8edf5] text-xs flex-1">{cp.id}</span>
                  <span className="text-[#3f5168] text-[10px]">{cp.txCount} txs</span>
                  <span className="mono text-xs font-semibold" style={{ color: getRiskColor(cp.riskBand as "HIGH" | "MEDIUM" | "LOW") }}>
                    {cp.riskScore.toFixed(1)}
                  </span>
                </Link>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-[#1e2d3d] flex items-center justify-between">
              <span className="text-[#3f5168] text-xs">+{wallet.graphFeatures.degree - 5} more connections</span>
              <Link href={`/network?focus=${wallet.id}`} className="text-[#38bdf8] text-xs hover:underline">View all</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WalletPage() {
  return (
    <Suspense fallback={
      <div className="bg-[#0c1220] min-h-full p-5 space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="inv-panel p-5 h-32 skeleton" />
        ))}
      </div>
    }>
      <WalletInvestigationContent />
    </Suspense>
  );
}
