/**
 * BTC-SCOPE — Model Evaluation Data
 * All metrics are from offline evaluation on the synthetic BTC-SCOPE benchmark.
 * Do NOT interpret these as live accuracy claims.
 */
import type { ModelEvaluation } from "@/types/btc-scope";

export const MODEL_EVALUATIONS: ModelEvaluation[] = [
  {
    modelName: "Isolation Forest",
    rocAuc: 0.979,
    prAuc: 0.608,
    precisionAt5: 0.632,
    recallAt5: 0.395,
    lastEvaluated: "2024-11-26",
    version: "v2.3.1",
    note: "Ensemble-based unsupervised anomaly detection. Wallets isolated quickly in random partitioning score higher anomaly.",
  },
  {
    modelName: "Statistical Anomaly Detector",
    rocAuc: 0.977,
    prAuc: 0.608,
    precisionAt5: undefined,
    recallAt5: undefined,
    lastEvaluated: "2024-11-26",
    version: "v1.8.0",
    note: "Z-score and IQR-based outlier detection on transaction frequency, amount variance, and timing patterns.",
  },
  {
    modelName: "Explainable Risk Scoring",
    rocAuc: undefined,
    prAuc: undefined,
    precisionAt5: undefined,
    recallAt5: undefined,
    lastEvaluated: "2024-11-26",
    version: "v3.1.0",
    note: "Weighted combination of behavioral, graph, and statistical evidence scores. Fully explainable via feature contributions. No standalone ROC-AUC — this layer aggregates outputs from the anomaly detectors.",
  },
];
