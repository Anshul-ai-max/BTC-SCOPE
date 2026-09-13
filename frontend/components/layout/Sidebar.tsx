"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
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
  ShieldCheck,
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

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

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
          <ShieldCheck className="w-3.5 h-3.5 text-[#0f76ad]" />
        </div>

        {!collapsed && (
          <div className="min-w-0">
            <p className="text-[#111827] font-bold text-[13px] tracking-wide leading-none">
              BTC-SCOPE
            </p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#059669] flex-shrink-0" />
              <span className="text-[#059669] text-[9px] font-semibold tracking-[0.12em]">
                DEMO MODE
              </span>
            </div>
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
                // Match /blockchain or /wallet routes for Wallet Investigation
                const isActive =
                  pathname === href ||
                  (href === "/blockchain" && (pathname.startsWith("/blockchain") || pathname.startsWith("/wallet")));
                return (
                  <Link
                    key={href}
                    href={href}
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
