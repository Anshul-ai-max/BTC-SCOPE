"use client";

import { useState, useCallback, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  NodeTypes,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";
import { Search, ShieldAlert, X, Info } from "lucide-react";
import { RiskBadge, RiskBar } from "@/components/ui";
import { NETWORK_NODES, NETWORK_EDGES } from "@/lib/mock-data/network";
import { WALLETS } from "@/lib/mock-data/wallets";
import { getRiskColor, getRiskBgColor, getRiskBorderColor, getRiskGlow } from "@/lib/utils";
import type { NetworkNode } from "@/types/btc-scope";
import { cn } from "@/lib/utils";

// ─── Custom wallet node (dark investigation workspace) ──────────────────────
function WalletNode({ data }: { data: NetworkNode & { selected?: boolean } }) {
  const color = getRiskColor(data.riskBand);
  const size = data.connections
    ? Math.max(36, Math.min(60, 36 + Math.log(data.connections) * 5))
    : 40;

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: getRiskBgColor(data.riskBand),
        border: `2px solid ${color}`,
        boxShadow: data.selected
          ? `0 0 20px ${color}, 0 0 40px ${color}40`
          : `0 0 8px ${color}40`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        position: "relative",
        transition: "all 0.2s ease",
        animation: data.selected && data.riskBand === "HIGH"
          ? "nodePulse 2s ease-in-out infinite"
          : "none",
      }}
    >
      <span
        style={{
          color,
          fontSize: Math.max(9, size / 5),
          fontWeight: 700,
          fontFamily: "monospace",
          textAlign: "center",
          lineHeight: 1.1,
          padding: "0 3px",
          wordBreak: "break-all",
        }}
      >
        {data.label.replace("W0", "W")}
      </span>
      {/* Risk dot */}
      <span
        style={{
          position: "absolute",
          top: -3,
          right: -3,
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: color,
          border: "1.5px solid #0c1220",
        }}
      />
    </div>
  );
}

const nodeTypes: NodeTypes = { wallet: WalletNode };

// ─── Layout positions ────────────────────────────────────────────────────────
const NODE_POSITIONS: Record<string, { x: number; y: number }> = {
  W012109: { x: 400, y: 300 },
  W017332: { x: 220, y: 160 },
  W008834: { x: 620, y: 180 },
  W002281: { x: 80,  y: 280 },
  W003214: { x: 640, y: 400 },
  W019872: { x: 200, y: 440 },
  W015678: { x: 140, y: 430 },
  W006677: { x: 420, y: 520 },
  W014509: { x: 730, y: 280 },
  W011445: { x: 540, y: 580 },
  W007123: { x: 300, y: 590 },
  W021001: { x: 350, y: 690 },
};

function buildNodes(selectedId: string | null): Node[] {
  return NETWORK_NODES.map((n) => ({
    id: n.id,
    type: "wallet",
    position: NODE_POSITIONS[n.id] ?? { x: Math.random() * 600, y: Math.random() * 500 },
    data: { ...n, selected: n.id === selectedId },
    selected: n.id === selectedId,
  }));
}

function buildEdges(): import("reactflow").Edge[] {
  return NETWORK_EDGES.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    type: "default",
    animated: false,
    style: { stroke: "rgba(56,189,248,0.65)", strokeWidth: 2 },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: "rgba(56,189,248,0.80)",
      width: 12,
      height: 12,
    },
    label: e.amount ? `₿${e.amount?.toFixed(2)}` : undefined,
    labelStyle: { fill: "#3f5168", fontSize: 9, fontFamily: "monospace" },
    labelBgStyle: { fill: "#0c1220", fillOpacity: 0.8 },
  }));
}

function NetworkContent() {
  const params = useSearchParams();
  const focusId = params.get("focus");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(focusId ?? "W012109");
  const [searchQuery, setSearchQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState<string>("ALL");

  const [nodes, setNodes, onNodesChange] = useNodesState(buildNodes(selectedNodeId));
  const [edges, , onEdgesChange] = useEdgesState(buildEdges());

  const selectedNode = NETWORK_NODES.find((n) => n.id === selectedNodeId);
  const selectedWallet = WALLETS.find((w) => w.id === selectedNodeId);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setSelectedNodeId(node.id);
      setNodes((nds) =>
        nds.map((n) => ({ ...n, data: { ...n.data, selected: n.id === node.id } }))
      );
    },
    [setNodes]
  );

  const filteredNodes = useMemo(() => {
    return NETWORK_NODES.filter((n) => {
      if (riskFilter !== "ALL" && n.riskBand !== riskFilter) return false;
      if (searchQuery && !n.id.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [riskFilter, searchQuery]);

  return (
    <div className="inv-workspace flex h-full overflow-hidden bg-[#0c1220]">

      {/* ─── Left entity list panel ──────────────────── */}
      <div className="w-60 flex-shrink-0 border-r border-[#1e2d3d] flex flex-col bg-[#111827] overflow-hidden">
        <div className="p-4 border-b border-[#1e2d3d]">
          <div className="flex items-center gap-2 mb-3">
            <ShieldAlert className="w-4 h-4 text-[#38bdf8]" />
            <span className="section-label">ENTITY GRAPH</span>
          </div>
          <div className="relative mb-3">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#3f5168]" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search wallet…"
              className="cyber-input pl-8 w-full text-xs"
            />
          </div>
          {/* Risk filter */}
          <div className="flex gap-1">
            {(["ALL", "HIGH", "MEDIUM", "LOW"] as const).map((band) => (
              <button
                key={band}
                onClick={() => setRiskFilter(band)}
                className={cn(
                  "flex-1 py-1 rounded text-[9px] font-semibold transition-all",
                  riskFilter === band
                    ? band === "HIGH"
                      ? "bg-[#dc2626]/20 text-[#dc2626]"
                      : band === "MEDIUM"
                      ? "bg-[#d97706]/15 text-[#d97706]"
                      : band === "LOW"
                      ? "bg-[#059669]/12 text-[#059669]"
                      : "bg-[#1e2d3d] text-[#e8edf5]"
                    : "text-[#3f5168] hover:text-[#7d8fa3]"
                )}
              >
                {band}
              </button>
            ))}
          </div>
        </div>

        {/* Node list */}
        <div className="flex-1 overflow-y-auto py-2">
          {filteredNodes.map((node) => {
            const color = getRiskColor(node.riskBand);
            const isSelected = node.id === selectedNodeId;
            return (
              <button
                key={node.id}
                onClick={() => {
                  setSelectedNodeId(node.id);
                  setNodes((nds) =>
                    nds.map((n) => ({ ...n, data: { ...n.data, selected: n.id === node.id } }))
                  );
                }}
                className={cn(
                  "w-full flex items-center gap-2.5 px-4 py-2.5 text-left transition-all",
                  isSelected
                    ? "bg-[#38bdf8]/08 border-r-2 border-r-[#38bdf8]"
                    : "hover:bg-[#172032]"
                )}
              >
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: color, boxShadow: isSelected ? `0 0 6px ${color}` : "none" }}
                />
                <span className="mono text-xs text-[#e8edf5] flex-1">{node.id}</span>
                <span className="mono text-xs font-bold" style={{ color }}>{node.riskScore?.toFixed(0)}</span>
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="p-4 border-t border-[#1e2d3d]">
          <p className="section-label mb-2">LEGEND</p>
          <div className="space-y-1.5">
            {[
              { label: "High Risk",   color: "#dc2626" },
              { label: "Medium Risk", color: "#d97706" },
              { label: "Low Risk",    color: "#059669" },
            ].map(({ label, color }) => (
              <div key={label} className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: color }} />
                <span className="text-[#7d8fa3] text-[10px]">{label}</span>
              </div>
            ))}
            <div className="flex items-center gap-2">
              <span className="w-5 h-px flex-shrink-0" style={{ background: "rgba(56,189,248,0.5)" }} />
              <span className="text-[#7d8fa3] text-[10px]">Transaction edge →</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Graph canvas ────────────────────────────── */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.3}
          maxZoom={2.5}
          attributionPosition="bottom-right"
        >
          <Background variant={BackgroundVariant.Dots} gap={32} size={1} color="rgba(56,189,248,0.07)" />
          <Controls className="!bg-[#111827] !border-[#1e2d3d] !rounded-lg" />
          <MiniMap
            nodeColor={(node) => getRiskColor((node.data as NetworkNode).riskBand)}
            maskColor="rgba(12,18,32,0.85)"
            style={{ background: "#111827", border: "1px solid #1e2d3d", borderRadius: 8 }}
          />
        </ReactFlow>

        {/* Graph overlay */}
        <div className="absolute top-4 left-4 inv-panel-sm px-3 py-2 flex items-center gap-3">
          <span className="w-1.5 h-1.5 rounded-full bg-[#059669] flex-shrink-0" />
          <span className="text-[#7d8fa3] text-xs">GRAPH ENGINE</span>
          <span className="text-[#3f5168] text-xs">·</span>
          <span className="text-[#7d8fa3] text-xs mono">{NETWORK_NODES.length} nodes</span>
          <span className="text-[#3f5168] text-xs">·</span>
          <span className="text-[#7d8fa3] text-xs mono">{NETWORK_EDGES.length} edges</span>
        </div>

        {/* Disclaimer */}
        <div className="absolute bottom-14 left-4 flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#111827]/80 border border-[#1e2d3d]">
          <Info className="w-2.5 h-2.5 text-[#d97706] flex-shrink-0" />
          <span className="text-[#7d8fa3] text-[9px]">Synthetic research dataset · not live</span>
        </div>
      </div>

      {/* ─── Selected entity panel ───────────────────── */}
      {selectedNode && (
        <div className="w-68 flex-shrink-0 border-l border-[#1e2d3d] flex flex-col bg-[#111827] overflow-y-auto" style={{ width: 272 }}>
          <div className="p-5 border-b border-[#1e2d3d]">
            <div className="flex items-center justify-between mb-3">
              <span className="section-label">ENTITY INTELLIGENCE</span>
              <button onClick={() => setSelectedNodeId(null)} className="text-[#3f5168] hover:text-[#e8edf5]">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Risk card */}
            <div
              className="p-4 rounded-xl text-center mb-4"
              style={{
                background: getRiskBgColor(selectedNode.riskBand),
                border: `1px solid ${getRiskBorderColor(selectedNode.riskBand)}`,
                boxShadow: getRiskGlow(selectedNode.riskBand),
              }}
            >
              <p className="mono text-[#e8edf5] text-xl font-bold">{selectedNode.id}</p>
              <p className="mono text-3xl font-black mt-1" style={{ color: getRiskColor(selectedNode.riskBand) }}>
                {selectedNode.riskScore?.toFixed(2)}
              </p>
              <RiskBadge band={selectedNode.riskBand ?? "LOW"} className="mt-1" />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded-lg bg-[#0c1220] border border-[#1e2d3d] text-center">
                <p className="mono text-[#38bdf8] text-base font-bold">{selectedNode.connections}</p>
                <p className="text-[10px] text-[#3f5168]">CONNECTIONS</p>
              </div>
              <div className="p-2.5 rounded-lg bg-[#0c1220] border border-[#1e2d3d] text-center">
                <p className="mono text-[#818cf8] text-base font-bold">{selectedWallet?.totalTransactions ?? "—"}</p>
                <p className="text-[10px] text-[#3f5168]">TRANSACTIONS</p>
              </div>
            </div>
          </div>

          {selectedWallet && (
            <div className="p-5 space-y-4">
              <div>
                <span className="section-label">RISK SCORE</span>
                <RiskBar score={selectedWallet.riskScore} height={6} showLabel dark className="mt-2" />
              </div>

              <div>
                <span className="section-label">FLAG REASONS</span>
                <div className="space-y-1 mt-2">
                  {selectedWallet.flagReasons.slice(0, 4).map((r, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="mt-1.5 w-1 h-1 rounded-full flex-shrink-0" style={{ background: getRiskColor(selectedWallet.riskBand) }} />
                      <p className="text-[#7d8fa3] text-xs">{r}</p>
                    </div>
                  ))}
                  {selectedWallet.flagReasons.length === 0 && (
                    <p className="text-[#3f5168] text-xs italic">No flags detected</p>
                  )}
                </div>
              </div>

              <div>
                <span className="section-label">ANOMALY SCORES</span>
                <div className="space-y-2 mt-2">
                  {[
                    { label: "Isolation Forest", value: selectedWallet.anomalyScores.isolationForest * 100, color: "#f87171" },
                    { label: "Statistical",       value: selectedWallet.anomalyScores.statisticalAnomaly,    color: "#fbbf24" },
                  ].map(({ label, value, color }) => (
                    <div key={label}>
                      <div className="flex justify-between mb-0.5">
                        <span className="text-[11px] text-[#7d8fa3]">{label}</span>
                        <span className="mono text-[11px] font-semibold" style={{ color }}>{value.toFixed(1)}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-[#1e2d3d] overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${value}%`, background: color }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-[#1e2d3d]">
                <Link href={`/wallet/${selectedNode.id}`} className="btn-inv w-full justify-center text-xs">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Full Investigation
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function NetworkPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-full bg-[#0c1220]">
        <div className="text-[#7d8fa3] text-sm">Loading entity graph…</div>
      </div>
    }>
      <NetworkContent />
    </Suspense>
  );
}
