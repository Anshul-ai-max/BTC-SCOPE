/**
 * BTC-SCOPE — Network Intelligence Mock Data
 * IP-derived geolocation — synthetic research dataset.
 */
import type { NetworkIntelligenceSummary } from "@/types/btc-scope";

export const NETWORK_INTEL: NetworkIntelligenceSummary = {
  observedIPs: 12819,
  countries: 47,
  suspiciousIPs: 2604,
  asns: 384,
  geoEntries: [
    { country: "United States", flag: "🇺🇸", ips: 3421, transactions: 22100, suspicious: 614, riskBand: "MEDIUM" },
    { country: "Germany",       flag: "🇩🇪", ips: 1847, transactions: 12340, suspicious: 342, riskBand: "MEDIUM" },
    { country: "China",         flag: "🇨🇳", ips: 2104, transactions: 15780, suspicious: 521, riskBand: "HIGH"   },
    { country: "Netherlands",   flag: "🇳🇱", ips: 1203, transactions: 8920,  suspicious: 287, riskBand: "HIGH"   },
    { country: "Russia",        flag: "🇷🇺", ips: 987,  transactions: 7340,  suspicious: 312, riskBand: "HIGH"   },
    { country: "India",         flag: "🇮🇳", ips: 891,  transactions: 6140,  suspicious: 198, riskBand: "MEDIUM" },
    { country: "Singapore",     flag: "🇸🇬", ips: 754,  transactions: 5120,  suspicious: 187, riskBand: "MEDIUM" },
    { country: "Brazil",        flag: "🇧🇷", ips: 612,  transactions: 4230,  suspicious: 143, riskBand: "LOW"    },
  ],
};
