"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

// ─── AnimatedNumber ────────────────────────────────────────────────────────────
interface AnimatedNumberProps {
  value: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export function AnimatedNumber({
  value,
  duration = 1000,
  decimals = 0,
  prefix = "",
  suffix = "",
  className,
}: AnimatedNumberProps) {
  const [display, setDisplay] = useState(0);
  const startRef = useRef<number | null>(null);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const startValue = display;
    startRef.current = null;

    const animate = (timestamp: number) => {
      if (!startRef.current) startRef.current = timestamp;
      const elapsed = timestamp - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setDisplay(startValue + (value - startValue) * eased);
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <span className={className}>
      {prefix}{display.toFixed(decimals)}{suffix}
    </span>
  );
}

// ─── RiskBadge ─────────────────────────────────────────────────────────────────
interface RiskBadgeProps {
  band: string;
  className?: string;
}

export function RiskBadge({ band, className }: RiskBadgeProps) {
  const cls =
    band === "HIGH" || band === "CRITICAL"
      ? "risk-badge-high"
      : band === "MEDIUM"
      ? "risk-badge-medium"
      : "risk-badge-low";

  return <span className={cn(cls, className)}>{band}</span>;
}

// ─── RiskBar ───────────────────────────────────────────────────────────────────
interface RiskBarProps {
  score: number;
  height?: number;
  showLabel?: boolean;
  className?: string;
  dark?: boolean; // use dark-workspace colours
}

export function RiskBar({ score, height = 6, showLabel = false, className, dark = false }: RiskBarProps) {
  const color =
    score >= 75 ? "#dc2626" : score >= 50 ? "#d97706" : "#059669";

  const trackBg = dark ? "rgba(255,255,255,0.06)" : "#e4e7ec";

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        className="flex-1 rounded-full overflow-hidden"
        style={{ height, background: trackBg }}
      >
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${score}%`,
            background: `linear-gradient(90deg, ${color}88, ${color})`,
          }}
        />
      </div>
      {showLabel && (
        <span className="mono text-xs font-semibold flex-shrink-0" style={{ color, minWidth: 36 }}>
          {score.toFixed(1)}
        </span>
      )}
    </div>
  );
}

// ─── EvidenceBar ───────────────────────────────────────────────────────────────
interface EvidenceBarProps {
  score: number;
  color: string;
  label?: string;
  className?: string;
}

export function EvidenceBar({ score, color, label, className }: EvidenceBarProps) {
  return (
    <div className={cn("space-y-1", className)}>
      {label && (
        <div className="flex items-center justify-between">
          <span className="text-[#7d8fa3] text-xs">{label}</span>
          <span className="mono text-xs font-bold" style={{ color }}>{score}</span>
        </div>
      )}
      <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{
            width: `${score}%`,
            background: `linear-gradient(90deg, ${color}55, ${color})`,
          }}
        />
      </div>
    </div>
  );
}

// ─── MetricCard ────────────────────────────────────────────────────────────────
interface MetricCardProps {
  label: string;
  value: number | string;
  sub?: string;
  color?: string;
  icon?: React.ReactNode;
  animated?: boolean;
  decimals?: number;
}

export function MetricCard({ label, value, sub, color = "#0f76ad", icon, animated = false, decimals = 0 }: MetricCardProps) {
  return (
    <div className="card card-hover p-4 relative overflow-hidden">
      {/* Accent top border */}
      <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-[10px]" style={{ background: color }} />
      {icon && (
        <div className="mb-3">{icon}</div>
      )}
      <p className="mono text-[20px] font-bold leading-none" style={{ color }}>
        {animated && typeof value === "number"
          ? <AnimatedNumber value={value} decimals={decimals} duration={900} />
          : value
        }
      </p>
      <p className="text-[#4b5563] text-[12px] mt-1 font-medium leading-snug">{label}</p>
      {sub && <p className="text-[#9ca3af] text-[10px] mt-0.5 leading-snug">{sub}</p>}
    </div>
  );
}

// ─── Skeleton ──────────────────────────────────────────────────────────────────
interface SkeletonProps {
  className?: string;
  lines?: number;
}

export function Skeleton({ className, lines = 1 }: SkeletonProps) {
  if (lines === 1) {
    return <div className={cn("skeleton h-4 w-full", className)} />;
  }
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn("skeleton h-4", i === lines - 1 ? "w-3/4" : "w-full")}
        />
      ))}
    </div>
  );
}

// ─── CopyButton ────────────────────────────────────────────────────────────────
interface CopyButtonProps {
  text: string;
  className?: string;
}

export function CopyButton({ text, className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className={cn(
        "px-2 py-0.5 rounded text-xs transition-all",
        copied
          ? "bg-green-50 border border-green-300 text-green-700"
          : "bg-[#f7f8fa] border border-[#d1d5db] text-[#6b7280] hover:text-[#0f76ad] hover:border-[#0f76ad]/40",
        className
      )}
    >
      {copied ? "Copied ✓" : "Copy"}
    </button>
  );
}

// ─── SectionHeader ─────────────────────────────────────────────────────────────
interface SectionHeaderProps {
  label: string;
  children?: React.ReactNode;
  className?: string;
}

export function SectionHeader({ label, children, className }: SectionHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between mb-4", className)}>
      <span className="section-label">{label}</span>
      {children}
    </div>
  );
}

// ─── StatusDot ─────────────────────────────────────────────────────────────────
interface StatusDotProps {
  status: "online" | "warning" | "error" | "idle";
  label?: string;
  className?: string;
}

export function StatusDot({ status, label, className }: StatusDotProps) {
  const colors = {
    online:  "#059669",
    warning: "#d97706",
    error:   "#dc2626",
    idle:    "#9ca3af",
  };
  const color = colors[status];

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <span
        className="inline-block rounded-full"
        style={{ width: 7, height: 7, background: color }}
      />
      {label && <span className="text-xs text-[#6b7280]">{label}</span>}
    </div>
  );
}

// ─── EmptyState ────────────────────────────────────────────────────────────────
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {icon && <div className="mb-4 text-[#d1d5db]">{icon}</div>}
      <p className="text-[#6b7280] font-medium text-sm mb-1">{title}</p>
      {description && <p className="text-[#9ca3af] text-xs mb-4">{description}</p>}
      {action}
    </div>
  );
}

// ─── Tooltip ───────────────────────────────────────────────────────────────────
interface TooltipProps {
  content: string;
  children: React.ReactNode;
}

export function Tooltip({ content, children }: TooltipProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded text-xs bg-[#111827] text-white whitespace-nowrap z-50 pointer-events-none shadow-xl">
          {content}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#111827]" />
        </div>
      )}
    </div>
  );
}

// ─── DatasetBadge ──────────────────────────────────────────────────────────────
export function DatasetBadge({ label = "Synthetic Research Dataset" }: { label?: string }) {
  return (
    <span className="dataset-badge">
      <span className="w-1.5 h-1.5 rounded-full bg-[#d97706] inline-block" />
      {label}
    </span>
  );
}
