"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Search,
  ArrowUpDown,
  Clock,
  Eye,
  Network,
  Info,
} from "lucide-react";
import { RiskBadge, SectionHeader, DatasetBadge } from "@/components/ui";
import { getTopAlerts } from "@/lib/api";
import { getRiskColor, formatRelativeTime } from "@/lib/utils";
import type { Alert, RiskBand, AlertStatus } from "@/types/btc-scope";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<AlertStatus, { label: string; color: string; bg: string; border: string }> = {
  NEW:           { label: "NEW",           color: "#dc2626", bg: "#fef2f2",  border: "#fecaca" },
  INVESTIGATING: { label: "INVESTIGATING", color: "#0f76ad", bg: "#f0f9ff",  border: "#bae6fd" },
  CONFIRMED:     { label: "CONFIRMED",     color: "#6366f1", bg: "#eef2ff",  border: "#c7d2fe" },
  FALSE_POSITIVE:{ label: "FALSE POS.",    color: "#9ca3af", bg: "#f9fafb",  border: "#e5e7eb" },
  RESOLVED:      { label: "RESOLVED",      color: "#059669", bg: "#f0fdf4",  border: "#bbf7d0" },
};

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<RiskBand | "ALL">("ALL");
  const [statusFilter, setStatusFilter] = useState<AlertStatus | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"riskScore" | "timestamp">("riskScore");
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);

  useEffect(() => {
    getTopAlerts(100).then(setAlerts).catch((requestError: Error) => setError(requestError.message));
  }, []);

  const filtered = alerts.filter((a) => {
    if (filter !== "ALL" && a.riskBand !== filter) return false;
    if (statusFilter !== "ALL" && a.status !== statusFilter) return false;
    if (
      searchQuery &&
      !a.walletId.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !a.detectionType.toLowerCase().includes(searchQuery.toLowerCase())
    ) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === "riskScore") return b.riskScore - a.riskScore;
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  const counts = {
    HIGH:   alerts.filter((a) => a.riskBand === "HIGH").length,
    MEDIUM: alerts.filter((a) => a.riskBand === "MEDIUM").length,
    LOW:    alerts.filter((a) => a.riskBand === "LOW").length,
    NEW:    alerts.filter((a) => a.status === "NEW").length,
  };

  return (
    <div className="flex h-full overflow-hidden">

      {/* ─── Alert list panel ─────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0 p-5 overflow-auto">

        {/* Header */}
        <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-[#dc2626]" />
              <span className="section-label">RISK ALERTS</span>
            </div>
            <h1 className="text-[22px] font-bold text-[#111827] tracking-tight">Risk Alerts</h1>
            <p className="text-[#6b7280] text-sm mt-0.5">
              {filtered.length} alerts · {counts.NEW} pending review
            </p>
          </div>
          <DatasetBadge />
        </div>

        {error && <div className="px-3 py-2 rounded-lg border border-[#fecaca] bg-[#fef2f2] text-[#b91c1c] text-xs">{error}</div>}

        {/* Stat strip */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          {[
            { label: "HIGH RISK",      count: counts.HIGH,   color: "#dc2626" },
            { label: "MEDIUM RISK",    count: counts.MEDIUM, color: "#d97706" },
            { label: "LOW RISK",       count: counts.LOW,    color: "#059669" },
            { label: "PENDING REVIEW", count: counts.NEW,    color: "#0f76ad" },
          ].map(({ label, count, color }) => (
            <div
              key={label}
              className="card p-3 text-center"
              style={{ borderTopColor: color, borderTopWidth: 2 }}
            >
              <p className="mono text-lg font-bold" style={{ color }}>{count}</p>
              <p className="text-[9px] text-[#9ca3af] font-semibold tracking-wider mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          {/* Search */}
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9ca3af]" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search wallet ID or detection type…"
              className="form-input pl-9 w-full text-xs"
            />
          </div>

          {/* Risk filter */}
          <div className="flex items-center gap-1 p-1 rounded-lg bg-[#f7f8fa] border border-[#e4e7ec]">
            {(["ALL", "HIGH", "MEDIUM", "LOW"] as const).map((band) => (
              <button
                key={band}
                onClick={() => setFilter(band)}
                className={cn(
                  "px-3 py-1 rounded text-xs font-semibold transition-all",
                  filter === band
                    ? band === "HIGH"
                      ? "bg-[#fee2e2] text-[#dc2626] border border-[#fca5a5]"
                      : band === "MEDIUM"
                      ? "bg-[#fef3c7] text-[#d97706] border border-[#fde68a]"
                      : band === "LOW"
                      ? "bg-[#dcfce7] text-[#059669] border border-[#86efac]"
                      : "bg-white text-[#111827] border border-[#d1d5db] shadow-sm"
                    : "text-[#9ca3af] hover:text-[#4b5563]"
                )}
              >
                {band}
              </button>
            ))}
          </div>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as AlertStatus | "ALL")}
            className="form-input text-xs appearance-none"
          >
            <option value="ALL">All Status</option>
            <option value="NEW">New</option>
            <option value="INVESTIGATING">Investigating</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="FALSE_POSITIVE">False Positive</option>
            <option value="RESOLVED">Resolved</option>
          </select>

          {/* Sort */}
          <button
            onClick={() => setSortBy(sortBy === "riskScore" ? "timestamp" : "riskScore")}
            className="btn-secondary text-xs"
          >
            <ArrowUpDown className="w-3 h-3" />
            {sortBy === "riskScore" ? "Risk Score" : "Timestamp"}
          </button>
        </div>

        {/* Alert table */}
        <div className="card overflow-hidden flex-1">
          {/* Column headers */}
          <div className="grid grid-cols-[1fr_90px_100px_190px_110px_80px] gap-3 px-4 py-2.5 border-b border-[#f0f2f5] bg-[#f7f8fa]">
            {["WALLET ID", "SCORE", "RISK BAND", "DETECTION TYPE", "STATUS", "ACTION"].map((h) => (
              <span key={h} className="section-label">{h}</span>
            ))}
          </div>

          <div className="divide-y divide-[#f0f2f5]">
            {filtered.length === 0 ? (
              <div className="py-12 text-center">
                <AlertTriangle className="w-8 h-8 text-[#d1d5db] mx-auto mb-3" />
                <p className="text-[#6b7280] text-sm">No alerts match your filters</p>
              </div>
            ) : (
              filtered.map((alert) => {
                const statusConf = STATUS_CONFIG[alert.status];
                const isSelected = selectedAlert?.id === alert.id;
                return (
                  <div
                    key={alert.id}
                    onClick={() => setSelectedAlert(isSelected ? null : alert)}
                    className={cn(
                      "grid grid-cols-[1fr_90px_100px_190px_110px_80px] gap-3 px-4 py-3.5 cursor-pointer transition-all",
                      isSelected
                        ? "bg-[#f0f9ff] border-l-2 border-l-[#0f76ad]"
                        : alert.riskBand === "HIGH"
                        ? "hover:bg-[#fef2f2] border-l-2 border-l-transparent hover:border-l-[#dc2626]/40"
                        : "hover:bg-[#f7f8fa] border-l-2 border-l-transparent"
                    )}
                  >
                    {/* Wallet ID */}
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ background: getRiskColor(alert.riskBand) }}
                      />
                      <span className="mono text-[#111827] text-sm font-semibold">{alert.walletId}</span>
                    </div>

                    {/* Risk score */}
                    <div className="flex items-center">
                      <span className="mono text-sm font-bold" style={{ color: getRiskColor(alert.riskBand) }}>
                        {alert.riskScore.toFixed(2)}
                      </span>
                    </div>

                    {/* Risk band */}
                    <div className="flex items-center">
                      <RiskBadge band={alert.riskBand} />
                    </div>

                    {/* Detection type */}
                    <div className="flex flex-col justify-center min-w-0">
                      <p className="text-[#111827] text-xs truncate">{alert.detectionType}</p>
                      <span className="text-[#9ca3af] text-[10px] flex items-center gap-0.5 mt-0.5">
                        <Clock className="w-2 h-2" />
                        {formatRelativeTime(alert.timestamp)}
                      </span>
                    </div>

                    {/* Status */}
                    <div className="flex items-center">
                      <span
                        className="text-[10px] font-semibold px-2 py-0.5 rounded"
                        style={{
                          color: statusConf.color,
                          background: statusConf.bg,
                          border: `1px solid ${statusConf.border}`,
                        }}
                      >
                        {statusConf.label}
                      </span>
                    </div>

                    {/* Action */}
                    <div className="flex items-center gap-1">
                      <Link
                        href={`/wallet/${alert.walletId}`}
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 rounded hover:bg-[#e0f2fe] text-[#9ca3af] hover:text-[#0f76ad] transition-colors"
                        title="Investigate wallet"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Link>
                      <Link
                        href={`/network?focus=${alert.walletId}`}
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 rounded hover:bg-[#eef2ff] text-[#9ca3af] hover:text-[#6366f1] transition-colors"
                        title="Entity graph"
                      >
                        <Network className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ─── Alert detail panel ─────────────────────────── */}
      {selectedAlert && (
        <div className="w-72 flex-shrink-0 border-l border-[#e4e7ec] p-5 overflow-y-auto bg-[#f7f8fa]">
          <div className="flex items-center justify-between mb-4">
            <span className="section-label">ALERT DETAIL</span>
            <button
              onClick={() => setSelectedAlert(null)}
              className="text-[#9ca3af] hover:text-[#111827] text-lg leading-none"
            >
              ×
            </button>
          </div>

          {/* Risk indicator */}
          <div
            className="p-4 rounded-xl mb-4 text-center border"
            style={{
              background: STATUS_CONFIG[selectedAlert.status].bg,
              borderColor: getRiskColor(selectedAlert.riskBand) + "33",
            }}
          >
            <p className="mono text-4xl font-black" style={{ color: getRiskColor(selectedAlert.riskBand) }}>
              {selectedAlert.riskScore.toFixed(2)}
            </p>
            <p className="text-[#6b7280] text-xs mt-1">RISK SCORE</p>
            <div className="mt-2">
              <RiskBadge band={selectedAlert.riskBand} />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <span className="section-label">WALLET</span>
              <p className="mono text-[#111827] text-sm font-semibold mt-1">{selectedAlert.walletId}</p>
            </div>

            <div>
              <span className="section-label">DETECTION TYPE</span>
              <p className="text-[#111827] text-sm mt-1">{selectedAlert.detectionType}</p>
            </div>

            <div>
              <span className="section-label">FLAG REASONS</span>
              <div className="space-y-1 mt-2">
                {selectedAlert.reasons.map((reason, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="mt-1.5 w-1 h-1 rounded-full flex-shrink-0" style={{ background: getRiskColor(selectedAlert.riskBand) }} />
                    <p className="text-[#4b5563] text-xs">{reason}</p>
                  </div>
                ))}
              </div>
            </div>

            <SectionHeader label="TRANSACTIONS" className="mb-0">
              <span className="mono text-[#0f76ad] text-sm font-semibold">
                {selectedAlert.txCount.toLocaleString()}
              </span>
            </SectionHeader>

            <div className="divider" />

            <div className="flex flex-col gap-2">
              <Link
                href={`/wallet/${selectedAlert.walletId}`}
                className="btn-primary w-full justify-center text-xs"
              >
                <Eye className="w-3.5 h-3.5" />
                Investigate Wallet
              </Link>
              <Link
                href={`/network?focus=${selectedAlert.walletId}`}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-[#c7d2fe] text-[#6366f1] text-xs hover:bg-[#eef2ff] transition-colors"
              >
                <Network className="w-3.5 h-3.5" />
                Entity Graph
              </Link>
            </div>

            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-[#fffbeb] border border-[#fde68a]">
              <Info className="w-3 h-3 text-[#d97706] flex-shrink-0 mt-0.5" />
              <p className="text-[#92400e] text-[10px] leading-relaxed">
                Risk score derived from offline analysis of synthetic benchmark data.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
