// Core domain types for BTC-SCOPE

export type RiskBand = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface Wallet {
  id: string;
  riskScore: number;
  riskBand: RiskBand;
  totalTransactions: number;
  totalBTC: number;
  firstSeen: string;
  lastSeen: string;
  flagReasons: string[];
  behavioralFeatures: BehavioralFeatures;
  graphFeatures: GraphFeatures;
  anomalyScores: AnomalyScores;
}

export interface BehavioralFeatures {
  transactionFrequency: number; // txs per day
  avgTransactionAmount: number;
  maxTransactionAmount: number;
  rapidActivityScore: number; // 0-1
  fanInRatio: number; // inputs vs outputs ratio
  fanOutRatio: number;
  dormancyPeriods: number;
  amountVariance: number;
}

export interface GraphFeatures {
  degree: number;
  inDegree: number;
  outDegree: number;
  clusteringCoefficient: number;
  betweennessCentrality: number;
  pageRank: number;
  communityId: number;
  connectedComponents: number;
}

export interface AnomalyScores {
  statisticalAnomaly: number; // 0-100
  isolationForest: number; // 0-1 (higher = more anomalous)
  autoEncoder: number;
  overallRisk: number; // 0-100
  modelConfidence: number; // 0-1
}

export interface Transaction {
  txid: string;
  timestamp: string;
  amount: number;
  fee: number;
  inputAddresses: string[];
  outputAddresses: string[];
  riskScore: number;
  aiConfidence: number;
  flagged: boolean;
  detectionType?: string;
}

export interface Alert {
  id: string;
  walletId: string;
  riskScore: number;
  riskBand: RiskBand;
  reasons: string[];
  timestamp: string;
  status: AlertStatus;
  aiConfidence: number;
  detectionType: string;
  txCount: number;
}

export type AlertStatus =
  | "NEW"
  | "INVESTIGATING"
  | "CONFIRMED"
  | "FALSE_POSITIVE"
  | "RESOLVED";

export interface NetworkNode {
  id: string;
  type: "wallet" | "transaction" | "ip" | "entity";
  riskBand?: RiskBand;
  riskScore?: number;
  label: string;
  connections: number;
  x?: number;
  y?: number;
}

export interface NetworkEdge {
  id: string;
  source: string;
  target: string;
  amount?: number;
  direction: "in" | "out" | "both";
  timestamp?: string;
}

export interface SystemStats {
  totalWallets: number;
  transactionsAnalyzed: number;
  highRiskWallets: number;
  mediumRiskWallets: number;
  lowRiskWallets: number;
  activeInvestigations: number;
  aiConfidence: number;
  systemStatus: "OPERATIONAL" | "DEGRADED" | "MAINTENANCE";
}

export interface ModelPerformance {
  modelName: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  auc: number;
  lastTrained: string;
  version: string;
}

export interface ActivityEvent {
  id: string;
  timestamp: string;
  type: "alert" | "investigation" | "detection" | "system";
  entityId: string;
  description: string;
  riskBand?: RiskBand;
  riskScore?: number;
}

export interface RiskContribution {
  factor: string;
  score: number;
  weight: number;
  description: string;
  evidenceType: "behavioral" | "graph" | "statistical" | "network";
}
