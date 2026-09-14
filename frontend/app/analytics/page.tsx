"use client";

import { useEffect, useState } from "react";
import { BarChart2, Info } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, AreaChart, Area, PieChart, Pie, Cell } from "recharts";
import { SectionHeader, DatasetBadge } from "@/components/ui";
import { getAnalytics } from "@/lib/api";
import type { AnalyticsSummary } from "@/types/btc-scope";

const TOOLTIP_LIGHT = { contentStyle: { background: "#fff", border: "1px solid #e4e7ec", borderRadius: 8, fontSize: 12 }, labelStyle: { color: "#111827", fontWeight: 600 }, itemStyle: { color: "#4b5563" } };

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { getAnalytics().then(setAnalytics).catch((requestError: Error) => setError(requestError.message)); }, []);

  const riskDistribution = analytics?.riskDistribution ?? { high: 0, medium: 0, low: 0, total: 0 };
  const transactionTimeline = analytics?.transactionTimeline ?? [];
  const monthlyRiskTrend = analytics?.monthlyRiskTrend ?? [];
  const models = analytics?.modelComparison ?? [];
  const riskChart = [{ name: "High Risk", value: riskDistribution.high, color: "#dc2626" }, { name: "Medium Risk", value: riskDistribution.medium, color: "#d97706" }, { name: "Low Risk", value: riskDistribution.low, color: "#059669" }];
  const modelChart = models.filter((model) => model.rocAuc !== undefined).map((model) => ({ name: model.modelName.split(" ").slice(0, 2).join(" "), "ROC-AUC": Number(((model.rocAuc ?? 0) * 100).toFixed(1)), "PR-AUC": Number(((model.prAuc ?? 0) * 100).toFixed(1)) }));

  return <div className="p-5 space-y-5 min-h-full page-enter">
    <div className="flex items-start justify-between flex-wrap gap-3">
      <div><div className="flex items-center gap-2 mb-1.5"><BarChart2 className="w-3.5 h-3.5 text-[#0f76ad]" /><span className="section-label">PLATFORM ANALYTICS</span></div><h1 className="text-[22px] font-bold text-[#111827] tracking-tight">Analytics</h1><p className="text-[#6b7280] text-sm mt-0.5">Transaction volumes, risk distribution, model evaluation</p></div>
      <DatasetBadge />
    </div>
    {error && <div className="px-3 py-2 rounded-lg border border-[#fecaca] bg-[#fef2f2] text-[#b91c1c] text-xs">{error}</div>}
    <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-[#fffbeb] border border-[#fde68a]"><Info className="w-3.5 h-3.5 text-[#d97706] flex-shrink-0 mt-0.5" /><p className="text-[#92400e] text-xs leading-relaxed"><strong>Synthetic Research Dataset · Offline Benchmark</strong> — All analytics are derived from the synthetic BTC-SCOPE dataset. Not live Bitcoin network data.</p></div>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[{ label: "Total Wallets", value: riskDistribution.total.toLocaleString(), color: "#0f76ad" }, { label: "Transactions", value: (analytics?.totalTransactions ?? 0).toLocaleString(), color: "#0f76ad" }, { label: "HIGH Risk Wallets", value: riskDistribution.high.toLocaleString(), color: "#dc2626" }, { label: "MEDIUM Risk", value: riskDistribution.medium.toLocaleString(), color: "#d97706" }].map(({ label, value, color }) => <div key={label} className="card p-4 text-center" style={{ borderTopColor: color, borderTopWidth: 2 }}><p className="mono text-2xl font-black" style={{ color }}>{value}</p><p className="text-[#6b7280] text-xs mt-1">{label}</p></div>)}
    </div>
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-12 xl:col-span-8 card p-5"><SectionHeader label="TRANSACTION VOLUME OVER TIME" /><ResponsiveContainer width="100%" height={220}><AreaChart data={transactionTimeline} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}><defs><linearGradient id="an1" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#0f76ad" stopOpacity={0.20} /><stop offset="95%" stopColor="#0f76ad" stopOpacity={0} /></linearGradient></defs><XAxis dataKey="date" tick={{ fill: "#9ca3af", fontSize: 10 }} axisLine={false} tickLine={false} /><YAxis tick={{ fill: "#9ca3af", fontSize: 10 }} axisLine={false} tickLine={false} /><Tooltip {...TOOLTIP_LIGHT} /><Legend iconSize={8} wrapperStyle={{ fontSize: 11, color: "#6b7280" }} /><Area type="monotone" dataKey="normal" name="Low-risk sender" stroke="#0f76ad" strokeWidth={2} fill="url(#an1)" /><Area type="monotone" dataKey="suspicious" name="Medium-risk sender" stroke="#d97706" strokeWidth={1.5} fill="none" strokeDasharray="4 2" /><Area type="monotone" dataKey="flagged" name="High-risk sender" stroke="#dc2626" strokeWidth={1.5} fill="none" strokeDasharray="2 2" /></AreaChart></ResponsiveContainer></div>
      <div className="col-span-12 xl:col-span-4 card p-5"><SectionHeader label="RISK DISTRIBUTION" /><div className="flex items-center justify-center"><PieChart width={160} height={160}><Pie data={riskChart} cx={80} cy={80} innerRadius={42} outerRadius={70} paddingAngle={2} dataKey="value">{riskChart.map((entry, index) => <Cell key={index} fill={entry.color} opacity={0.88} />)}</Pie></PieChart></div><div className="space-y-1.5">{riskChart.map(({ name, value, color }) => <div key={name} className="flex items-center justify-between"><div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} /><span className="text-[#4b5563] text-xs">{name}</span></div><div className="flex items-center gap-2"><span className="mono text-xs font-semibold" style={{ color }}>{value.toLocaleString()}</span><span className="text-[#9ca3af] text-[10px]">{riskDistribution.total ? ((value / riskDistribution.total) * 100).toFixed(1) : "0.0"}%</span></div></div>)}</div></div>
      <div className="col-span-12 xl:col-span-8 card p-5"><SectionHeader label="MONTHLY RISK DISTRIBUTION" /><ResponsiveContainer width="100%" height={190}><BarChart data={monthlyRiskTrend} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}><XAxis dataKey="month" tick={{ fill: "#9ca3af", fontSize: 10 }} axisLine={false} tickLine={false} /><YAxis tick={{ fill: "#9ca3af", fontSize: 10 }} axisLine={false} tickLine={false} /><Tooltip {...TOOLTIP_LIGHT} /><Legend iconSize={8} wrapperStyle={{ fontSize: 11, color: "#6b7280" }} /><Bar dataKey="high" name="High Risk" fill="#dc2626" fillOpacity={0.82} radius={[2, 2, 0, 0]} /><Bar dataKey="medium" name="Medium Risk" fill="#d97706" fillOpacity={0.75} radius={[2, 2, 0, 0]} /><Bar dataKey="low" name="Low Risk" fill="#059669" fillOpacity={0.68} radius={[2, 2, 0, 0]} /></BarChart></ResponsiveContainer></div>
      <div className="col-span-12 xl:col-span-4 card p-5"><SectionHeader label="MODEL COMPARISON" /><ResponsiveContainer width="100%" height={190}><BarChart data={modelChart} layout="vertical" margin={{ top: 5, right: 30, bottom: 0, left: 10 }}><XAxis type="number" tick={{ fill: "#9ca3af", fontSize: 9 }} axisLine={false} tickLine={false} domain={[0, 100]} /><YAxis type="category" dataKey="name" tick={{ fill: "#4b5563", fontSize: 9 }} axisLine={false} tickLine={false} width={80} /><Tooltip {...TOOLTIP_LIGHT} formatter={(value) => [`${value}%`]} /><Legend iconSize={8} wrapperStyle={{ fontSize: 10, color: "#6b7280" }} /><Bar dataKey="ROC-AUC" fill="#059669" fillOpacity={0.85} radius={[0, 3, 3, 0]} /><Bar dataKey="PR-AUC" fill="#0f76ad" fillOpacity={0.70} radius={[0, 3, 3, 0]} /></BarChart></ResponsiveContainer><p className="text-[#9ca3af] text-[10px] mt-2 leading-relaxed">Offline evaluation on synthetic benchmark. ROC-AUC shown as %.</p></div>
    </div>
  </div>;
}
