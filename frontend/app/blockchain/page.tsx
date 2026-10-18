"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { getSelectedWalletId } from "@/lib/wallet-selection";

function BlockchainRedirect() {
  const params = useSearchParams();
  const router = useRouter();
  const walletId = params.get("wallet") ?? getSelectedWalletId() ?? "W012109";

  useEffect(() => {
    router.replace(`/wallet/${walletId}`);
  }, [walletId, router]);

  return (
    <div className="flex items-center justify-center h-full bg-[#0c1220]">
      <p className="text-[#7d8fa3] text-sm">Redirecting to wallet investigation…</p>
    </div>
  );
}

export default function BlockchainPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-full bg-[#0c1220]">
        <p className="text-[#7d8fa3] text-sm">Loading…</p>
      </div>
    }>
      <BlockchainRedirect />
    </Suspense>
  );
}
