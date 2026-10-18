"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { getSelectedWalletId, WALLET_SELECTION_EVENT } from "@/lib/wallet-selection";
import {
  LayoutDashboard,
  Brain,
  Share2,
  AlertTriangle,
  ArrowLeftRight,
  Globe,
  BarChart3,
  FolderInput,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  Database,
  Search,
} from "lucide-react";

// Navigation structure matching the product workflow
const NAV_ITEMS = [
  {
    id: "command",
    items: [
      { href: "/",              label: "Command Center",      icon: LayoutDashboard },
    ],
  },
  {
    id: "core",
    label: "Investigation",
    items: [
      { href: "/alerts",        label: "Risk Alerts",         icon: AlertTriangle   },
      { href: "/blockchain",    label: "Wallet Investigation", icon: Search          },
      { href: "/network",       label: "Entity Graph",         icon: Share2          },
    ],
  },
  {
    id: "analysis",
    label: "Analysis",
    items: [
      { href: "/ai-intelligence", label: "AI Intelligence",    icon: Brain          },
      { href: "/transactions",    label: "Transactions",        icon: ArrowLeftRight  },
      { href: "/network-intel",   label: "Network Intelligence",icon: Globe          },
      { href: "/analytics",       label: "Analytics",           icon: BarChart3      },
    ],
  },
  {
    id: "system",
    label: "System",
    items: [
      { href: "/data-ingestion",  label: "Data Ingestion",     icon: FolderInput    },
      { href: "/settings",        label: "Settings",            icon: Settings       },
    ],
  },
];

function BTCScopeLogo() {
  return (
    <svg
      viewBox="0 0 28 28"
      aria-hidden="true"
      className="w-5 h-5"
      fill="none"
    >
      <path
        d="M14 3.5 22 6.4v6.2c0 5.1-3.2 9.5-8 11.9-4.8-2.4-8-6.8-8-11.9V6.4L14 3.5Z"
        stroke="#0f76ad"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M10.7 11.2h4.5c1.1 0 2 .7 2 1.7s-.8 1.7-2 1.7h-4.5m0 0h5c1.2 0 2.2.8 2.2 1.9s-.9 1.9-2.2 1.9h-5V9.6"
        stroke="#0f76ad"
        strokeWidth="1.35"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M12.3 8.4v2M15.1 8.4v2M12.3 18.4v1.8M15.1 18.4v1.8" stroke="#0f76ad" strokeWidth="1.1" strokeLinecap="round" />
      <path d="M7.7 11.1 10.7 12.7M17.8 15.6l2.7 1.4" stroke="#5b6f85" strokeWidth="1" strokeLinecap="round" />
      <circle cx="7.2" cy="10.8" r="1.15" fill="#0f76ad" />
      <circle cx="20.9" cy="17.2" r="1.15" fill="#0f76ad" />
    </svg>
  );
}

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const refresh = () => setSelectedWalletId(getSelectedWalletId());
    refresh();
    window.addEventListener(WALLET_SELECTION_EVENT, refresh);
    return () => window.removeEventListener(WALLET_SELECTION_EVENT, refresh);
  }, []);

  return (
    <aside
      className={cn(
        "relative flex flex-col h-screen flex-shrink-0 z-30",
        "border-r border-[#e4e7ec] bg-white",
        "transition-all duration-250 ease-in-out",
        collapsed ? "w-[56px]" : "w-[210px]"
      )}
    >
      {/* ─── Logo ──────────────────────────────────────────── */}
      <div className={cn(
        "flex items-center gap-3 border-b border-[#e4e7ec]",
        collapsed ? "px-3 py-4 justify-center" : "px-4 py-4"
      )}>
        <div
          className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: "rgba(15,118,173,0.10)", border: "1px solid rgba(15,118,173,0.20)" }}
        >
          <BTCScopeLogo />
        </div>

        {!collapsed && (
          <div className="min-w-0">
            <p className="text-[#111827] font-bold text-[13px] tracking-wide leading-none">
              BTC-SCOPE
            </p>
          </div>
        )}
      </div>

      {/* ─── Navigation ─────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 space-y-1">
        {NAV_ITEMS.map(({ id, label, items }) => (
          <div key={id} className={label ? "mt-3" : ""}>
            {label && !collapsed && (
              <p className="px-2 mb-1 text-[9px] font-semibold tracking-[0.12em] text-[#9ca3af] uppercase select-none">
                {label}
              </p>
            )}
            {label && collapsed && <div className="h-px mx-2 mb-2 bg-[#e4e7ec]" />}
            <div className="space-y-px">
              {items.map(({ href, label: itemLabel, icon: Icon }) => {
                const selectedHref = href === "/blockchain" && selectedWalletId
                  ? `/blockchain?wallet=${selectedWalletId}`
                  : href === "/network" && selectedWalletId
                  ? `/network?focus=${selectedWalletId}`
                  : href;
                // Match /blockchain or /wallet routes for Wallet Investigation
                const isActive =
                  pathname === href ||
                  (href === "/blockchain" && (pathname.startsWith("/blockchain") || pathname.startsWith("/wallet")));
                return (
                  <Link
                    key={href}
                    href={selectedHref}
                    title={collapsed ? itemLabel : undefined}
                    className={cn(
                      "nav-item group relative",
                      isActive && "active",
                      collapsed && "justify-center px-0"
                    )}
                  >
                    {/* Active left accent */}
                    {isActive && !collapsed && (
                      <span
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-[16px] rounded-r-full bg-[#0f76ad]"
                      />
                    )}

                    <Icon
                      className={cn(
                        "flex-shrink-0 transition-colors",
                        collapsed ? "w-[17px] h-[17px]" : "w-[14px] h-[14px]",
                        isActive
                          ? "text-[#0f76ad]"
                          : "text-[#9ca3af] group-hover:text-[#4b5563]"
                      )}
                    />

                    {!collapsed && (
                      <span className="truncate text-[12.5px]">{itemLabel}</span>
                    )}

                    {/* Tooltip when collapsed */}
                    {collapsed && (
                      <span className="absolute left-full ml-3 px-2.5 py-1 rounded-md bg-[#111827] border border-[#374151] text-white text-xs whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 z-50 shadow-xl">
                        {itemLabel}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ─── Synthetic data indicator ───────────────────────── */}
      {!collapsed && (
        <div className="mx-2 mb-2 px-3 py-2 rounded-lg border border-[#fde68a] bg-[#fffbeb]">
          <div className="flex items-center gap-2 mb-0.5">
            <Database className="w-3 h-3 text-[#d97706] flex-shrink-0" />
            <span className="text-[#92400e] text-[9.5px] font-semibold tracking-[0.1em] uppercase">
              Synthetic Dataset
            </span>
          </div>
          <p className="text-[#a16207] text-[10px] leading-snug">
            Offline benchmark · not live
          </p>
        </div>
      )}

      {/* ─── Collapse toggle ─────────────────────────────────── */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center w-full h-9 border-t border-[#e4e7ec] text-[#9ca3af] hover:text-[#0f76ad] hover:bg-[#f0f2f5] transition-colors"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed
          ? <PanelLeftOpen className="w-3.5 h-3.5" />
          : <PanelLeftClose className="w-3.5 h-3.5" />
        }
      </button>
    </aside>
  );
}
