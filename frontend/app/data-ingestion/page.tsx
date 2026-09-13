"use client";

import {
  FolderOpen,
  Upload,
  CheckCircle,
  ArrowRight,
  Database,
  Brain,
  Network,
  ShieldAlert,
  Info,
  FlaskConical,
} from "lucide-react";
import { DatasetBadge } from "@/components/ui";

const PIPELINE_STEPS = [
  { id: "parse",     label: "PARSING",      icon: Database,     color: "#0f76ad" },
  { id: "correlate", label: "CORRELATION",  icon: Network,      color: "#6366f1" },
  { id: "ai",        label: "AI ANALYSIS",  icon: Brain,        color: "#d97706" },
  { id: "graph",     label: "GRAPH BUILD",  icon: Network,      color: "#059669" },
  { id: "alerts",    label: "ALERT GEN.",   icon: ShieldAlert,  color: "#dc2626" },
];

const SAMPLE_DATASETS = [
  {
    name: "BTC-SCOPE Transactions",
    filename: "btc_transactions_synthetic.csv",
    size: "12.4 MB",
    records: 100000,
    description: "Synthetic Bitcoin transaction records for benchmark evaluation",
  },
  {
    name: "Wallet Features",
    filename: "wallet_features.json",
    size: "8.7 MB",
    records: 20000,
    description: "Extracted behavioral and graph features per wallet entity",
  },
  {
    name: "Transaction Graph",
    filename: "network_graph.json",
    size: "3.2 MB",
    records: 148492,
    description: "Synthetic wallet-to-wallet transaction network edges",
  },
];

export default function DataIngestionPage() {
  return (
    <div className="p-5 space-y-5 min-h-full page-enter">

      {/* ─── Header ─────────────────────────────────────── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <FolderOpen className="w-3.5 h-3.5 text-[#0f76ad]" />
            <span className="section-label">DATA PIPELINE</span>
          </div>
          <h1 className="text-[22px] font-bold text-[#111827] tracking-tight">Data Ingestion</h1>
          <p className="text-[#6b7280] text-sm mt-0.5">
            Manage synthetic benchmark datasets · offline demo mode
          </p>
        </div>
        <DatasetBadge label="Offline Demo Mode" />
      </div>

      {/* ─── Demo-mode notice ───────────────────────────── */}
      <div className="flex items-start gap-3 p-3.5 rounded-lg border border-[#fde68a] bg-[#fffbeb]">
        <FlaskConical className="w-4 h-4 text-[#d97706] flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-[#92400e] text-xs font-semibold">
            SYNTHETIC RESEARCH DATASET — OFFLINE DEMO MODE
          </p>
          <p className="text-[#a16207] text-xs mt-0.5">
            BTC-SCOPE operates on a fully synthetic benchmark. No real Bitcoin transactions are
            ingested or processed. Backend endpoints are not yet connected.
          </p>
        </div>
      </div>

      {/* ─── Upload zone (prototype) ─────────────────────── */}
      <div className="card">
        <div className="px-5 py-3 border-b border-[#f0f2f5] flex items-center justify-between">
          <span className="section-label">DATASET UPLOAD — PROTOTYPE</span>
          <span className="text-[10px] text-[#9ca3af] font-medium">
            File processing not yet active — awaiting backend endpoint
          </span>
        </div>
        <div className="p-6">
          <div className="border-2 border-dashed border-[#d1d5db] hover:border-[#0f76ad]/40 transition-colors rounded-xl p-10 text-center cursor-pointer bg-[#f7f8fa] hover:bg-[#f0f9ff]">
            <Upload className="w-8 h-8 text-[#d1d5db] mx-auto mb-3" />
            <p className="text-[#4b5563] text-sm font-medium">Drop dataset file here or click to browse</p>
            <p className="text-[#9ca3af] text-xs mt-1">Supports CSV, JSON, XML — Max 500 MB</p>
            <div className="mt-4 flex items-center justify-center gap-2">
              {["CSV", "JSON", "XML"].map((fmt) => (
                <span
                  key={fmt}
                  className="px-2.5 py-0.5 rounded border border-[#e4e7ec] bg-white text-[#9ca3af] text-[10px] font-semibold mono"
                >
                  {fmt}
                </span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3 px-1">
            <Info className="w-3 h-3 text-[#9ca3af] flex-shrink-0" />
            <p className="text-[#9ca3af] text-[11px]">
              Uploaded files will not be processed until a FastAPI ingestion endpoint is connected.
            </p>
          </div>
        </div>
      </div>

      {/* ─── Processing pipeline ─────────────────────────── */}
      <div className="card">
        <div className="px-5 py-3 border-b border-[#f0f2f5]">
          <span className="section-label">PROCESSING PIPELINE</span>
        </div>
        <div className="p-5 overflow-x-auto">
          <div className="flex items-center gap-2 min-w-max">
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#f0f9ff] border border-[#bae6fd]">
              <FolderOpen className="w-4 h-4 text-[#0f76ad]" />
              <span className="text-xs text-[#0f76ad] font-semibold">DATASET</span>
            </div>
            {PIPELINE_STEPS.map((step) => {
              const StepIcon = step.icon;
              return (
                <div key={step.id} className="flex items-center gap-2">
                  <ArrowRight className="w-3.5 h-3.5 text-[#d1d5db] flex-shrink-0" />
                  <div
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg border"
                    style={{ background: `${step.color}08`, borderColor: `${step.color}25` }}
                  >
                    <StepIcon className="w-3.5 h-3.5" style={{ color: step.color }} />
                    <span className="text-xs font-semibold" style={{ color: step.color }}>
                      {step.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── Active benchmark datasets ───────────────────── */}
      <div className="card overflow-hidden">
        <div className="px-5 py-3 border-b border-[#f0f2f5] flex items-center justify-between">
          <span className="section-label">BENCHMARK DATASETS — ACTIVE</span>
          <span className="text-[#059669] text-xs flex items-center gap-1.5 font-semibold">
            <CheckCircle className="w-3 h-3" />
            {SAMPLE_DATASETS.length} datasets loaded
          </span>
        </div>
        <div className="divide-y divide-[#f0f2f5]">
          {SAMPLE_DATASETS.map((ds) => (
            <div key={ds.name} className="flex items-start gap-4 px-5 py-4 hover:bg-[#f7f8fa] transition-colors">
              <div className="w-8 h-8 rounded-lg bg-[#f0f9ff] border border-[#bae6fd] flex items-center justify-center flex-shrink-0 mt-0.5">
                <Database className="w-3.5 h-3.5 text-[#0f76ad]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[#111827] text-sm font-semibold">{ds.name}</p>
                <p className="mono text-[#9ca3af] text-[11px] mt-0.5">{ds.filename}</p>
                <p className="text-[#6b7280] text-xs mt-1">{ds.description}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="mono text-[#111827] text-sm font-semibold">
                  {ds.records.toLocaleString()}
                </p>
                <p className="text-[#9ca3af] text-[10px]">records</p>
                <p className="text-[#9ca3af] text-[10px]">{ds.size}</p>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0 mt-1">
                <CheckCircle className="w-3.5 h-3.5 text-[#059669]" />
                <span className="text-[#059669] text-[10px] font-semibold">ACTIVE</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
