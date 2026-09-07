"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "../../components/AppShell";
import { Panel } from "../../components/ui";

export default function WalletSearchPage() {
  const [walletId, setWalletId] = useState("");
  const router = useRouter();
  const submit = (event: FormEvent) => { event.preventDefault(); const value = walletId.trim().toUpperCase(); if (value) router.push(`/wallet/${encodeURIComponent(value)}`); };
  return <AppShell><div className="page-heading"><div className="eyebrow">⌕ INVESTIGATION DESK</div><h1>Investigate Wallet</h1><p>Enter a synthetic wallet identifier to retrieve its existing risk, behavioral, graph, and anomaly outputs.</p></div><Panel className="wallet-search-panel"><form onSubmit={submit}><label>Wallet ID<input autoFocus value={walletId} onChange={(event) => setWalletId(event.target.value)} placeholder="W012109" /></label><button className="button" type="submit">Open Investigation →</button></form><p>Example format: <code>W012109</code>. This research prototype contains 20,000 synthetic wallets.</p></Panel></AppShell>;
}
