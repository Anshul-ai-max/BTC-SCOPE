/**
 * BTC-SCOPE TypeScript Type Definitions
 * Defines interfaces for all domain entities.
 * The FastAPI client maps the existing processed CSV outputs to these types.
 */

export type RiskBand = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type AlertStatus =
  | "NEW"
  | "INVESTIGATING"
  | "CONFIRMED"
  | "FALSE_POSITIVE"
  | "RESOLVED";

// ─── Wallet ────────────────────────────────────────────────────────────────────
export interface BehavioralFeatures {
  transactionFrequency: number;   // tx/day
  avgTransactionAmount: number;   // BTC
  maxTransactionAmount: number;   // BTC
  rapidActivityScore: number;     // 0-1
  fanInRatio: number;
  fanOutRatio: number;
  dormancyPeriods?: number;
  amountVariance?: number;         // 0-1
}

export interface GraphFeatures {
  degree: number;
  inDegree: number;
  outDegree: number;
  clusteringCoefficient?: number;  // not exposed by the current graph output
  betweennessCentrality?: number;
  pageRank?: number;
  communityId?: number;
  connectedComponents?: number;
  twoHopNeighbors?: number;
  fanInScore?: number;
  fanOutScore?: number;
  chainScore?: number;
}

export interface AnomalyScores {
  statisticalAnomaly: number;  // 0-100
  isolationForest: number;     // 0-1 (higher = more anomalous)
  overallRisk: number;         // 0-100
  modelConfidence?: number;    // not exposed by the current model output
}

export interface Wallet {
  id: string;
  riskScore: number;        // 0-100
  riskBand: RiskBand;
  totalTransactions: number;
  totalBTC: number;
  firstSeen: string;        // ISO 8601
  lastSeen: string;         // ISO 8601
  flagReasons: string[];
  behavioralFeatures: BehavioralFeatures;
  graphFeatures: GraphFeatures;
  anomalyScores: AnomalyScores;
}

// ─── Alert ─────────────────────────────────────────────────────────────────────
export interface Alert {
  id: string;
  walletId: string;
  riskScore: number;
  riskBand: RiskBand;
  reasons: string[];
  timestamp: string;
  status: AlertStatus;
  detectionType: string;
  txCount: number;
}

// ─── Transaction ───────────────────────────────────────────────────────────────
export interface Transaction {
  txid: string;
  timestamp: string;
  amount: number;           // BTC
  fee: number;              // BTC
  inputAddresses: string[];
  outputAddresses: string[];
  riskScore: number;        // 0-100
  flagged: boolean;
  detectionReason?: string;
}

// ─── Network Graph ─────────────────────────────────────────────────────────────
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
  amount?: number;          // BTC
  direction: "in" | "out" | "both";
  timestamp?: string;
}

// ─── Model Evaluation ──────────────────────────────────────────────────────────
export interface ModelEvaluation {
  modelName: string;
  rocAuc?: number;          // from offline evaluation on synthetic dataset; optional for non-detector layers
  prAuc?: number;
  precisionAt5?: number;
  recallAt5?: number;
  lastEvaluated: string;    // ISO date string
  version: string;
  note?: string;
}

// ─── Risk Distribution ─────────────────────────────────────────────────────────
export interface RiskDistribution {
  high: number;
  medium: number;
  low: number;
  total: number;
}

// ─── Analytics Summary ─────────────────────────────────────────────────────────
export interface AnalyticsSummary {
  totalWallets: number;
  totalTransactions: number;
  riskDistribution: RiskDistribution;
  transactionTimeline: TransactionTimelinePoint[];
  monthlyRiskTrend: MonthlyRiskPoint[];
  modelComparison: ModelEvaluation[];
}

export interface TransactionTimelinePoint {
  date: string;
  normal: number;
  suspicious: number;
  flagged: number;
}

export interface MonthlyRiskPoint {
  month: string;
  high: number;
  medium: number;
  low: number;
}

// ─── Risk Contribution (for explainability) ────────────────────────────────────
export interface RiskContribution {
  factor: string;
  score: number;            // 0-100
  weight: number;           // 0-1
  description: string;
  evidenceType: "behavioral" | "graph" | "statistical" | "network";
}

// ─── Activity / Audit Event ────────────────────────────────────────────────────
export interface ActivityEvent {
  id: string;
  timestamp: string;
  type: "alert" | "investigation" | "detection" | "system";
  entityId: string;
  description: string;
  riskBand?: RiskBand;
  riskScore?: number;
}

// ─── Network Intelligence ──────────────────────────────────────────────────────
export interface GeoEntry {
  country: string;
  flag: string;
  ips: number;
  transactions: number;
  suspicious: number;
  riskBand: RiskBand;
}

export interface NetworkIntelligenceSummary {
  observedIPs: number;
  countries: number;
  suspiciousIPs: number;
  asns: number;
  geoEntries: GeoEntry[];
}

// ─── System Stats ──────────────────────────────────────────────────────────────
export interface SystemStats {
  totalWallets: number;
  totalTransactions: number;
  highRiskWallets: number;
  mediumRiskWallets: number;
  lowRiskWallets: number;
  activeInvestigations?: number;
  systemStatus: "OPERATIONAL" | "DEGRADED" | "MAINTENANCE";
}
