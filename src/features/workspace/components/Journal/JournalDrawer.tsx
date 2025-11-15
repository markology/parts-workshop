"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useJournalStore } from "@/features/workspace/state/stores/Journal";
import JournalEditor from "./JournalEditor";
import { useSaveJournalEntry } from "../../state/hooks/useSaveJournalEntry";
import { useAllJournalEntries } from "../../state/hooks/useAllJournalEntries";
import { JournalEntry } from "@/features/workspace/types/Journal";
import { useDebouncedJournalSave } from "../../state/hooks/useDebouncedJournalSave";
import { useFlowNodesContextOptional } from "../../state/FlowNodesContext";
import { useWorkingStore } from "../../state/stores/useWorkingStore";
import {
  ConnectedNodeType,
  ImpressionNode,
  PartNodeData,
  TensionNodeData,
  WorkshopNode,
} from "@/features/workspace/types/Nodes";
import { ImpressionType } from "@/features/workspace/types/Impressions";
import { Brain, Clock, FilePlus2, Heart, History, Layers, Save, Shield, Sparkles, SquareUserRound, User, X } from "lucide-react";
import { NodeBackgroundColors, NodeTextColors } from "../../constants/Nodes";
import { ImpressionList } from "../../constants/Impressions";
import { ImpressionTextType } from "@/features/workspace/types/Impressions";
import { useThemeContext } from "@/state/context/ThemeContext";

const IMPRESSION_NODE_TYPES: ImpressionType[] = [
  "emotion",
  "thought",
  "sensation",
  "behavior",
  "other",
  "default",
];

const extractPlainText = (html: string) => {
  if (!html) return "";

  if (typeof window === "undefined") {
    return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  }

  const temp = document.createElement("div");
  temp.innerHTML = html;
  return (temp.textContent || temp.innerText || "").trim();
};

const deriveTitleFromContent = (html: string, fallback: string) => {
  const text = extractPlainText(html);
  if (!text) return fallback;

  const firstLine =
    text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find((line) => line.length > 0) ?? text;

  return firstLine.slice(0, 80);
};

const formatTimestamp = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  } catch {
    return date.toLocaleString();
  }
};

const capitalize = (value: string) =>
  value.charAt(0).toUpperCase() + value.slice(1);

const toRgba = (hex: string, opacity: number) => {
  const sanitized = hex.replace("#", "");
  const bigint = parseInt(sanitized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

const withAlpha = (hex: string, alpha: number) => {
  const sanitized = hex.replace("#", "");
  if (sanitized.length !== 6) {
    return hex;
  }

  const r = parseInt(sanitized.slice(0, 2), 16);
  const g = parseInt(sanitized.slice(2, 4), 16);
  const b = parseInt(sanitized.slice(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export default function JournalDrawer() {
  useDebouncedJournalSave();
  const { darkMode } = useThemeContext();

  const isOpen = useJournalStore((s) => s.isOpen);
  const closeJournal = useJournalStore((s) => s.closeJournal);
  const journalTarget = useJournalStore((s) => s.journalTarget);
  const journalData = useJournalStore((s) => s.journalData);
  const setJournalData = useJournalStore((s) => s.setJournalData);
  const loadEntry = useJournalStore((s) => s.loadEntry);
  const activeEntryId = useJournalStore((s) => s.activeEntryId);
  const lastSavedJournalData = useJournalStore(
    (s) => s.lastSavedJournalData
  );

  const flowNodesContext = useFlowNodesContextOptional();
  const workingStoreNodes = useWorkingStore((s) => s.nodes);
  // Use context nodes if available, otherwise fall back to working store nodes
  const nodes = flowNodesContext?.nodes ?? workingStoreNodes ?? [];
  const { data: allEntries = [], isLoading: isHistoryLoading } =
    useAllJournalEntries();
  const { mutateAsync: saveJournalEntry, isPending: isSaving } =
    useSaveJournalEntry();

  const [showContext, setShowContext] = useState(true);
  const [showHistory, setShowHistory] = useState(true);
  const hasSidePanels = showContext || showHistory;
  const layoutIsCompact = !hasSidePanels;

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Only auto-hide on very small screens, but allow user to toggle
    if (window.innerWidth < 768) {
      setShowContext(false);
      setShowHistory(false);
    }
  }, []);

  const nodeId =
    journalTarget?.type === "node" ? journalTarget.nodeId : undefined;
  const nodeType =
    journalTarget?.type === "node" ? journalTarget.nodeType : undefined;
  const nodeLabel =
    journalTarget?.type === "node" ? journalTarget.title : "Global Journal";

  const accentColor =
    (nodeType && NodeBackgroundColors[nodeType]) ||
    NodeBackgroundColors.default;

  const targetNode = useMemo<WorkshopNode | null>(() => {
    if (!nodeId) {
      console.log("JournalDrawer: No nodeId provided, skipping search");
      return null;
    }

    console.log("🔍 JournalDrawer: Searching for node", {
      searchingForNodeId: nodeId,
      nodeIdLength: nodeId.length,
      nodeIdFirstChars: nodeId.substring(0, 20),
      totalNodesAvailable: nodes.length,
      hasFlowNodesContext: !!flowNodesContext,
    });

    console.log("📋 JournalDrawer: All available nodes:", nodes.map((n, idx) => ({
      index: idx,
      id: n.id,
      idLength: n.id.length,
      idFirstChars: n.id.substring(0, 20),
      type: n.type,
      label: (n.data as { label?: string })?.label || "no label",
      exactMatch: n.id === nodeId,
    })));

    const found = nodes.find((node) => node.id === nodeId) ?? null;

    if (found) {
      console.log("✅ JournalDrawer: Node FOUND!", {
        id: found.id,
        type: found.type,
        label: (found.data as { label?: string })?.label || "no label",
        data: found.data,
      });
    } else {
      console.warn("❌ JournalDrawer: Node NOT FOUND", {
        searchingForNodeId: nodeId,
        nodesCount: nodes.length,
        hasFlowNodesContext: !!flowNodesContext,
        exactMatchCheck: nodes.some((n) => n.id === nodeId),
        partialMatches: nodes.filter((n) => {
          const searchStart = nodeId.slice(0, 8);
          const nodeStart = n.id.slice(0, 8);
          return n.id.includes(searchStart) || nodeId.includes(nodeStart);
        }).map((n) => ({
          id: n.id,
          type: n.type,
          similarity: "partial",
        })),
        allNodeIds: nodes.map((n) => n.id),
        nodeIdComparison: {
          searching: nodeId,
          available: nodes.map((n) => n.id),
          matches: nodes.filter((n) => n.id === nodeId).map((n) => n.id),
        },
      });
    }

    return found;
  }, [nodeId, nodes, flowNodesContext]);

  // Debug logging
  useEffect(() => {
    if (isOpen && journalTarget?.type === "node") {
      console.log("📖 JournalDrawer: Drawer opened with node target", {
        isOpen,
        journalTarget: {
          type: journalTarget.type,
          nodeId: journalTarget.nodeId,
          nodeType: journalTarget.nodeType,
          title: journalTarget.title,
        },
        nodeSources: {
          hasFlowNodesContext: !!flowNodesContext,
          contextNodesCount: flowNodesContext?.nodes?.length ?? 0,
          workingStoreNodesCount: workingStoreNodes.length,
          finalNodesCount: nodes.length,
        },
        uiState: {
          showContext,
          showHistory,
        },
        searchResult: {
          targetNodeFound: !!targetNode,
          targetNodeId: targetNode?.id,
          targetNodeType: targetNode?.type,
          targetNodeLabel: targetNode ? (targetNode.data as { label?: string })?.label : null,
        },
        allNodesSummary: nodes.map((n) => ({
          id: n.id.substring(0, 20) + "...",
          type: n.type,
          label: (n.data as { label?: string })?.label || "no label",
        })),
      });
    }
  }, [isOpen, journalTarget, flowNodesContext, workingStoreNodes.length, nodes.length, showContext, showHistory, targetNode]);

  const relevantEntries = useMemo(() => {
    if (!journalTarget) return [] as JournalEntry[];

    if (journalTarget.type === "node") {
      return allEntries.filter((entry) => entry.nodeId === nodeId);
    }

    return allEntries.filter((entry) => !entry.nodeId);
  }, [allEntries, journalTarget, nodeId]);

  const activeEntry = useMemo(() => {
    if (!activeEntryId) return null;
    return relevantEntries.find((entry) => entry.id === activeEntryId) ?? null;
  }, [activeEntryId, relevantEntries]);

  const hasUnsavedChanges = journalData !== lastSavedJournalData;

  // Clear journal data when switching to a different node
  const previousNodeIdRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (!isOpen || !journalTarget) {
      previousNodeIdRef.current = nodeId;
      return;
    }
    
    // Only clear if we're switching to a different node
    if (previousNodeIdRef.current !== undefined && previousNodeIdRef.current !== nodeId) {
      setJournalData("");
      loadEntry({ entryId: null, content: "" });
    }
    
    previousNodeIdRef.current = nodeId;
  }, [nodeId, isOpen, journalTarget, setJournalData, loadEntry]);

  useEffect(() => {
    if (!journalTarget) return;
    if (hasUnsavedChanges) return;

    if (relevantEntries.length === 0) {
      if (activeEntryId !== null) {
        loadEntry({ entryId: null, content: "" });
      }
      return;
    }

    const matching = activeEntryId
      ? relevantEntries.find((entry) => entry.id === activeEntryId)
    : null;

    const fallback = matching ?? relevantEntries[0];

    if (!matching) {
      loadEntry({ entryId: fallback.id, content: fallback.content ?? "" });
      return;
    }

    if (
      fallback &&
      fallback.id === matching.id &&
      fallback.content !== undefined &&
      fallback.content !== journalData
    ) {
      loadEntry({ entryId: fallback.id, content: fallback.content });
    }
  }, [
    activeEntryId,
    hasUnsavedChanges,
    journalData,
    journalTarget,
    loadEntry,
    relevantEntries,
  ]);

  const handleSave = useCallback(
    async (options?: { createNewVersion?: boolean }) => {
      if (!journalTarget) return false;

      const textContent = extractPlainText(journalData);
      if (!activeEntryId && textContent.length === 0) {
        return true;
      }

      try {
        const entry = await saveJournalEntry({
          nodeId,
          content: journalData,
          title: deriveTitleFromContent(journalData, nodeLabel),
          entryId:
            options?.createNewVersion || !activeEntryId ? undefined : activeEntryId,
          createNewVersion: options?.createNewVersion || !activeEntryId,
        });

        if (entry) {
          loadEntry({
            entryId: entry.id ?? null,
            content: entry.content ?? "",
          });
        }

        return true;
      } catch (error) {
        console.error("Failed to save journal entry", error);
        alert("We had trouble saving that entry. Please try again.");
        return false;
      }
    },
    [
      activeEntryId,
      journalData,
      journalTarget,
      loadEntry,
      nodeId,
      nodeLabel,
      saveJournalEntry,
    ]
  );

  const handleSaveNewVersion = useCallback(async () => {
    if (!journalTarget) return;
    if (!extractPlainText(journalData)) {
      alert("Write something before saving a snapshot.");
      return;
    }
    await handleSave({ createNewVersion: true });
  }, [handleSave, journalData, journalTarget]);

  const handleStartNewEntry = useCallback(async () => {
    if (hasUnsavedChanges) {
      const shouldSave = window.confirm(
        "Save your current journal before starting a new entry?"
      );
      if (shouldSave) {
        const saved = await handleSave();
        if (!saved) return;
      } else {
        return;
      }
    }
    loadEntry({ entryId: null, content: "" });
  }, [handleSave, hasUnsavedChanges, loadEntry]);

  const handleSelectEntry = useCallback(
    async (entry: JournalEntry) => {
      if (entry.id === activeEntryId) return;

      if (hasUnsavedChanges) {
        const shouldSave = window.confirm(
          "Save your current journal before switching entries? Press Cancel to keep editing."
        );
        if (!shouldSave) return;

        const saved = await handleSave();
        if (!saved) return;
      }

      loadEntry({ entryId: entry.id, content: entry.content ?? "" });
    },
    [activeEntryId, handleSave, hasUnsavedChanges, loadEntry]
  );

  const attemptClose = useCallback(async () => {
    if (hasUnsavedChanges) {
      const shouldSave = window.confirm(
        "Save your current journal before closing?"
      );
      if (shouldSave) {
        const saved = await handleSave();
        if (!saved) return;
    } else {
        return;
      }
    }

    closeJournal();
  }, [closeJournal, handleSave, hasUnsavedChanges]);

  const renderContextPanel = () => {
    console.log("🎨 renderContextPanel called", {
      hasJournalTarget: !!journalTarget,
      hasTargetNode: !!targetNode,
      targetNodeType: targetNode?.type,
      targetNodeLabel: targetNode ? (targetNode.data as { label?: string })?.label : null,
      flowNodesContext: !!flowNodesContext,
      nodesLength: nodes.length,
    });

    if (!journalTarget) {
      console.log("🎨 renderContextPanel: No journalTarget, returning default message");
      return (
        <div className="space-y-3 text-sm text-slate-600">
          <p>This journal entry is not linked to a specific node.</p>
          <p>
            Open a part, impression, or interaction to display its context here.
          </p>
        </div>
      );
    }

    // Check if we have the target node first - if we do, we can render it even without flowNodesContext
    if (!targetNode) {
      console.log("🎨 renderContextPanel: No targetNode found");
      // Only show the "context not available" message if we also don't have any nodes
      if (!flowNodesContext && nodes.length === 0) {
        return (
          <div className="space-y-3 text-sm text-slate-600">
            <p className="font-semibold text-slate-800">Node context is not available.</p>
            <p>The workspace may not be fully loaded yet.</p>
            <p className="text-xs text-slate-500 mt-2">
              Make sure you&apos;re viewing a workspace with nodes.
            </p>
            <div className="mt-3 rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs">
              <p className="font-semibold text-amber-800 mb-1">Debug Info:</p>
              <p className="text-amber-700">flowNodesContext: {flowNodesContext ? "available" : "null"}</p>
              <p className="text-amber-700">nodes.length: {nodes.length}</p>
              <p className="text-amber-700">nodeId: {nodeId || "none"}</p>
            </div>
          </div>
        );
      }
      return (
        <div className="space-y-3 text-sm text-slate-600">
          <p className="font-semibold text-slate-800">We couldn&apos;t find this node in the current workspace.</p>
          <p>It may have been removed or moved to another map.</p>
          {nodeId && (
            <p className="text-xs text-slate-500 mt-2">
              Looking for node: <code className="bg-slate-100 px-1 rounded">{nodeId}</code>
            </p>
          )}
          {nodes.length > 0 && (
            <div className="mt-3 rounded-lg bg-blue-50 border border-blue-200 p-3 text-xs">
              <p className="font-semibold text-blue-800 mb-2">Found {nodes.length} node{nodes.length !== 1 ? "s" : ""} in workspace:</p>
              <ul className="space-y-1 text-blue-700">
                {nodes.slice(0, 5).map((n) => (
                  <li key={n.id}>
                    <code className="bg-blue-100 px-1 rounded">{n.id}</code> ({n.type})
                  </li>
                ))}
                {nodes.length > 5 && <li className="text-blue-600">... and {nodes.length - 5} more</li>}
              </ul>
            </div>
          )}
          {nodes.length === 0 && (
            <div className="mt-3 rounded-lg bg-red-50 border border-red-200 p-3 text-xs">
              <p className="font-semibold text-red-800">No nodes found in workspace</p>
              <p className="text-red-700">The workspace appears to be empty or not loaded.</p>
            </div>
          )}
        </div>
      );
    }

    console.log("🎨 renderContextPanel: Rendering node content", {
      nodeType: targetNode.type,
      nodeId: targetNode.id,
    });

    if (targetNode.type === "part") {
      const data = targetNode.data as PartNodeData;
      console.log("🎨 renderContextPanel: Rendering part node", {
        label: data.label,
        needs: data.needs?.length || 0,
        insights: data.insights?.length || 0,
      });

      // Flatten all impressions and sort by recency (most recent first)
      const impressions = ImpressionList.flatMap((impressionType) => {
        const impressionData = (data[ImpressionTextType[impressionType]] as ImpressionNode[]) || [];
        return impressionData.map((imp) => ({
          ...imp,
          impressionType,
          addedAt: imp.data?.addedAt || imp.data?.createdAt || imp.data?.timestamp,
        }));
      });

      const allImpressions = impressions.sort((a, b) => {
        const dateA = typeof a.addedAt === "string" ? new Date(a.addedAt).getTime() : Number(a.addedAt || 0);
        const dateB = typeof b.addedAt === "string" ? new Date(b.addedAt).getTime() : Number(b.addedAt || 0);
        return dateB - dateA; // Most recent first
      });

      const metadata = [
        data.name && data.name !== data.label
          ? { label: "Also known as", value: data.name }
          : null,
      ].filter(Boolean) as { label: string; value: string | number }[];

      const hasImpressions = ImpressionList.some((impression) => {
        const impressionData =
          (data[ImpressionTextType[impression]] as ImpressionNode[]) || [];
        return impressionData.length > 0;
      });

      return (
        <div className="space-y-6 text-sm text-slate-600">
          <section className="p-0">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-slate-900">
                  {data.label}
                </h3>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  {(() => {
                    const partType = data.partType === "custom" ? data.customPartType : data.partType;
                    const mapping: Record<string, { icon: React.ReactNode; className: string }> = {
                      manager: {
                        icon: <Brain className="w-3.5 h-3.5" />,
                        className: darkMode
                          ? "bg-sky-500/15 border border-sky-500/40 text-sky-100"
                          : "bg-sky-100 border border-sky-200 text-sky-600",
                      },
                      firefighter: {
                        icon: <Shield className="w-3.5 h-3.5" />,
                        className: darkMode
                          ? "bg-rose-500/15 border border-rose-500/40 text-rose-100"
                          : "bg-rose-100 border border-rose-200 text-rose-600",
                      },
                      exile: {
                        icon: <Heart className="w-3.5 h-3.5" />,
                        className: darkMode
                          ? "bg-purple-500/15 border border-purple-500/40 text-purple-100"
                          : "bg-purple-100 border border-purple-200 text-purple-600",
                      },
                    };

                    const pill = partType && mapping[partType] ? mapping[partType] : {
                      icon: <User className="w-3.5 h-3.5" />,
                      className: darkMode
                        ? "bg-slate-800/60 border border-slate-700 text-slate-200"
                        : "bg-slate-100 border border-slate-200 text-slate-600",
                    };

                    return (
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium capitalize ${pill.className}`}
                      >
                        {pill.icon}
                        {partType || "No type set"}
                      </span>
                    );
                  })()}
                  {data.age && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-0.5 font-medium text-slate-500">
                      Age{" "}
                      <span className="font-semibold text-slate-700">
                        {data.age}
                      </span>
                    </span>
                  )}
                  {data.gender && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-0.5 font-medium text-slate-500">
                      Gender{" "}
                      <span className="font-semibold text-slate-700">
                        {data.gender}
                      </span>
                    </span>
                  )}
                  {metadata.map((item) => (
                    <span
                      key={item.label}
                      className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-0.5 font-medium text-slate-500"
                    >
                      {item.label}{" "}
                      <span className="font-semibold text-slate-700">
                        {item.value}
                      </span>
                    </span>
                  ))}
                </div>
              </div>

              {data.image && (
                <div className="relative h-24 w-24 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-sm">
                  <img
                    src={data.image}
                    alt={`${data.label} image`}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
            </div>

            {data.scratchpad?.trim() && (
              <div className="mt-4 rounded-xl bg-slate-50 px-3.5 py-3 text-sm leading-relaxed text-slate-600 shadow-inner">
                {data.scratchpad}
              </div>
            )}
          </section>

          {hasImpressions && (
            <section className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Impressions
              </p>
              <div className="flex flex-wrap gap-2">
                {allImpressions.map((item) => {
                  const impressionType = item.impressionType as ImpressionType;
                  const accentText = NodeTextColors[impressionType];
                  const accent = NodeBackgroundColors[impressionType];
                  const chipBackground = toRgba(accent, darkMode ? 0.45 : 0.24);
                  const chipBorder = toRgba(accent, darkMode ? 0.65 : 0.32);

                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-xl border px-3 py-2"
                      style={{
                        backgroundColor: chipBackground,
                        borderColor: chipBorder,
                        color: darkMode ? "rgba(255,255,255,0.92)" : accentText,
                      }}
                    >
                      <span className="font-medium text-xs break-words">
                        {item.data?.label || "No label"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {data.needs && data.needs.length > 0 && (
            <section className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Key Needs
              </p>
              <ul className="flex flex-wrap gap-2">
                {data.needs
                  .filter(Boolean)
                  .slice(0, 6)
                  .map((need, idx) => (
                    <li
                      key={`${need}-${idx}`}
                      className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
                    >
                      {need}
                    </li>
                  ))}
              </ul>
            </section>
          )}

          {data.insights && data.insights.length > 0 && (
            <section className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Insights
              </p>
              <ul className="flex flex-col gap-1.5">
                {data.insights
                  .filter(Boolean)
                  .slice(0, 4)
                  .map((insight, idx) => (
                    <li
                      key={`${insight}-${idx}`}
                      className="rounded-lg bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm"
                    >
                      {insight}
                    </li>
                  ))}
              </ul>
            </section>
          )}
        </div>
      );
    }

    if (
      targetNode.type === "tension" ||
      targetNode.type === "interaction" ||
      targetNode.type === "relationship"
    ) {
      // Relationship nodes might have TensionNodeData structure
      const data = targetNode.data as TensionNodeData | { connectedNodes?: ConnectedNodeType[]; relationshipType?: string; label?: string; [key: string]: unknown };
      
      console.log("🎨 renderContextPanel: Rendering relationship node", {
        nodeType: targetNode.type,
        dataType: data.type,
        relationshipType: (data as TensionNodeData).relationshipType || "relationship",
        label: data.label || targetNode.data?.label,
        hasConnectedNodes: !!(data as TensionNodeData).connectedNodes,
        connectedNodesType: typeof (data as TensionNodeData).connectedNodes,
        connectedNodesIsArray: Array.isArray((data as TensionNodeData).connectedNodes),
        rawData: data,
        fullTargetNode: targetNode,
      });

      const connectedNodes: ConnectedNodeType[] = Array.isArray(
        (data as TensionNodeData).connectedNodes
      )
        ? ((data as TensionNodeData).connectedNodes as ConnectedNodeType[])
        : [];

      console.log("🎨 renderContextPanel: Connected nodes extracted", {
        connectedNodesCount: connectedNodes.length,
        connectedNodes: connectedNodes.map((cn) => ({
          partId: cn.part?.id,
          partLabel: cn.part?.data?.label,
          tensionDescription: cn.tensionDescription,
        })),
      });

      // Get the actual part nodes from the workspace to ensure we have full data
      const enrichedConnectedNodes = connectedNodes.map(({ part, tensionDescription }) => {
        const actualPartNode = nodes.find((n) => n.id === part.id && n.type === "part");
        return {
          part: actualPartNode || part,
          tensionDescription,
          isFromWorkspace: !!actualPartNode,
        };
      });

      const relationshipType = (data as TensionNodeData).relationshipType || 
                               (targetNode.type === "relationship" ? "relationship" : targetNode.type) ||
                               "interaction";
      const displayLabel = data.label || 
                          (targetNode.data as { label?: string })?.label || 
                          "No summary yet";

      return (
        <div className="space-y-5 text-sm text-slate-600">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">
              {capitalize(relationshipType)}
            </p>
            <h3 className="mt-1 text-lg font-semibold text-slate-900">
              {displayLabel}
            </h3>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
              Parts Involved ({enrichedConnectedNodes.length})
            </p>
            {enrichedConnectedNodes.length === 0 ? (
              <div className="space-y-2">
                <p className="rounded-lg bg-slate-100/80 px-3 py-2 text-sm text-slate-600">
                  No parts linked to this {relationshipType} yet.
                </p>
                <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs">
                  <p className="font-semibold text-amber-800 mb-1">Debug Info:</p>
                  <p className="text-amber-700">connectedNodes extracted: {connectedNodes.length}</p>
                  <p className="text-amber-700">data.connectedNodes type: {typeof (data as TensionNodeData).connectedNodes}</p>
                  <p className="text-amber-700">data.connectedNodes isArray: {Array.isArray((data as TensionNodeData).connectedNodes)}</p>
                  <p className="text-amber-700">nodeType: {targetNode.type}</p>
                  <p className="text-amber-700">data keys: {Object.keys(data).join(", ")}</p>
                </div>
              </div>
            ) : (
              enrichedConnectedNodes.map(({ part, tensionDescription, isFromWorkspace }) => {
                const partData = part.data as PartNodeData | undefined;
                const partLabel = partData?.label || part.data?.label || "Unnamed part";
                
                return (
                  <div
                    key={part.id}
                    className="rounded-xl border border-slate-200/70 bg-white px-3.5 py-3 shadow-sm"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-slate-900">
                        {partLabel}
                      </p>
                      {isFromWorkspace && (
                        <span className="text-xs text-slate-400">✓ Live</span>
                      )}
                    </div>
                    {tensionDescription ? (
                      <p className="mt-1 text-sm text-slate-600 leading-relaxed">
                        {tensionDescription}
                      </p>
                    ) : (
                      <p className="mt-1 text-xs uppercase tracking-wide text-slate-400">
                        No notes yet
                      </p>
                    )}
                    {partData && (
                      <div className="mt-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
                        <p>Part Type: {partData.partType === "custom" ? partData.customPartType || "Custom" : capitalize(partData.partType)}</p>
                        {partData.needs && partData.needs.length > 0 && (
                          <p className="mt-1">Needs: {partData.needs.slice(0, 2).join(", ")}{partData.needs.length > 2 ? "..." : ""}</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      );
    }

    if (
      IMPRESSION_NODE_TYPES.includes(targetNode.type as ImpressionType)
    ) {
      const label = (targetNode.data as { label?: string })?.label;

      return (
        <div className="space-y-4 text-sm text-slate-600">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">
              Impression
            </p>
            <h3 className="mt-2 text-lg font-semibold text-slate-900">
              {capitalize(targetNode.type)}
            </h3>
          </div>
          <div className="rounded-xl border border-slate-200/70 bg-white px-3.5 py-3 text-base leading-relaxed text-slate-800 shadow-sm">
            {label || "No text added to this impression yet."}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-3 text-sm text-slate-600">
        <p>Node context is available for parts, impressions, and tensions.</p>
      </div>
    );
  };

  const renderHistoryPanel = () => {
    if (isHistoryLoading) {
      return (
        <div className="flex h-full items-center justify-center text-sm text-slate-500">
          Loading history…
        </div>
      );
    }

    if (relevantEntries.length === 0) {
      return (
        <div className="space-y-3 text-sm text-slate-600">
          <p>No saved journal entries yet.</p>
          <p>Use the save button to capture your first entry.</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {relevantEntries.map((entry) => {
          const preview = extractPlainText(entry.content);
          const title =
            entry.title?.trim() ||
            deriveTitleFromContent(entry.content, "Untitled entry");
          const isActive = entry.id === activeEntryId;

          return (
            <button
              key={entry.id}
              type="button"
              onClick={() => void handleSelectEntry(entry)}
              className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                isActive
                  ? "border-slate-900 bg-slate-900 text-white shadow-lg"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-md"
              }`}
            >
              <div className="flex items-center justify-between text-xs uppercase tracking-wide">
                <span
                  className={
                    isActive ? "text-slate-200" : "text-slate-500"
                  }
                >
                  {formatTimestamp(entry.updatedAt)}
                </span>
                {isActive && (
                  <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-900">
                    Current
                  </span>
                )}
              </div>
              <h4
                className={`mt-2 text-sm font-semibold ${
                  isActive ? "text-white" : "text-slate-900"
                }`}
              >
                {title}
              </h4>
              <p
                className={`mt-1 text-sm leading-relaxed ${
                  isActive ? "text-slate-200" : "text-slate-600"
                }`}
                style={{
                  display: "-webkit-box",
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {preview || "This entry is currently empty."}
              </p>
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999]">
      <div
        className={`absolute inset-0 bg-slate-900/45 transition-opacity duration-300 ${
          isOpen ? "pointer-events-auto opacity-100" : "opacity-0"
        }`}
        onClick={() => void attemptClose()}
      />

      <aside
        className={`absolute top-0 left-0 h-full w-full pointer-events-auto transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col overflow-hidden bg-gradient-to-br from-white via-slate-50 to-slate-100 shadow-2xl">
          <header className="border-b border-slate-200/80 bg-white/85 px-6 py-5 shadow-sm backdrop-blur">
            <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold text-slate-900">
                  {nodeLabel}
                </h2>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  {nodeType && (
                    <span
                      className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 font-medium text-slate-600"
                      style={{
                        borderColor: withAlpha(
                          accentColor ?? NodeBackgroundColors.default,
                          0.4
                        ),
                      }}
                    >
                      {capitalize(nodeType)}
                    </span>
                  )}
                  <span
                    className={`flex items-center gap-1 font-medium ${
                      hasUnsavedChanges ? "text-amber-600" : "text-emerald-600"
                    }`}
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{
                        backgroundColor: hasUnsavedChanges
                          ? "#f97316"
                          : "#047857",
                      }}
                    />
                    {hasUnsavedChanges ? "Unsaved changes" : "Saved"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    {activeEntry
                      ? `Updated ${formatTimestamp(activeEntry.updatedAt)}`
                      : "Not saved yet"}
                  </span>
                  <span className="flex items-center gap-1">
                    <History size={12} />
                    {relevantEntries.length}{" "}
                    {relevantEntries.length === 1 ? "version" : "versions"}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowContext((prev) => !prev)}
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    showContext
                      ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                      : "border-slate-300 bg-white text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Layers size={14} />
                  Info
                </button>

                <button
                  type="button"
                  onClick={() => setShowHistory((prev) => !prev)}
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    showHistory
                      ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                      : "border-slate-300 bg-white text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <History size={14} />
                  History
                </button>

                <button
                  type="button"
                  onClick={() => void handleStartNewEntry()}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  <FilePlus2 size={14} />
                  New entry
                </button>

                <button
                  type="button"
                  onClick={() => void handleSave()}
                  disabled={!hasUnsavedChanges || isSaving}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                    hasUnsavedChanges && !isSaving
                      ? "bg-blue-600 text-white shadow hover:bg-blue-700"
                      : "bg-slate-200 text-slate-500"
                  } ${isSaving ? "animate-pulse" : ""}`}
                >
                  <Save size={16} />
                  {isSaving ? "Saving…" : "Save"}
                </button>

                <button
                  type="button"
                  onClick={() => void attemptClose()}
                  className="rounded-full border border-transparent p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          </header>

          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="relative flex flex-1 flex-col gap-6 overflow-y-auto px-6 pb-6 pt-6">
              {/* Side panels positioned relative to centered content */}
              {showContext && (
                <>
                  <aside className="hidden lg:absolute lg:flex h-[calc(100%-3rem)] w-72 flex-col overflow-y-auto rounded-2xl border border-slate-200/70 bg-white/85 px-4 py-5 shadow-inner" style={{ left: 'calc((100% - 3rem - 56rem) / 2 - 20rem)', top: '1.5rem' }}>
                    <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: accentColor }}
                      />
                      Info
                    </div>
                    {renderContextPanel()}
                  </aside>

                  <div className="block lg:hidden">
                    <div className="mx-auto max-w-4xl rounded-2xl border border-slate-200/70 bg-white/90 px-4 py-5 shadow-sm">
                      <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: accentColor }}
                        />
                        Info
                      </div>
                      {renderContextPanel()}
                    </div>
                  </div>
                </>
              )}

              {showHistory && (
                <aside className="hidden lg:absolute lg:flex h-[calc(100%-3rem)] w-72 flex-col overflow-y-auto rounded-2xl border border-slate-200/70 bg-white/85 px-4 py-5 shadow-inner" style={{ right: 'calc((100% - 3rem - 56rem) / 2 - 20rem)', top: '1.5rem' }}>
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                      History
                    </p>
                    <button
                      type="button"
                      onClick={() => void handleSaveNewVersion()}
                      disabled={isSaving}
                      title="Save current content as a new version (keeps history)"
                      className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-600 transition hover:bg-slate-100 disabled:opacity-60"
                    >
                      <Sparkles size={14} />
                      Snapshot
                    </button>
                  </div>
                  {renderHistoryPanel()}
                </aside>
              )}

              {/* Main content area - always centered */}
              <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 overflow-hidden">
                <div className="flex-1 overflow-hidden rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-xl">
                  <JournalEditor
                    content={journalData}
                    onContentChange={setJournalData}
                    nodeType={
                      nodeType as
                        | ImpressionType
                        | "part"
                        | "tension"
                        | "interaction"
                        | undefined
                    }
                  />
                </div>

                {showHistory && (
                  <div className="block lg:hidden">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                        History
                      </p>
                      <button
                        type="button"
                        onClick={() => void handleSaveNewVersion()}
                        disabled={isSaving}
                        title="Save current content as a new version (keeps history)"
                        className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:bg-slate-100 disabled:opacity-60"
                      >
                        <Sparkles size={14} />
                        Snapshot
                      </button>
                    </div>
                    <div className="rounded-2xl border border-slate-200/70 bg-white/90 px-4 py-5 shadow-sm">
                      {renderHistoryPanel()}
                    </div>
                  </div>
                )}
              </main>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
