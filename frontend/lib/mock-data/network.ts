/**
 * BTC-SCOPE — Centralized Network Graph Mock Data
 * Synthetic research dataset.
 */
import type { NetworkNode, NetworkEdge } from "@/types/btc-scope";

export const NETWORK_NODES: NetworkNode[] = [
  { id: "W012109", type: "wallet", riskBand: "HIGH",   riskScore: 96.36, label: "W012109", connections: 387 },
  { id: "W017332", type: "wallet", riskBand: "HIGH",   riskScore: 91.4,  label: "W017332", connections: 198 },
  { id: "W008834", type: "wallet", riskBand: "HIGH",   riskScore: 88.91, label: "W008834", connections: 248 },
  { id: "W002281", type: "wallet", riskBand: "HIGH",   riskScore: 82.7,  label: "W002281", connections: 156 },
  { id: "W003214", type: "wallet", riskBand: "HIGH",   riskScore: 76.44, label: "W003214", connections: 178 },
  { id: "W019872", type: "wallet", riskBand: "MEDIUM", riskScore: 61.2,  label: "W019872", connections: 112 },
  { id: "W015678", type: "wallet", riskBand: "MEDIUM", riskScore: 58.3,  label: "W015678", connections: 94  },
  { id: "W006677", type: "wallet", riskBand: "MEDIUM", riskScore: 54.8,  label: "W006677", connections: 87  },
  { id: "W014509", type: "wallet", riskBand: "MEDIUM", riskScore: 47.3,  label: "W014509", connections: 64  },
  { id: "W011445", type: "wallet", riskBand: "LOW",    riskScore: 23.4,  label: "W011445", connections: 24  },
  { id: "W007123", type: "wallet", riskBand: "LOW",    riskScore: 12.1,  label: "W007123", connections: 18  },
  { id: "W021001", type: "wallet", riskBand: "LOW",    riskScore: 8.7,   label: "W021001", connections: 11  },
];

export const NETWORK_EDGES: NetworkEdge[] = [
  { id: "E1",  source: "W012109", target: "W008834", amount: 12.47, direction: "out", timestamp: "2024-11-28T14:37:22Z" },
  { id: "E2",  source: "W012109", target: "W017332", amount: 8.32,  direction: "out", timestamp: "2024-11-28T07:22:01Z" },
  { id: "E3",  source: "W017332", target: "W012109", amount: 45.81, direction: "out", timestamp: "2024-11-25T16:22:09Z" },
  { id: "E4",  source: "W008834", target: "W003214", amount: 3.14,  direction: "out", timestamp: "2024-11-27T09:14:11Z" },
  { id: "E5",  source: "W003214", target: "W006677", amount: 1.07,  direction: "out", timestamp: "2024-11-26T22:31:44Z" },
  { id: "E6",  source: "W006677", target: "W011445", amount: 0.87,  direction: "out", timestamp: "2024-11-24T11:45:33Z" },
  { id: "E7",  source: "W019872", target: "W012109", amount: 7.40,  direction: "out", timestamp: "2024-11-23T14:20:00Z" },
  { id: "E8",  source: "W002281", target: "W017332", amount: 22.10, direction: "out", timestamp: "2024-11-22T10:15:00Z" },
  { id: "E9",  source: "W014509", target: "W008834", amount: 5.60,  direction: "out", timestamp: "2024-11-21T08:30:00Z" },
  { id: "E10", source: "W015678", target: "W012109", amount: 18.90, direction: "out", timestamp: "2024-11-20T16:00:00Z" },
  { id: "E11", source: "W007123", target: "W011445", amount: 0.34,  direction: "out", timestamp: "2024-11-19T11:44:00Z" },
  { id: "E12", source: "W021001", target: "W007123", amount: 0.12,  direction: "out", timestamp: "2024-11-18T09:12:00Z" },
];
