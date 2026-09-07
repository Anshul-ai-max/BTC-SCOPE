"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FormEvent, ReactNode, useState } from "react";

const navigation = [
  ["Overview", "/", "▦"],
  ["Risk Alerts", "/alerts", "⚠"],
  ["Investigate Wallet", "/wallet", "⌕"],
  ["Network", "/network", "⌘"],
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [walletId, setWalletId] = useState("");
  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    const normalized = walletId.trim().toUpperCase();
    if (normalized) router.push(`/wallet/${encodeURIComponent(normalized)}`);
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link className="brand" href="/" aria-label="BTC-SCOPE Overview">
          <span className="brand-mark">◈</span>
          <span><strong>BTC-SCOPE</strong><small>Bitcoin Activity Intelligence</small></span>
        </Link>
        <form className="global-search" onSubmit={submitSearch}>
          <span aria-hidden="true">⌕</span>
          <input value={walletId} onChange={(event) => setWalletId(event.target.value)} placeholder="Search wallet ID (e.g. W012109)…" aria-label="Search wallet ID" />
        </form>
        <div className="desk"><span>Synthetic Research Prototype</span><div className="avatar">A</div></div>
      </header>
      <aside className="sidebar">
        <nav>
          {navigation.map(([label, href, icon]) => {
            const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return <Link key={href} href={href} className={isActive ? "nav-item active" : "nav-item"}><i>{icon}</i>{label}</Link>;
          })}
        </nav>
        <div className="stream-card"><span>DATA STREAM</span><p>Active Monitored Cluster</p></div>
      </aside>
      <main className="page-content">{children}</main>
    </div>
  );
}
