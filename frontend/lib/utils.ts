import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { RiskBand } from "@/types/btc-scope";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Risk colour helpers (consistent across all pages) ─────────────────────

/** Returns the primary text/line colour for a risk band. */
export function getRiskColor(band: RiskBand | string | undefined): string {
  switch (band) {
    case "CRITICAL":
    case "HIGH":   return "#dc2626";
    case "MEDIUM": return "#d97706";
    case "LOW":    return "#059669";
    default:       return "#9ca3af";
  }
}

/** Returns a semi-transparent background tint for a risk band. */
export function getRiskBgColor(band: RiskBand | string | undefined): string {
  switch (band) {
    case "CRITICAL":
    case "HIGH":   return "rgba(220,38,38,0.08)";
    case "MEDIUM": return "rgba(217,119,6,0.08)";
    case "LOW":    return "rgba(5,150,105,0.08)";
    default:       return "rgba(156,163,175,0.06)";
  }
}

/** Returns the border colour for a risk band. */
export function getRiskBorderColor(band: RiskBand | string | undefined): string {
  switch (band) {
    case "CRITICAL":
    case "HIGH":   return "rgba(220,38,38,0.25)";
    case "MEDIUM": return "rgba(217,119,6,0.22)";
    case "LOW":    return "rgba(5,150,105,0.22)";
    default:       return "#d1d5db";
  }
}

/** Returns a box-shadow glow for investigation workspace use. */
export function getRiskGlow(band: RiskBand | string | undefined): string {
  switch (band) {
    case "CRITICAL":
    case "HIGH":   return "0 0 18px rgba(220,38,38,0.18)";
    case "MEDIUM": return "0 0 14px rgba(217,119,6,0.14)";
    case "LOW":    return "0 0 12px rgba(5,150,105,0.12)";
    default:       return "none";
  }
}

// ─── Formatters ──────────────────────────────────────────────────────────────
export function formatBTC(value: number): string {
  if (value >= 1000) return `${(value / 1000).toFixed(2)}K ₿`;
  return `${value.toFixed(4)} ₿`;
}

export function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);
  const hours   = Math.floor(diff / 3_600_000);
  const days    = Math.floor(diff / 86_400_000);
  if (minutes < 60) return `${minutes}m ago`;
  if (hours   < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export function truncateHash(hash: string, chars = 8): string {
  if (hash.length <= chars * 2 + 3) return hash;
  return `${hash.slice(0, chars)}…${hash.slice(-chars)}`;
}

export function scoreToRiskBand(score: number): RiskBand {
  if (score >= 75) return "HIGH";
  if (score >= 50) return "MEDIUM";
  return "LOW";
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}
