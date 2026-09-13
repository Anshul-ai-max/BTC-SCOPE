"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * /investigations is removed from the nav.
 * Legacy links redirect to /alerts (Risk Alerts).
 */
export default function InvestigationsRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/alerts");
  }, [router]);
  return null;
}
