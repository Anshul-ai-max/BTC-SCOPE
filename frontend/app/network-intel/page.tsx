"use client";

import { Globe, Info } from "lucide-react";
import { NETWORK_INTEL } from "@/lib/mock-data/network-intel";
import { getRiskColor } from "@/lib/utils";
import { DatasetBadge } from "@/components/ui";

export default function NetworkIntelPage() {
  const { observedIPs, countries, suspiciousIPs, asns, geoEntries } = NETWORK_INTEL;

  return (
    <div className="p-5 space-y-5 min-h-full page-enter">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Globe className="w-3.5 h-3.5 text-[#059669]" />
            <span className="section-label">NETWORK INTELLIGENCE</span>
          </div>
          <h1 className="text-[22px] font-bold text-[#111827] tracking-tight">Network Intelligence</h1>
          <p className="text-[#6b7280] text-sm mt-0.5">IP-derived geographic distribution of observed entities</p>
        </div>
        <DatasetBadge />
      </div>

      {/* Geolocation disclaimer */}
      <div className="flex items-start gap-3 p-3.5 rounded-lg border border-[#fde68a] bg-[#fffbeb]">
        <Info className="w-4 h-4 text-[#d97706] flex-shrink-0 mt-0.5" />
        <p className="text-[#92400e] text-xs leading-relaxed">
          <strong>IP-DERIVED GEOLOCATION</strong> — Geographic information is inferred from IP
          metadata only. Does not identify individuals. Data is synthetic; country associations
          do not reflect actual network monitoring.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Observed IPs",    value: observedIPs.toLocaleString(),    color: "#0f76ad" },
          { label: "Countries",       value: countries.toString(),             color: "#6366f1" },
          { label: "Suspicious IPs",  value: suspiciousIPs.toLocaleString(),   color: "#dc2626" },
          { label: "ASNs",            value: asns.toString(),                  color: "#d97706" },
        ].map(({ label, value, color }) => (
          <div key={label} className="card p-4 text-center" style={{ borderTopColor: color, borderTopWidth: 2 }}>
            <p className="mono text-2xl font-black" style={{ color }}>{value}</p>
            <p className="text-[#6b7280] text-xs mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Country table */}
      <div className="card overflow-hidden">
        <div className="grid grid-cols-[1fr_80px_110px_110px_100px] gap-3 px-5 py-2.5 border-b border-[#f0f2f5] bg-[#f7f8fa]">
          {["COUNTRY", "IPs", "TRANSACTIONS", "SUSPICIOUS", "RISK"].map((h) => (
            <span key={h} className="section-label">{h}</span>
          ))}
        </div>
        <div className="divide-y divide-[#f0f2f5]">
          {geoEntries.map((geo) => {
            const riskColor = getRiskColor(geo.riskBand);
            return (
              <div
                key={geo.country}
                className="grid grid-cols-[1fr_80px_110px_110px_100px] gap-3 px-5 py-3.5 hover:bg-[#f7f8fa] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{geo.flag}</span>
                  <span className="text-[#111827] text-sm">{geo.country}</span>
                </div>
                <span className="mono text-[#0f76ad] text-sm">{geo.ips.toLocaleString()}</span>
                <span className="mono text-[#6b7280] text-sm">{geo.transactions.toLocaleString()}</span>
                <span className="mono text-[#d97706] text-sm">{geo.suspicious.toLocaleString()}</span>
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded self-center"
                  style={{
                    color: riskColor,
                    background: `${riskColor}10`,
                    border: `1px solid ${riskColor}25`,
                  }}
                >
                  {geo.riskBand}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Disclaimer footer */}
      <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-[#f7f8fa] border border-[#e4e7ec]">
        <Info className="w-3 h-3 text-[#9ca3af] flex-shrink-0 mt-0.5" />
        <p className="text-[#6b7280] text-xs">
          IP-derived geolocation — geographic information is inferred from IP metadata only.
          Does not identify individuals. Synthetic research dataset.
        </p>
      </div>
    </div>
  );
}
