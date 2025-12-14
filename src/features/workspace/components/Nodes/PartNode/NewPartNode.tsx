"use client";

import React, { useMemo, memo } from "react";
import Image from "next/image";
import { Handle, Position } from "@xyflow/react";
import {
  BookOpen,
  SquareUserRound,
  Trash2,
  User,
  Heart,
  Brain,
  Eye,
  Shield,
  Sparkles,
} from "lucide-react";
import RightClickMenu from "@/components/RightClickMenu";
import { ImpressionList } from "@/features/workspace/constants/Impressions";
import { ImpressionTextType } from "@/features/workspace/types/Impressions";
import { NodeBackgroundColors, NodeTextColors } from "@/features/workspace/constants/Nodes";
import { workspaceDarkPalette } from "@/features/workspace/constants/darkPalette";
import useContextMenu from "@/features/workspace/hooks/useContextMenu";
import { useFlowNodesContext } from "@/features/workspace/state/FlowNodesContext";
import { useJournalStore } from "@/features/workspace/state/stores/Journal";
import { useUIStore } from "@/features/workspace/state/stores/UI";
import { PartNodeData } from "@/features/workspace/types/Nodes";
import { ImpressionNode } from "@/features/workspace/types/Nodes";
import { useThemeContext } from "@/state/context/ThemeContext";

const NewPartNode = ({ data, partId }: { data: PartNodeData; partId: string }) => {
  const {
    deleteEdges,
    deleteNode,
    removePartFromAllTensions,
    nodes,
    edges,
  } = useFlowNodesContext();
  const { setJournalTarget } = useJournalStore();

  const { darkMode } = useThemeContext();
  const palette = workspaceDarkPalette;

  const toRgba = (hex: string, opacity: number) => {
    const sanitized = hex.replace("#", "");
    const bigint = parseInt(sanitized, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  const selectedPartId = useUIStore((s) => s.selectedPartId);
  const setSelectedPartId = useUIStore((s) => s.setSelectedPartId);

  const { handleContextMenu, showContextMenu, nodeRef, menuItems } =
    useContextMenu({
      id: partId,
      menuItems: useMemo(
        () => [
          {
            icon: <Trash2 size={16} />,
            onClick: () => {
              deleteNode(partId);
              removePartFromAllTensions(partId);
              deleteEdges(partId);
            },
          },
        ],
        [deleteNode, removePartFromAllTensions, deleteEdges, partId]
      ),
    });

  // Get relationships
  const relationships = useMemo(() => {
    const connectedEdges = edges.filter(
      (edge) => edge.source === partId || edge.target === partId
    );

    return connectedEdges.map((edge) => {
      const connectedNodeId = edge.source === partId ? edge.target : edge.source;
      const connectedNode = nodes.find((node) => node.id === connectedNodeId);
      
      return {
        id: edge.id,
        nodeId: connectedNodeId,
        nodeType: connectedNode?.type || "unknown",
        nodeLabel: connectedNode?.data?.label || "Unknown",
        relationshipType: edge.data?.relationshipType || "tension",
      };
    });
  }, [edges, nodes, partId]);

  // Get all observations for display, sorted by recency
  const allObservations = useMemo(() => {
    const observations = ImpressionList.flatMap((impressionType) => {
      const impressions = (data[ImpressionTextType[impressionType]] as ImpressionNode[]) || [];
      return impressions.map((imp) => ({
        ...imp,
        impressionType,
        addedAt: imp.data?.addedAt || imp.data?.createdAt || imp.data?.timestamp,
      }));
    });

    return observations.sort((a, b) => {
      const dateA = typeof a.addedAt === "string" ? new Date(a.addedAt).getTime() : Number(a.addedAt || 0);
      const dateB = typeof b.addedAt === "string" ? new Date(b.addedAt).getTime() : Number(b.addedAt || 0);
      return dateB - dateA;
    });
  }, [data]);

  const getPartTypePill = (partType: string | undefined) => {
    if (!partType) {
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium capitalize ${
          darkMode
            ? "text-slate-300"
            : "text-slate-500"
        }`}>
          <User className="w-3.5 h-3.5" />
          No type set
        </span>
      );
    }

    const mapping: Record<string, { icon: React.ReactNode; className: string }> = {
      manager: {
        icon: <Brain className="w-3.5 h-3.5" />,
        className: darkMode
          ? "bg-sky-500/15 text-sky-100"
          : "bg-sky-100 text-sky-600",
      },
      firefighter: {
        icon: <Shield className="w-3.5 h-3.5" />,
        className: darkMode
          ? "bg-rose-500/15 text-rose-100"
          : "bg-rose-100 text-rose-600",
      },
      exile: {
        icon: <Heart className="w-3.5 h-3.5" />,
        className: darkMode
          ? "bg-purple-500/15 text-purple-100"
          : "bg-purple-100 text-purple-600",
      },
    };

    const pill = mapping[partType] || {
      icon: <User className="w-3.5 h-3.5" />,
      className: darkMode
        ? "bg-slate-800/60 text-slate-200"
        : "bg-slate-100 text-slate-600",
    };

    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium capitalize ${pill.className}`}
      >
        {pill.icon}
        {partType}
      </span>
    );
  };

  const observationPreview = allObservations.slice(0, 8);

  const isSelected = selectedPartId === partId;
  const cardBase = darkMode
    ? "border text-slate-100 shadow-[0_24px_60px_rgba(0,0,0,0.65)]"
    : "bg-white/90 border border-slate-200/70 text-slate-900 shadow-[0_26px_60px_rgba(15,23,42,0.14)]";
  const cardStyle = darkMode
    ? {
        background: "#212529",
        borderColor: "rgba(255,255,255,0.06)",
      }
    : undefined;


  return (
    <>
      <div
        onContextMenu={handleContextMenu}
        ref={nodeRef}
        className="node part-node relative"
        style={{ width: 420 }}
      >
        <div
          className={`relative overflow-hidden rounded-[24px] transition-all duration-300 cursor-pointer ${cardBase} ${
            isSelected
              ? "ring-2 ring-sky-400 border-sky-300"
              : ""
          }`}
          style={cardStyle}
          onClick={() => setSelectedPartId(partId)}
        >
          <div className="relative p-6 lg:p-7 space-y-6">
            <div className="flex flex-wrap items-start gap-6">
              <div className="flex-1 space-y-4">
                <div className="space-y-2">
                  <h2 className="text-2xl lg:text-[28px] font-semibold leading-tight">
                    {data.name || data.label || "Untitled"}
                  </h2>
                  <div>{getPartTypePill(data.customPartType || (data.partType as string | undefined))}</div>
                </div>
                <div className="min-h-[48px]">
                  {data.scratchpad ? (
                    <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-300 line-clamp-3">
                      {data.scratchpad}
                    </p>
                  ) : (
                    <p className="text-sm leading-relaxed text-slate-400 dark:text-slate-500 italic">
                      No description added yet.
                    </p>
                  )}
                </div>
              </div>

              <div className="relative h-[110px] w-[110px] sm:h-[120px] sm:w-[120px] rounded-2xl overflow-hidden">
                {data.image ? (
                  <Image src={data.image} alt="Part" fill className="object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gray-50 dark:bg-gray-200">
                    <SquareUserRound size={40} className="text-gray-400 dark:text-gray-500" />
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between pl-3 pr-2">
                <p className={`text-xs uppercase tracking-[0.28em] ${darkMode ? "text-white" : "text-slate-400"}`}>Recent impressions</p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setJournalTarget({
                      type: "node",
                      nodeId: partId,
                      nodeType: "part",
                      title: data.name || data.label,
                    });
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-semibold transition-colors ${
                    darkMode
                      ? "bg-slate-900/60 text-slate-200 hover:bg-slate-900/80"
                      : "bg-white text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <BookOpen size={14} />
                  Journal
                  <Sparkles className="w-3 h-3 text-purple-400" />
                </button>
              </div>

              <div className="relative min-h-[90px] p-3 flex flex-wrap gap-2 items-start content-start overflow-hidden">
                {observationPreview.length > 0 ? (
                  observationPreview.map((obs, index) => {
                    const accent = NodeBackgroundColors[obs.impressionType];
                    const accentText = NodeTextColors[obs.impressionType] || accent;
                    const chipBackground = toRgba(accent, darkMode ? 0.45 : 0.24);
                    const chipBorder = toRgba(accent, darkMode ? 0.65 : 0.32);
                    return (
                      <span
                        key={`${obs.impressionType}-${index}`}
                        className="inline-flex items-center rounded-xl border px-3 py-[6px] text-xs font-medium leading-none whitespace-nowrap shadow-sm"
                        style={{
                          backgroundColor: chipBackground,
                          borderColor: chipBorder,
                          color: darkMode ? "rgba(255,255,255,0.92)" : accentText,
                        }}
                      >
                        {obs.data?.label || obs.id}
                      </span>
                    );
                  })
                ) : (
                  <span className="text-xs text-slate-400 dark:text-slate-500">
                    No observations yet
                  </span>
                )}
                {allObservations.length > observationPreview.length && (
                  <span 
                    className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap"
                    style={{
                      backgroundColor: darkMode ? "#3c424a" : "rgba(226, 232, 240, 0.8)",
                      color: darkMode ? "rgba(255, 255, 255, 0.8)" : "#475569",
                    }}
                  >
                    +{allObservations.length - observationPreview.length} more
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

        {/* Handles for edges */}
        <Handle className="part-handle" type="source" position={Position.Top} id="top" />
        <Handle className="part-handle" type="source" position={Position.Bottom} id="bottom" />
        <Handle className="part-handle" type="source" position={Position.Left} id="left" />
        <Handle className="part-handle" type="source" position={Position.Right} id="right" />
      {showContextMenu && <RightClickMenu items={menuItems} />}
    </>
  );
};

// Memoize to prevent re-renders when other nodes move
// Only re-renders when this node's data changes or related edges change
export default memo(NewPartNode, (prevProps, nextProps) => {
  // Only re-render if the node's data actually changed
  return prevProps.data === nextProps.data && prevProps.partId === nextProps.partId;
});
