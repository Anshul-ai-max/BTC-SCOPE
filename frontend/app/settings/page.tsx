"use client";

import { Settings, Info } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="p-5 space-y-5 min-h-full page-enter">

      {/* ─── Header ─────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <Settings className="w-3.5 h-3.5 text-[#4b5563]" />
          <span className="section-label">CONFIGURATION</span>
        </div>
        <h1 className="text-[22px] font-bold text-[#111827] tracking-tight">Settings</h1>
        <p className="text-[#6b7280] text-sm mt-0.5">Platform configuration and display preferences</p>
      </div>

      <div className="max-w-2xl space-y-4">

        {/* Demo mode notice */}
        <div className="flex items-start gap-3 p-3.5 rounded-lg border border-[#fde68a] bg-[#fffbeb]">
          <Info className="w-4 h-4 text-[#d97706] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-[#92400e] text-xs font-semibold">OFFLINE DEMO MODE</p>
            <p className="text-[#a16207] text-xs mt-0.5">
              BTC-SCOPE is running on a synthetic benchmark. Backend integration is not yet active.
              Configuration changes are for demonstration only.
            </p>
          </div>
        </div>

        {/* API Configuration */}
        <div className="card p-5">
          <p className="text-[#111827] font-semibold text-sm mb-4 pb-3 border-b border-[#f0f2f5]">
            API Configuration
          </p>
          <div className="space-y-4">
            <div>
              <label className="text-[#6b7280] text-xs font-medium block mb-1.5">
                Backend API URL
              </label>
              <input
                type="text"
                defaultValue="http://localhost:8000"
                className="form-input w-full text-sm mono"
                readOnly
              />
            </div>
            <div>
              <label className="text-[#6b7280] text-xs font-medium block mb-1.5">
                API Timeout (ms)
              </label>
              <input
                type="number"
                defaultValue="30000"
                className="form-input w-full text-sm mono"
              />
            </div>
          </div>
        </div>

        {/* Display Preferences */}
        <div className="card p-5">
          <p className="text-[#111827] font-semibold text-sm mb-4 pb-3 border-b border-[#f0f2f5]">
            Display Preferences
          </p>
          <div className="space-y-4">
            <div>
              <label className="text-[#6b7280] text-xs font-medium block mb-1.5">
                High Risk Threshold (score)
              </label>
              <input
                type="number"
                defaultValue="75"
                className="form-input w-[120px] text-sm mono"
              />
            </div>
            <div>
              <label className="text-[#6b7280] text-xs font-medium block mb-1.5">
                Items Per Page
              </label>
              <input
                type="number"
                defaultValue="50"
                className="form-input w-[120px] text-sm mono"
              />
            </div>
          </div>
        </div>

        {/* Dataset info */}
        <div className="card p-5">
          <p className="text-[#111827] font-semibold text-sm mb-4 pb-3 border-b border-[#f0f2f5]">
            Dataset
          </p>
          <div className="space-y-2">
            {[
              { label: "Dataset type",       value: "Synthetic Research Benchmark" },
              { label: "Wallets",             value: "20,000 entities" },
              { label: "Transactions",        value: "100,000 records" },
              { label: "Analysis mode",       value: "Offline — no live data" },
              { label: "Evaluation basis",    value: "Offline benchmark metrics" },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between text-sm py-1.5 border-b border-[#f0f2f5] last:border-0">
                <span className="text-[#6b7280]">{label}</span>
                <span className="text-[#111827] font-medium mono text-xs">{value}</span>
              </div>
            ))}
          </div>
        </div>

        <button
          className="btn-primary w-full justify-center"
          onClick={() => alert("Configuration saved (demo mode — no persistence)")}
        >
          Save Configuration
        </button>
      </div>
    </div>
  );
}
