"use client";

import { useState } from "react";
import Link from "next/link";
import { Brain, CheckCircle, Info } from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  Cell, RadarChart, PolarGrid, PolarAngleAxis, Radar,
} from "recharts";
import { SectionHeader, DatasetBadge } from "@/components/ui";
import { MODEL_EVALUATIONS } from "@/lib/mock-data/models";
import { RISK_CONTRIBUTIONS_W012109 } from "@/lib/mock-data/wallets";

const CONTRIBUTION_CHART = RISK_CONTRIBUTIONS_W012109.map((r) => ({
  name: r.factor.split(" ").slice(0, 2).join(" "),
  score: r.score,
  color:
    r.evidenceType === "behavioral"  ? "#0f76ad"
    : r.evidenceType === "graph"     ? "#6366f1"
    : r.evidenceType === "statistical"? "#d97706"
    : "#059669",
}));

const TOOLTIP_LIGHT = {
  contentStyle: { background: "#fff", border: "1px solid #e4e7ec", borderRadius: 8, fontSize: 12 },
  labelStyle: { color: "#111827", fontWeight: 600 },
  itemStyle: { color: "#4b5563" },
};

// Radar data for model comparison — Explainable Risk Scoring is a scoring layer, not an anomaly detector,
// so it has no ROC-AUC / PR-AUC evaluation metrics and is excluded from this chart.
const RADAR_DATA = [
  { subject: "ROC-AUC", IF: 97.9, SA: 97.7 },
  { subject: "PR-AUC",  IF: 60.8, SA: 60.8 },
  { subject: "P@5%",    IF: 63.2, SA: 55.0 },
  { subject: "R@5%",    IF: 39.5, SA: 34.0 },
];

export default function AIIntelligencePage() {
  const [selectedModel, setSelectedModel] = useState(0);

  return (
    <div className="p-5 space-y-5 min-h-full page-enter">

      {/* ─── Header ──────────────────────────── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Brain className="w-3.5 h-3.5 text-[#6366f1]" />
            <span className="section-label">AI INTELLIGENCE</span>
          </div>
          <h1 className="text-[22px] font-bold text-[#111827] tracking-tight">AI Intelligence Engine</h1>
          <p className="text-[#6b7280] text-sm mt-0.5">
            Anomaly detection models · risk scoring · explainable features
          </p>
        </div>
        <DatasetBadge label="Offline Benchmark" />
      </div>

      {/* ─── Evaluation disclaimer ───────────── */}
      <div className="flex items-start gap-3 p-3.5 rounded-lg border border-[#fde68a] bg-[#fffbeb]">
        <Info className="w-4 h-4 text-[#d97706] flex-shrink-0 mt-0.5" />
        <p className="text-[#92400e] text-xs leading-relaxed">
          <strong>Evaluation note:</strong> All metrics shown are from offline evaluation on the
          synthetic BTC-SCOPE benchmark dataset. ROC-AUC is the primary reported metric.
          Precision@5% and Recall@5% are threshold-specific. These are NOT live accuracy claims.
          The system does not monitor real Bitcoin transactions.
        </p>
      </div>

      {/* ─── Model cards ─────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {MODEL_EVALUATIONS.map((m, i) => (
          <button
            key={m.modelName}
            onClick={() => setSelectedModel(i)}
            className={`card p-5 text-left transition-all ${
              selectedModel === i
                ? "border-[#6366f1]/40 shadow-md"
                : "hover:border-[#d1d5db]"
            }`}
            style={selectedModel === i ? { borderTopColor: "#6366f1", borderTopWidth: 2 } : {}}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-[#6366f1]" />
                <span className="text-[#111827] text-sm font-semibold">{m.modelName}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-[#059669]" />
                <span className="mono text-[10px] text-[#9ca3af]">{m.version}</span>
              </div>
            </div>
            {m.rocAuc !== undefined ? (
              <>
                <p className="section-label mb-1">ROC-AUC</p>
                <p className="mono text-3xl font-black mb-1" style={{ color: "#059669" }}>
                  {m.rocAuc.toFixed(3)}
                </p>
                <div className="h-1.5 rounded-full bg-[#e4e7ec] overflow-hidden mb-2">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${m.rocAuc * 100}%`, background: "linear-gradient(90deg, #6366f1, #0f76ad)" }}
                  />
                </div>
              </>
            ) : (
              <div className="py-2 mb-2">
                <p className="section-label mb-1">ROLE</p>
                <p className="text-[#6b7280] text-xs leading-snug">Aggregation &amp; Explanation Layer</p>
                <p className="text-[#9ca3af] text-[10px] mt-1">No standalone ROC-AUC — combines anomaly detector outputs into an explainable risk score.</p>
              </div>
            )}
            {m.prAuc !== undefined && (
              <p className="text-[#6b7280] text-[10px]">PR-AUC: <span className="mono font-semibold text-[#111827]">{m.prAuc.toFixed(3)}</span></p>
            )}
            {m.precisionAt5 !== undefined && (
              <p className="text-[#6b7280] text-[10px]">P@5%: <span className="mono font-semibold text-[#111827]">{m.precisionAt5.toFixed(3)}</span></p>
            )}
            {m.recallAt5 !== undefined && (
              <p className="text-[#6b7280] text-[10px]">R@5%: <span className="mono font-semibold text-[#111827]">{m.recallAt5.toFixed(3)}</span></p>
            )}
            <p className="text-[#9ca3af] text-[9px] mt-2">Evaluated · {m.lastEvaluated}</p>
          </button>
        ))}
      </div>

      {/* ─── Selected model detail ───────────── */}
      {MODEL_EVALUATIONS[selectedModel] && (
        <div className="card p-5">
          <SectionHeader label={`${MODEL_EVALUATIONS[selectedModel].modelName} — Detail`} />
          <p className="text-[#4b5563] text-sm">{MODEL_EVALUATIONS[selectedModel].note}</p>
        </div>
      )}

      {/* ─── Explainability + contribution chart */}
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 xl:col-span-7 card p-5">
          <SectionHeader label="EXPLAINABLE RISK — FEATURE CONTRIBUTIONS">
            <Link href="/wallet/W012109" className="text-[#0f76ad] text-xs hover:opacity-80">
              W012109 →
            </Link>
          </SectionHeader>
          <p className="text-[#6b7280] text-xs mb-4">
            Contributing evidence for wallet <span className="mono text-[#111827]">W012109</span>.
            Each factor drove part of the combined risk score.
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={CONTRIBUTION_CHART} margin={{ top: 5, right: 10, bottom: 20, left: -20 }}>
              <XAxis dataKey="name" tick={{ fill: "#9ca3af", fontSize: 9 }} axisLine={false} tickLine={false} angle={-15} textAnchor="end" />
              <YAxis tick={{ fill: "#9ca3af", fontSize: 9 }} axisLine={false} tickLine={false} domain={[0, 100]} />
              <Tooltip {...TOOLTIP_LIGHT} />
              <Bar dataKey="score" name="Contribution Score" radius={[4, 4, 0, 0]}>
                {CONTRIBUTION_CHART.map((entry, index) => (
                  <Cell key={index} fill={entry.color} fillOpacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="col-span-12 xl:col-span-5 card p-5">
          <SectionHeader label="EVIDENCE BREAKDOWN" />
          <div className="space-y-3">
            {RISK_CONTRIBUTIONS_W012109.map((contrib) => {
              const colorMap: Record<string, string> = {
                behavioral:  "#0f76ad",
                graph:       "#6366f1",
                statistical: "#d97706",
                network:     "#059669",
              };
              const color = colorMap[contrib.evidenceType] ?? "#9ca3af";
              return (
                <div key={contrib.factor}>
                  <div className="flex items-start justify-between mb-1 gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-[#111827] text-xs font-medium leading-tight">{contrib.factor}</p>
                      <p className="text-[#9ca3af] text-[10px] mt-0.5">{contrib.description}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="mono text-base font-bold" style={{ color }}>{contrib.score}</span>
                      <span className="text-[#9ca3af] text-[9px] ml-1">/100</span>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full bg-[#e4e7ec] overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${contrib.score}%`, background: `linear-gradient(90deg, ${color}50, ${color})` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── Detection approaches ────────────── */}
      <div className="card p-5">
        <SectionHeader label="IMPLEMENTED DETECTION APPROACHES" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
          {[
            { title: "Statistical Anomaly Detection",  color: "#d97706", desc: "Z-score and IQR-based outlier detection on transaction frequency, amount variance, and timing patterns." },
            { title: "Isolation Forest",               color: "#dc2626", desc: "Ensemble-based unsupervised anomaly detection. Wallets isolated quickly in random partitioning score higher." },
            { title: "Graph Feature Analysis",         color: "#6366f1", desc: "Degree, betweenness centrality, clustering coefficient, and PageRank derived from the Bitcoin transaction graph." },
            { title: "Explainable Risk Scoring",       color: "#0f76ad", desc: "Weighted combination of behavioral, graph, and statistical evidence scores with per-factor explainability." },
          ].map(({ title, desc, color }) => (
            <div key={title} className="flex gap-3 p-3.5 rounded-xl border border-[#e4e7ec] bg-[#f7f8fa]">
              <div className="w-1 rounded-full flex-shrink-0" style={{ background: color }} />
              <div>
                <p className="text-[#111827] text-xs font-semibold mb-1">{title}</p>
                <p className="text-[#6b7280] text-xs leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Metric footnote ─────────────────── */}
      <div className="flex items-start gap-2 px-4 py-3 rounded-lg border border-[#e4e7ec] bg-[#f7f8fa]">
        <Info className="w-3.5 h-3.5 text-[#9ca3af] flex-shrink-0 mt-0.5" />
        <p className="text-[#6b7280] text-xs leading-relaxed">
          <strong>Metrics are from offline evaluation on the synthetic BTC-SCOPE benchmark.</strong>{" "}
          ROC-AUC scores: Isolation Forest 0.979, Statistical Anomaly 0.977.
          PR-AUC 0.608 (both models). Precision@5% = 0.632, Recall@5% = 0.395 (Isolation Forest).
          Explainable Risk Scoring has no standalone ROC-AUC — it is an aggregation and explanation layer, not an independent detector.
          Do not interpret these as operational accuracy on real Bitcoin data.
        </p>
      </div>
    </div>
  );
}
