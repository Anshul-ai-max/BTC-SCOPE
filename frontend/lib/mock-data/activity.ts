/**
 * BTC-SCOPE — Activity Events Mock Data
 * Synthetic research dataset.
 */
import type { ActivityEvent, SystemStats } from "@/types/btc-scope";

export const ACTIVITY_EVENTS: ActivityEvent[] = [
  {
    id: "EVT-001",
    timestamp: "2024-11-28T14:37:22Z",
    type: "alert",
    entityId: "W012109",
    description: "HIGH RISK alert triggered — Abnormal Transaction Behaviour",
    riskBand: "HIGH",
    riskScore: 96.36,
  },
  {
    id: "EVT-002",
    timestamp: "2024-11-28T07:22:01Z",
    type: "detection",
    entityId: "W017332",
    description: "Entity mixing pattern detected by anomaly engine",
    riskBand: "HIGH",
    riskScore: 91.4,
  },
  {
    id: "EVT-003",
    timestamp: "2024-11-27T09:14:11Z",
    type: "investigation",
    entityId: "W008834",
    description: "Investigation opened — Network Graph Anomaly",
    riskBand: "HIGH",
    riskScore: 88.91,
  },
  {
    id: "EVT-004",
    timestamp: "2024-11-27T03:41:00Z",
    type: "detection",
    entityId: "W002281",
    description: "Cross-community bridge node identified",
    riskBand: "HIGH",
    riskScore: 82.7,
  },
  {
    id: "EVT-005",
    timestamp: "2024-11-26T22:31:44Z",
    type: "alert",
    entityId: "W003214",
    description: "Statistical outlier flagged — Tumbling-like pattern",
    riskBand: "HIGH",
    riskScore: 76.44,
  },
  {
    id: "EVT-006",
    timestamp: "2024-11-26T16:00:00Z",
    type: "system",
    entityId: "SYSTEM",
    description: "Analysis pipeline completed — anomaly detection models ready",
    riskBand: undefined,
    riskScore: undefined,
  },
  {
    id: "EVT-007",
    timestamp: "2024-11-25T16:22:09Z",
    type: "alert",
    entityId: "W019872",
    description: "MEDIUM risk — Timing anomaly detected",
    riskBand: "MEDIUM",
    riskScore: 61.2,
  },
  {
    id: "EVT-008",
    timestamp: "2024-11-24T11:45:33Z",
    type: "investigation",
    entityId: "W006677",
    description: "Graph clustering anomaly under review",
    riskBand: "MEDIUM",
    riskScore: 54.8,
  },
];

export const SYSTEM_STATS: SystemStats = {
  totalWallets: 20000,
  totalTransactions: 100000,
  highRiskWallets: 3873,
  mediumRiskWallets: 8486,
  lowRiskWallets: 7641,
  activeInvestigations: 47,
  systemStatus: "OPERATIONAL",
};
