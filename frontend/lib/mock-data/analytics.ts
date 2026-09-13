/**
 * BTC-SCOPE — Analytics & Timeline Data
 * Synthetic research dataset.
 */
import type { AnalyticsSummary, TransactionTimelinePoint, MonthlyRiskPoint } from "@/types/btc-scope";
import { MODEL_EVALUATIONS } from "./models";

export const TRANSACTION_TIMELINE: TransactionTimelinePoint[] = [
  { date: "Nov 1",  normal: 8420,  suspicious: 340, flagged: 87  },
  { date: "Nov 5",  normal: 9120,  suspicious: 412, flagged: 102 },
  { date: "Nov 10", normal: 7830,  suspicious: 387, flagged: 94  },
  { date: "Nov 15", normal: 10240, suspicious: 521, flagged: 138 },
  { date: "Nov 18", normal: 9870,  suspicious: 478, flagged: 121 },
  { date: "Nov 20", normal: 11340, suspicious: 594, flagged: 162 },
  { date: "Nov 22", normal: 10780, suspicious: 547, flagged: 148 },
  { date: "Nov 24", normal: 12100, suspicious: 623, flagged: 177 },
  { date: "Nov 26", normal: 11680, suspicious: 601, flagged: 168 },
  { date: "Nov 28", normal: 9430,  suspicious: 487, flagged: 134 },
];

export const MONTHLY_RISK_TREND: MonthlyRiskPoint[] = [
  { month: "Jul", high: 312, medium: 714, low: 634 },
  { month: "Aug", high: 398, medium: 821, low: 701 },
  { month: "Sep", high: 427, medium: 893, low: 788 },
  { month: "Oct", high: 512, medium: 967, low: 831 },
  { month: "Nov", high: 473, medium: 924, low: 774 },
];

export const ANALYTICS_SUMMARY: AnalyticsSummary = {
  totalWallets: 20000,
  totalTransactions: 100000,
  riskDistribution: {
    high: 3873,
    medium: 8486,
    low: 7641,
    total: 20000,
  },
  transactionTimeline: TRANSACTION_TIMELINE,
  monthlyRiskTrend: MONTHLY_RISK_TREND,
  modelComparison: MODEL_EVALUATIONS,
};
