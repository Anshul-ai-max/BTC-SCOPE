"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeftRight, Search, Clock, AlertTriangle, Info } from "lucide-react";
import { getTransactions } from "@/lib/api";
import type { Transaction } from "@/types/btc-scope";
import { RiskBadge, CopyButton, DatasetBadge } from "@/components/ui";
import { getRiskColor, formatTimestamp, truncateHash, scoreToRiskBand } from "@/lib/utils";
import { cn } from "@/lib/utils";

const TOOLTIP_LIGHT = {
  contentStyle: { background: "#fff", border: "1px solid #e4e7ec", borderRadius: 8, fontSize: 12 },
};

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showFlaggedOnly, setShowFlaggedOnly] = useState(false);

  useEffect(() => {
    getTransactions(undefined, 100).then(({ transactions: rows, total: count }) => { setTransactions(rows); setTotal(count); }).catch((requestError: Error) => setError(requestError.message));
  }, []);

  const filtered = transactions.filter((tx) => {
    if (showFlaggedOnly && !tx.flagged) return false;
    if (!search) return true;
    return (
      tx.txid.includes(search) ||
      tx.inputAddresses.some((a) => a.toLowerCase().includes(search.toLowerCase())) ||
      tx.outputAddresses.some((a) => a.toLowerCase().includes(search.toLowerCase()))
    );
  });

  const flaggedCount = transactions.filter((t) => t.flagged).length;

  return (
    <div className="p-5 space-y-5 min-h-full page-enter">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <ArrowLeftRight className="w-3.5 h-3.5 text-[#0f76ad]" />
            <span className="section-label">TRANSACTION ANALYSIS</span>
          </div>
          <h1 className="text-[22px] font-bold text-[#111827] tracking-tight">Transactions</h1>
          <p className="text-[#6b7280] text-sm mt-0.5">
            Showing {filtered.length} of {total.toLocaleString()} · {flaggedCount} high-risk senders in this view
          </p>
        </div>
        <DatasetBadge />
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Dataset Total",  value: total.toLocaleString(),                  color: "#0f76ad" },
          { label: "High-risk senders (view)", value: flaggedCount,                  color: "#dc2626" },
          { label: "Other (view)", value: transactions.length - flaggedCount,        color: "#059669" },
        ].map(({ label, value, color }) => (
          <div key={label} className="card p-3 text-center" style={{ borderTopColor: color, borderTopWidth: 2 }}>
            <p className="mono text-lg font-bold" style={{ color }}>{value}</p>
            <p className="text-[9px] text-[#9ca3af] font-semibold tracking-wider mt-0.5">{label.toUpperCase()}</p>
          </div>
        ))}
      </div>

      {error && <div className="px-3 py-2 rounded-lg border border-[#fecaca] bg-[#fef2f2] text-[#b91c1c] text-xs">{error}</div>}

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9ca3af]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search TXID or wallet address…"
            className="form-input pl-9 w-full text-xs"
          />
        </div>
        <button
          onClick={() => setShowFlaggedOnly(!showFlaggedOnly)}
          className={cn(
            "btn-secondary text-xs",
            showFlaggedOnly && "border-[#dc2626] text-[#dc2626] bg-[#fef2f2]"
          )}
        >
          <AlertTriangle className="w-3 h-3" />
          {showFlaggedOnly ? "Flagged Only" : "Show All"}
        </button>
      </div>

      {/* Synthetic disclaimer */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#fffbeb] border border-[#fde68a]">
        <Info className="w-3 h-3 text-[#d97706] flex-shrink-0" />
        <p className="text-[#92400e] text-xs">
          <strong>Synthetic Research Dataset</strong> — Transaction IDs and addresses are synthetic.
          This is not a live Bitcoin explorer.
        </p>
      </div>

      {/* Transaction list */}
      <div className="space-y-3">
        {filtered.map((tx) => {
          const riskBand = scoreToRiskBand(tx.riskScore);
          return (
            <div
              key={tx.txid}
              className={cn(
                "card p-5 space-y-4",
                tx.flagged && "border-l-2 border-l-[#dc2626]"
              )}
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="section-label">TXID</span>
                    {tx.flagged && <RiskBadge band={riskBand} />}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="mono text-[#111827] text-sm">{truncateHash(tx.txid, 12)}</span>
                    <CopyButton text={tx.txid} />
                  </div>
                </div>
                <div className="text-right">
                  <p className="mono text-[#d97706] text-lg font-bold">₿{tx.amount.toFixed(4)}</p>
                  <p className="text-[#9ca3af] text-xs">fee: ₿{tx.fee.toFixed(5)}</p>
                </div>
              </div>

              {/* Flow visualization */}
              <div className="flex items-center gap-3">
                <div className="flex-1 space-y-1">
                  <p className="section-label">INPUTS</p>
                  {tx.inputAddresses.map((a) => (
                    <Link key={a} href={`/wallet/${a}`} className="block mono text-[#0f76ad] text-xs hover:underline">{a}</Link>
                  ))}
                </div>
                <div className="flex flex-col items-center gap-1 flex-shrink-0">
                  <div className="w-px h-4 bg-[#e4e7ec]" />
                  <div className="w-8 h-8 rounded-full bg-[#fef3c7] border border-[#fde68a] flex items-center justify-center">
                    <ArrowLeftRight className="w-3 h-3 text-[#d97706]" />
                  </div>
                  <div className="w-px h-4 bg-[#e4e7ec]" />
                </div>
                <div className="flex-1 text-right space-y-1">
                  <p className="section-label text-right">OUTPUTS</p>
                  {tx.outputAddresses.map((a) => (
                    <Link key={a} href={`/wallet/${a}`} className="block mono text-[#059669] text-xs hover:underline text-right">{a}</Link>
                  ))}
                </div>
              </div>

              {/* Meta */}
              <div className="flex items-center gap-4 pt-3 border-t border-[#f0f2f5]">
                <span className="text-[#9ca3af] text-xs flex items-center gap-1">
                  <Clock className="w-3 h-3" />{formatTimestamp(tx.timestamp)}
                </span>
                <div className="flex-1" />
                {tx.flagged && (
                  <>
                    <span className="text-[#6b7280] text-xs">
                      Risk: <span className="mono font-semibold" style={{ color: getRiskColor(riskBand) }}>{tx.riskScore.toFixed(1)}</span>
                    </span>
                    {tx.detectionReason && (
                      <span className="text-xs font-medium" style={{ color: getRiskColor(riskBand) }}>{tx.detectionReason}</span>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
