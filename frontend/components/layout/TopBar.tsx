"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  Bell,
  User,
  Command,
  X,
  ShieldAlert,
  ArrowRight,
} from "lucide-react";
import { getTopAlerts, getWallets } from "@/lib/api";
import type { Alert, Wallet } from "@/types/btc-scope";
import { getRiskColor } from "@/lib/utils";

export default function TopBar() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
        setQuery("");
        setNotifOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    getWallets(100).then(setWallets).catch(() => setWallets([]));
    getTopAlerts(20).then(setAlerts).catch(() => setAlerts([]));
  }, []);

  const filteredWallets = query.trim()
    ? wallets.filter((w) => w.id.toLowerCase().includes(query.toLowerCase())).slice(0, 4)
    : [];

  const filteredAlerts = query.trim()
    ? alerts.filter(
        (a) =>
          a.walletId.toLowerCase().includes(query.toLowerCase()) ||
          a.detectionType.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 3)
    : [];

  const newAlertsCount = alerts.filter((a) => a.status === "NEW").length;

  return (
    <>
      <header className="h-[52px] flex items-center gap-4 px-5 border-b border-[#e4e7ec] bg-white flex-shrink-0 z-20 relative">

        {/* Platform identity */}
        <div className="flex items-center gap-2 mr-2">
          <span className="text-[#111827] text-[13px] font-semibold tracking-wide hidden md:block">
            Bitcoin Forensic Intelligence
          </span>
          <span className="hidden lg:block text-[#d1d5db] text-xs">·</span>
          <span className="hidden lg:block text-[#9ca3af] text-xs">Synthetic Research Dataset</span>
        </div>

        {/* Search trigger */}
        <button
          onClick={() => { setSearchOpen(true); setTimeout(() => inputRef.current?.focus(), 50); }}
          className="flex items-center gap-2 flex-1 max-w-[260px] px-3 py-1.5 rounded-lg bg-[#f7f8fa] border border-[#e4e7ec] text-[#9ca3af] text-xs hover:border-[#d1d5db] hover:text-[#6b7280] transition-colors"
        >
          <Search className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">Search wallet, TXID, alert…</span>
          <kbd className="ml-auto flex items-center gap-0.5 px-1.5 py-0.5 bg-[#f0f2f5] rounded text-[9px] font-mono text-[#9ca3af] flex-shrink-0">
            <Command className="w-2.5 h-2.5" />K
          </kbd>
        </button>

        <div className="flex-1" />

        {/* Status strip */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#fef9c3] border border-[#fde68a]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#d97706] flex-shrink-0" />
          <span className="text-[#92400e] text-[10px] font-semibold tracking-wide">
            OFFLINE BENCHMARK
          </span>
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative p-1.5 rounded-lg text-[#6b7280] hover:text-[#111827] hover:bg-[#f7f8fa] transition-colors"
          >
            <Bell className="w-[15px] h-[15px]" />
            {newAlertsCount > 0 && (
              <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-[#dc2626] text-white text-[7px] font-bold flex items-center justify-center">
                {newAlertsCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div
              className="absolute right-0 top-full mt-2 w-[280px] rounded-xl overflow-hidden z-50 shadow-xl"
              style={{ background: "#ffffff", border: "1px solid #e4e7ec" }}
            >
              <div className="px-4 py-3 border-b border-[#f0f2f5] flex items-center justify-between">
                <span className="text-[#111827] text-xs font-semibold">Risk Alerts</span>
                <span className="risk-badge-high">{newAlertsCount} NEW</span>
              </div>
              <div className="max-h-60 overflow-y-auto">
                {alerts.filter((a) => a.status === "NEW").slice(0, 5).map((alert) => (
                  <Link
                    key={alert.id}
                    href={`/alerts`}
                    onClick={() => setNotifOpen(false)}
                    className="flex items-start gap-3 px-4 py-2.5 border-b border-[#f0f2f5] hover:bg-[#f7f8fa] transition-colors"
                  >
                    <ShieldAlert
                      className="w-3.5 h-3.5 mt-0.5 flex-shrink-0"
                      style={{ color: getRiskColor(alert.riskBand) }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="mono text-[#111827] text-xs font-semibold">{alert.walletId}</p>
                      <p className="text-[#6b7280] text-[10px] truncate">{alert.detectionType}</p>
                    </div>
                    <span className="mono text-xs font-bold flex-shrink-0" style={{ color: getRiskColor(alert.riskBand) }}>
                      {alert.riskScore.toFixed(1)}
                    </span>
                  </Link>
                ))}
              </div>
              <Link
                href="/alerts"
                onClick={() => setNotifOpen(false)}
                className="flex items-center justify-center gap-1.5 py-2.5 text-[#0f76ad] text-xs hover:bg-[#f0f2f5] transition-colors"
              >
                View all alerts <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          )}
        </div>

        {/* Profile */}
        <button className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-[#f7f8fa] transition-colors">
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 bg-[#0f76ad]"
          >
            <User className="w-3 h-3 text-white" />
          </div>
          <span className="hidden md:inline text-[#6b7280] text-xs">Analyst</span>
        </button>
      </header>

      {/* ─── Global search overlay ────────────────────────── */}
      {searchOpen && (
        <div
          className="fixed inset-0 bg-black/25 backdrop-blur-sm z-50 flex items-start justify-center pt-[15vh]"
          onClick={() => { setSearchOpen(false); setQuery(""); }}
        >
          <div
            className="w-full max-w-lg rounded-xl overflow-hidden shadow-2xl"
            style={{ background: "#ffffff", border: "1px solid #d1d5db" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-[#f0f2f5]">
              <Search className="w-3.5 h-3.5 text-[#0f76ad] flex-shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search wallet ID, TXID, alert type…"
                className="flex-1 bg-transparent text-[#111827] text-sm placeholder-[#9ca3af] outline-none"
              />
              <button
                onClick={() => { setSearchOpen(false); setQuery(""); }}
                className="text-[#9ca3af] hover:text-[#6b7280] transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quick nav (empty query) */}
            {query.trim() === "" && (
              <div className="px-4 py-4">
                <p className="section-label mb-2.5">QUICK NAVIGATE</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { label: "Command Center",     href: "/"                },
                    { label: "Risk Alerts",         href: "/alerts"          },
                    { label: "Entity Graph",        href: "/network"         },
                    { label: "AI Intelligence",     href: "/ai-intelligence" },
                  ].map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => { setSearchOpen(false); setQuery(""); }}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[#e4e7ec] bg-[#f7f8fa] text-[#6b7280] text-xs hover:text-[#0f76ad] hover:border-[#0f76ad]/30 transition-colors"
                    >
                      <ArrowRight className="w-3 h-3 flex-shrink-0" />
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Results */}
            {query.trim() !== "" && (
              <div className="max-h-72 overflow-y-auto">
                {filteredWallets.length > 0 && (
                  <>
                    <div className="px-4 py-2 bg-[#f7f8fa] border-b border-[#e4e7ec]">
                      <span className="section-label">WALLETS</span>
                    </div>
                    {filteredWallets.map((wallet) => (
                      <Link
                        key={wallet.id}
                        href={`/wallet/${wallet.id}`}
                        onClick={() => { setSearchOpen(false); setQuery(""); }}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-[#f7f8fa] transition-colors border-b border-[#f0f2f5]"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="mono text-[#111827] text-sm font-semibold">{wallet.id}</p>
                          <p className="text-[#6b7280] text-xs">{wallet.totalTransactions} transactions</p>
                        </div>
                        <span className="mono text-xs font-bold" style={{ color: getRiskColor(wallet.riskBand) }}>
                          {wallet.riskScore.toFixed(1)}
                        </span>
                      </Link>
                    ))}
                  </>
                )}

                {filteredAlerts.length > 0 && (
                  <>
                    <div className="px-4 py-2 bg-[#f7f8fa] border-b border-[#e4e7ec]">
                      <span className="section-label">ALERTS</span>
                    </div>
                    {filteredAlerts.map((alert) => (
                      <Link
                        key={alert.id}
                        href={`/alerts`}
                        onClick={() => { setSearchOpen(false); setQuery(""); }}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-[#f7f8fa] transition-colors border-b border-[#f0f2f5]"
                      >
                        <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0" style={{ color: getRiskColor(alert.riskBand) }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-[#111827] text-sm font-medium">{alert.detectionType}</p>
                          <p className="mono text-[#6b7280] text-xs">{alert.walletId}</p>
                        </div>
                      </Link>
                    ))}
                  </>
                )}

                {filteredWallets.length === 0 && filteredAlerts.length === 0 && (
                  <p className="py-8 text-center text-[#9ca3af] text-sm">
                    No results for &quot;{query}&quot;
                  </p>
                )}
              </div>
            )}

            {/* Footer hints */}
            <div className="px-4 py-2 bg-[#f7f8fa] border-t border-[#e4e7ec] flex items-center gap-4">
              <span className="text-[#9ca3af] text-[10px]">↵ Open</span>
              <span className="text-[#9ca3af] text-[10px]">ESC Close</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
