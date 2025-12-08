"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useJournalStore } from "@/features/workspace/state/stores/Journal";
import JournalEditor from "./JournalEditor";
import TextThreadEditor from "./TextThreadEditor";
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
import { Brain, Book, Clock, FilePlus2, Heart, History, Layers, MessagesSquare, Save, Shield, SquareUserRound, User, X, Trash2 } from "lucide-react";
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

// Check if content is a text thread (JSON array)
const isTextThread = (content: string): boolean => {
  if (!content) return false;
  try {
    const parsed = JSON.parse(content);
    return Array.isArray(parsed);
  } catch {
    return false;
  }
};

// Extract preview from text thread messages
const extractTextThreadPreview = (content: string, partNodes: Array<{ id: string; label: string }> = []): string => {
  if (!content) return "";
  try {
    const messages = JSON.parse(content);
    if (!Array.isArray(messages) || messages.length === 0) {
      return "Empty conversation";
    }
    // Get the last few messages for preview
    const recentMessages = messages.slice(-3);
    return recentMessages
      .map((msg: any) => {
        let speaker = "Unknown";
        if (msg.speakerId === "self") {
          speaker = "Self";
        } else if (msg.speakerId === "unknown" || msg.speakerId === "?") {
          speaker = "Unknown";
        } else {
          // Look up part label by ID
          const part = partNodes.find(p => p.id === msg.speakerId);
          speaker = part?.label || "Part";
        }
        const text = msg.text || "";
        return `${speaker}: ${text}`;
      })
      .join(" • ");
  } catch {
    return "";
  }
};

// Extract title from text thread
const extractTextThreadTitle = (content: string): string => {
  if (!content) return "Text Thread";
  try {
    const messages = JSON.parse(content);
    if (!Array.isArray(messages) || messages.length === 0) {
      return "Empty Text Thread";
    }
    const firstMessage = messages[0];
    const text = firstMessage?.text || "";
    if (text) {
      return text.slice(0, 50) + (text.length > 50 ? "..." : "");
    }
    return "Text Thread";
  } catch {
    return "Text Thread";
  }
};

const extractPlainText = (content: string, partNodes: Array<{ id: string; label: string }> = []) => {
  if (!content) return "";

  // Check if it's a text thread first
  if (isTextThread(content)) {
    return extractTextThreadPreview(content, partNodes);
  }

  // Otherwise treat as HTML and extract text
  let text = "";
  if (typeof window === "undefined") {
    text = content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  } else {
    const temp = document.createElement("div");
    temp.innerHTML = content;
    text = (temp.textContent || temp.innerText || "").trim();
  }
  
  // Return a snippet (first 150 characters)
  if (text.length > 150) {
    return text.slice(0, 150) + "...";
  }
  return text;
};

const deriveTitleFromContent = (content: string, fallback: string) => {
  // Check if it's a text thread
  if (isTextThread(content)) {
    return extractTextThreadTitle(content);
  }

  // For HTML content, extract plain text
  let text = "";
  if (typeof window === "undefined") {
    text = content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  } else {
    const temp = document.createElement("div");
    temp.innerHTML = content;
    text = (temp.textContent || temp.innerText || "").trim();
  }
  
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
  const queryClient = useQueryClient();

  const isOpen = useJournalStore((s) => s.isOpen);
  const closeJournal = useJournalStore((s) => s.closeJournal);
  const journalTarget = useJournalStore((s) => s.journalTarget);
  const journalData = useJournalStore((s) => s.journalData);
  const setJournalData = useJournalStore((s) => s.setJournalData);
  const loadEntry = useJournalStore((s) => s.loadEntry);
  const activeEntryId = useJournalStore((s) => s.activeEntryId);
  const selectedSpeakers = useJournalStore((s) => s.selectedSpeakers);
  const setSelectedSpeakers = useJournalStore((s) => s.setSelectedSpeakers);
  // Ensure selectedSpeakers is always an array
  const speakersArray = Array.isArray(selectedSpeakers) ? selectedSpeakers : [];
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

  const [leftPanelTab, setLeftPanelTab] = useState<"info" | "history">("info");
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [journalMode, setJournalMode] = useState<"normal" | "textThread" | null>(null);
  const [showModeSelection, setShowModeSelection] = useState(false);
  const [isStartingNewEntry, setIsStartingNewEntry] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Only auto-hide on very small screens, but allow user to toggle
    if (window.innerWidth < 768) {
      setShowLeftPanel(false);
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
          leftPanelTab,
          showLeftPanel,
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
  }, [isOpen, journalTarget, flowNodesContext, workingStoreNodes.length, nodes.length, leftPanelTab, showLeftPanel, targetNode]);

  const relevantEntries = useMemo(() => {
    if (!journalTarget) return [] as JournalEntry[];

    if (journalTarget.type === "node") {
      return allEntries.filter((entry) => entry.nodeId === nodeId);
    }

    return allEntries.filter((entry) => !entry.nodeId);
  }, [allEntries, journalTarget, nodeId]);

  // Get all part nodes
  const allPartNodes = useMemo(() => {
    return nodes
      .filter((node) => node.type === "part")
      .map((node) => ({
        id: node.id,
        label: (node.data as PartNodeData)?.label || "Unnamed Part",
      }));
  }, [nodes]);

  // Get relevant parts for the current journal entry
  const partNodes = useMemo(() => {
    if (!targetNode) {
      // Global journal - show all parts
      return allPartNodes;
    }

    if (targetNode.type === "part") {
      // Part journal - show only that part
      const partData = targetNode.data as PartNodeData;
      return [{
        id: targetNode.id,
        label: partData?.label || "Unnamed Part",
      }];
    }

    if (targetNode.type === "tension" || targetNode.type === "interaction" || targetNode.type === "relationship") {
      // Tension/Interaction journal - show only parts in connectedNodes
      const data = targetNode.data as TensionNodeData | { connectedNodes?: ConnectedNodeType[]; [key: string]: unknown };
      const connectedNodes: ConnectedNodeType[] = Array.isArray(data.connectedNodes)
        ? data.connectedNodes
        : [];
      
      // Get part IDs from connectedNodes
      const relevantPartIds = new Set(
        connectedNodes
          .map((cn) => cn.part?.id)
          .filter((id): id is string => !!id)
      );

      // Return only the parts that are in connectedNodes
      return allPartNodes.filter((part) => relevantPartIds.has(part.id));
    }

    // For other node types (impressions, etc.), show all parts
    return allPartNodes;
  }, [targetNode, allPartNodes]);

  const activeEntry = useMemo(() => {
    if (!activeEntryId) return null;
    return relevantEntries.find((entry) => entry.id === activeEntryId) ?? null;
  }, [activeEntryId, relevantEntries]);

  const hasUnsavedChanges = journalData !== lastSavedJournalData;

  // Detect mode from content (JSON array = textThread, otherwise normal)
  const detectModeFromContent = useCallback((content: string | null | undefined): "normal" | "textThread" => {
    if (!content) return "normal";
    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        return "textThread";
      }
    } catch {
      // Not JSON, assume normal journal
    }
    return "normal";
  }, []);

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
      loadEntry({ entryId: null, content: "", speakers: [] });
      setJournalMode(null); // Reset mode when switching nodes
    }
    
    previousNodeIdRef.current = nodeId;
  }, [nodeId, isOpen, journalTarget, setJournalData, loadEntry]);

  // Show mode selection when opening journal with no specific entry
  useEffect(() => {
    if (!isOpen || !journalTarget) return;
    if (activeEntryId !== null) return; // Already have a specific entry loaded
    if (isStartingNewEntry) return; // Don't change if user is starting a new entry
    if (hasUnsavedChanges) return; // Don't change if there are unsaved changes
    
    // If no mode is set and no entry is loaded, show mode selection
    if (journalMode === null && activeEntryId === null) {
      setShowModeSelection(true);
    }
  }, [isOpen, journalTarget, activeEntryId, journalMode, isStartingNewEntry, hasUnsavedChanges]);

  const handleSave = useCallback(
    async (options?: { createNewVersion?: boolean }) => {
      if (!journalTarget) return false;

      const textContent = extractPlainText(journalData);
      if (!activeEntryId && textContent.length === 0) {
        return true;
      }

      try {
        console.log("💾 Saving journal entry with speakers:", speakersArray);
        // Only derive title if there's actual content
        const textContent = extractPlainText(journalData);
        const hasContent = textContent && textContent.trim().length > 0;
        const title = hasContent ? deriveTitleFromContent(journalData, "") : "";
        
        const entry = await saveJournalEntry({
          nodeId,
          content: journalData,
          title: title || undefined, // Don't save empty title
          entryId:
            options?.createNewVersion || !activeEntryId ? undefined : activeEntryId,
          createNewVersion: options?.createNewVersion || !activeEntryId,
          speakers: speakersArray,
        });
        
        if (!entry || !entry.id) {
          console.error("Save returned invalid entry:", entry);
          alert("We had trouble saving that entry. The server response was invalid.");
          return false;
        }
        
        // Reset the new entry flag when saving (entry now has an ID)
        setIsStartingNewEntry(false);
        
        console.log("✅ Saved entry:", entry);

        // Determine mode from entry content
        let mode: "normal" | "textThread" = "normal";
        try {
          const contentToParse = entry.content || journalData || "";
          if (contentToParse) {
            const parsed = JSON.parse(contentToParse);
            if (Array.isArray(parsed)) {
              mode = "textThread";
            }
          }
        } catch {
          // Not JSON, keep as normal
        }
        setJournalMode(mode);
        loadEntry({
          entryId: entry.id,
          content: entry.content ?? journalData,
          speakers: Array.isArray(entry.speakers) ? entry.speakers : speakersArray,
        });

        return true;
      } catch (error) {
        console.error("Failed to save journal entry", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error("Error details:", { errorMessage, error });
        alert(`We had trouble saving that entry: ${errorMessage}`);
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
      speakersArray,
    ]
  );


  const handleStartNewEntry = useCallback(() => {
    // Allow starting new entry freely - don't block
    // Reset mode and show mode selection modal
    setIsStartingNewEntry(true);
    setJournalMode(null);
    setShowModeSelection(true);
    loadEntry({ entryId: null, content: "", speakers: [] });
    // Flag will be reset when mode is selected in handleModeSelect
  }, [loadEntry]);

  const handleModeSelect = useCallback((mode: "normal" | "textThread") => {
    setJournalMode(mode);
    setShowModeSelection(false);
    loadEntry({ entryId: null, content: mode === "textThread" ? "[]" : "", speakers: [] });
    // Keep isStartingNewEntry true until user actually starts typing or saves
    // This prevents auto-load from running
  }, [loadEntry]);

  // Listen for mode setting from external sources (like PartDetailPanel)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleSetMode = (e: Event) => {
      const customEvent = e as CustomEvent<{ mode: "normal" | "textThread" }>;
      if (customEvent.detail && customEvent.detail.mode) {
        setJournalMode(customEvent.detail.mode);
        setShowModeSelection(false);
      }
    };
    
    window.addEventListener('journal-set-mode', handleSetMode);
    return () => {
      window.removeEventListener('journal-set-mode', handleSetMode);
    };
  }, []);

  const handleSelectEntry = useCallback(
    (entry: JournalEntry) => {
      console.log("📖 Selecting entry:", entry.id, entry.title);
      // Always load the entry, even if it's the same one (allows re-opening)
      setIsStartingNewEntry(false); // Reset flag when selecting an existing entry
      const content = entry.content ?? "";
      const detectedMode = detectModeFromContent(content);
      console.log("📖 Detected mode:", detectedMode, "Content length:", content.length);
      setJournalMode(detectedMode);
      setShowModeSelection(false); // Hide mode selection when loading an entry
      loadEntry({ entryId: entry.id, content, speakers: Array.isArray(entry.speakers) ? entry.speakers : [] });
      console.log("📖 Entry loaded, activeEntryId should be:", entry.id);
    },
    [loadEntry, detectModeFromContent]
  );

  const handleDeleteEntry = useCallback(
    async (entryId: string) => {
      if (!journalTarget) return;
      
      const confirmed = window.confirm("Are you sure you want to delete this journal entry?");
      if (!confirmed) return;
      
      try {
        const url = nodeId 
          ? `/api/journal/node/${nodeId}?entryId=${entryId}`
          : `/api/journal/global?entryId=${entryId}`;
        
        const response = await fetch(url, {
          method: "DELETE",
        });
        
        if (response.ok || response.status === 204) {
          // Invalidate the journal entries query to refresh the list
          await queryClient.invalidateQueries({ queryKey: ["journal", "all"] });
          if (nodeId) {
            await queryClient.invalidateQueries({ queryKey: ["journal", "node", nodeId] });
          }
          
          // If we deleted the active entry, wait for refetch then load the most recent remaining entry or clear
          if (entryId === activeEntryId) {
            // Refetch and wait for the data to update
            await queryClient.refetchQueries({ queryKey: ["journal", "all"] });
            
            // Get the updated entries from cache
            const updatedEntries = queryClient.getQueryData<JournalEntry[]>(["journal", "all"]) ?? [];
            const remainingEntries = updatedEntries.filter(e => 
              nodeId 
                ? (e.nodeId === nodeId || (!e.nodeId && !nodeId))
                : !e.nodeId
            );
            
            if (remainingEntries.length > 0) {
              const latestEntry = remainingEntries[0];
              const content = latestEntry.content ?? "";
              const detectedMode = detectModeFromContent(content);
              setJournalMode(detectedMode);
              loadEntry({ 
                entryId: latestEntry.id, 
                content, 
                speakers: Array.isArray(latestEntry.speakers) ? latestEntry.speakers : [] 
              });
            } else {
              // No entries left, show mode selection
              setJournalMode(null);
              setShowModeSelection(true);
              loadEntry({ entryId: null, content: "", speakers: [] });
            }
          }
        } else {
          alert("Failed to delete journal entry. Please try again.");
        }
      } catch (error) {
        console.error("Failed to delete journal entry:", error);
        alert("Failed to delete journal entry. Please try again.");
      }
    },
    [journalTarget, nodeId, activeEntryId, relevantEntries, loadEntry, detectModeFromContent, queryClient]
  );

  const attemptClose = useCallback(async () => {
    // Only prompt for save when closing, don't block - always allow closing
    if (hasUnsavedChanges) {
      const shouldSave = window.confirm(
        "You have unsaved changes. Save before closing?"
      );
      if (shouldSave) {
        await handleSave();
        // Continue closing even if save fails
      }
      // If user clicks Cancel, still close (don't block)
    }

    setJournalMode(null);
    setShowModeSelection(false);
    closeJournal();
  }, [closeJournal, handleSave, hasUnsavedChanges]);

  // Single active speaker (like text thread)
  const [activeSpeaker, setActiveSpeaker] = useState<string | null>(null);
  
  const toggleSpeaker = useCallback((speakerId: string) => {
    console.log("🎤 toggleSpeaker called with:", speakerId);
    // Toggle: if already active, deselect; otherwise, set as active
    if (activeSpeaker === speakerId) {
      setActiveSpeaker(null);
      setSelectedSpeakers([]);
    } else {
      setActiveSpeaker(speakerId);
      setSelectedSpeakers([speakerId]); // Keep as array for compatibility but only one item
    }
  }, [activeSpeaker, setSelectedSpeakers]);

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

                    const pill = partType && mapping[partType] ? mapping[partType] : {
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
                        {partType || "No type set"}
                      </span>
                    );
                  })()}
                  {data.age && data.age.toLowerCase() !== "unknown" && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-0.5 font-medium text-slate-500">
                      Age{" "}
                      <span className="font-semibold text-slate-700">
                        {data.age}
                      </span>
                    </span>
                  )}
                  {data.gender && data.gender.toLowerCase() !== "unknown" && (
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

          <section className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Impressions
            </p>
            {hasImpressions ? (
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
            ) : (
              <div className={`rounded-xl border px-3 py-2 ${darkMode ? "border-slate-700/50 bg-slate-800/30" : "border-slate-200/50 bg-slate-50/50"}`}>
                <span className={`text-xs ${darkMode ? "text-slate-400" : "text-slate-400"}`}>
                  No impressions
                </span>
              </div>
            )}
          </section>

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
        <div className="space-y-3 text-sm text-slate-600">
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
                
                const partType = partData?.partType === "custom" ? partData.customPartType : partData?.partType;
                const partTypeMapping: Record<string, { icon: React.ReactNode; className: string }> = {
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

                const partTypePill = partType && partTypeMapping[partType] ? partTypeMapping[partType] : {
                  icon: <User className="w-3.5 h-3.5" />,
                  className: darkMode
                    ? "bg-slate-800/60 text-slate-200"
                    : "bg-slate-100 text-slate-600",
                };

                return (
                  <div
                    key={part.id}
                    className="rounded-xl border border-slate-200/70 bg-white px-3.5 py-3 shadow-sm"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-slate-900">
                        {partLabel}
                      </p>
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
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium capitalize ${partTypePill.className}`}
                        >
                          {partTypePill.icon}
                          {partType || "No type set"}
                        </span>
                        {partData.needs && partData.needs.length > 0 && (
                          <span className="text-xs text-slate-500">
                            Needs: {partData.needs.slice(0, 2).join(", ")}{partData.needs.length > 2 ? "..." : ""}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
        </div>
      );
    }

    if (
      IMPRESSION_NODE_TYPES.includes(targetNode.type as ImpressionType)
    ) {
      const label = (targetNode.data as { label?: string })?.label;

      return (
        <div className="space-y-3 text-sm text-slate-600">
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

    return (
      <div className="space-y-3">
        {/* History List */}
        {relevantEntries.length === 0 ? (
          <div className="space-y-3 text-sm text-slate-600 py-4">
            <p>No saved journal entries yet.</p>
            <p className="text-xs text-slate-500">
              Click "New Entry" in the header to start, then save your first entry.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {relevantEntries.map((entry) => {
              const preview = extractPlainText(entry.content, partNodes);
              const isActive = entry.id === activeEntryId;
              const entryIsTextThread = isTextThread(entry.content || "");
              
              // Calculate word and character counts
              const wordCount = entryIsTextThread ? 
                (() => {
                  try {
                    const parsed = JSON.parse(entry.content || "[]");
                    if (Array.isArray(parsed)) {
                      return parsed.reduce((acc: number, msg: any) => {
                        return acc + (msg.text || "").split(/\s+/).filter((w: string) => w.length > 0).length;
                      }, 0);
                    }
                  } catch {}
                  return 0;
                })() :
                (entry.content || "").split(/\s+/).filter(w => w.length > 0).length;
              const charCount = entry.content?.length || 0;

              return (
                <div
                  key={entry.id}
                  className={`w-full rounded-xl border transition ${
                    isActive
                      ? darkMode
                        ? "border-slate-700 bg-slate-800 shadow-lg"
                        : "border-slate-900 bg-slate-900 text-white shadow-lg"
                      : darkMode
                        ? "border-slate-700 bg-slate-800/50 hover:border-slate-600 hover:shadow-md"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-md"
                  } p-5 shadow-sm hover:shadow-md transition-shadow`}
                >
                  {/* Header with dates and actions */}
                  <div className="flex items-start justify-between mb-3 gap-4">
                    <div className="flex-1 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs">
                        <Clock className={`w-3.5 h-3.5 flex-shrink-0 ${
                          isActive 
                            ? darkMode ? "text-slate-300" : "text-slate-200"
                            : darkMode ? "text-slate-400" : "text-slate-500"
                        }`} />
                        <span className={`${
                          isActive 
                            ? darkMode ? "text-slate-300" : "text-slate-200"
                            : darkMode ? "text-slate-400" : "text-slate-500"
                        }`}>
                          {new Date(entry.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} {new Date(entry.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      
                      {/* Entry type */}
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium ${
                          entryIsTextThread
                            ? isActive
                              ? darkMode
                                ? "bg-purple-900/60 text-purple-200 border border-purple-700/70"
                                : "bg-purple-200/30 text-purple-100 border border-purple-300/50"
                              : darkMode
                                ? "bg-purple-900/40 text-purple-200 border border-purple-700/50"
                                : "bg-purple-50 text-purple-700 border border-purple-200"
                            : isActive
                              ? darkMode
                                ? "bg-blue-900/60 text-blue-200 border border-blue-700/70"
                                : "bg-blue-200/30 text-blue-100 border border-blue-300/50"
                              : darkMode
                                ? "bg-blue-900/40 text-blue-200 border border-blue-700/50"
                                : "bg-blue-50 text-blue-700 border border-blue-200"
                        }`}>
                          {entryIsTextThread ? (
                            <>
                              <MessagesSquare className="w-3 h-3" />
                              Text Thread
                            </>
                          ) : (
                            <>
                              <Book className="w-3 h-3" />
                              Journal
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isActive && (
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
                          darkMode 
                            ? "bg-slate-700 text-slate-200"
                            : "bg-white text-slate-900"
                        }`}>
                          Current
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Preview content */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleSelectEntry(entry);
                    }}
                    className="w-full text-left"
                  >
                    <p
                      className={`text-sm leading-relaxed mb-2 ${
                        isActive 
                          ? darkMode ? "text-slate-200" : "text-slate-200"
                          : darkMode ? "text-slate-300" : "text-slate-600"
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
                  
                  {/* Word and character count with delete button */}
                  <div className="pt-2 border-t border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between">
                    <span className={`text-[10px] ${
                      isActive 
                        ? darkMode ? "text-slate-400" : "text-slate-300"
                        : darkMode ? "text-slate-500" : "text-slate-400"
                    }`}>
                      {wordCount} words • {charCount.toLocaleString()} chars
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleDeleteEntry(entry.id);
                      }}
                      className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium transition ${
                        isActive
                          ? darkMode
                            ? "text-slate-400 hover:text-red-400 hover:bg-red-900/20"
                            : "text-slate-300 hover:text-red-300 hover:bg-red-900/20"
                          : darkMode
                            ? "text-slate-400 hover:text-red-400 hover:bg-red-900/20"
                            : "text-slate-500 hover:text-red-600 hover:bg-red-50"
                      }`}
                      title="Delete entry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
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
          <header className="border-b border-slate-200/80 bg-white/85 px-4 py-3 shadow-sm backdrop-blur">
            <div className="flex items-center justify-between gap-3 max-w-4xl mx-auto">
              <h2 className="text-lg font-semibold text-slate-900 truncate flex-1 min-w-0">
                {nodeLabel}
              </h2>
              
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setShowLeftPanel((prev) => !prev)}
                  className={`rounded-full p-1.5 transition flex-shrink-0 ${
                    showLeftPanel
                      ? "bg-slate-900 text-white"
                      : "text-slate-500 hover:bg-slate-100"
                  }`}
                  title="Toggle sidebar"
                >
                  <Layers size={16} />
                </button>

                <button
                  type="button"
                  onClick={() => void handleStartNewEntry()}
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition flex-shrink-0 bg-slate-100 text-slate-700 hover:bg-slate-200"
                  title="Start a new journal entry"
                >
                  <FilePlus2 size={14} />
                  New Entry
                </button>

                <button
                  type="button"
                  onClick={() => void handleSave()}
                  disabled={!hasUnsavedChanges || isSaving}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition flex-shrink-0 ${
                    hasUnsavedChanges && !isSaving
                      ? "bg-blue-600 text-white shadow hover:bg-blue-700"
                      : "bg-slate-200 text-slate-500"
                  } ${isSaving ? "animate-pulse" : ""}`}
                >
                  <Save size={14} />
                  {isSaving ? "Saving…" : "Save"}
                </button>

                <button
                  type="button"
                  onClick={() => void attemptClose()}
                  className="rounded-full p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 flex-shrink-0"
                  title="Close"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          </header>

          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="relative flex flex-1 flex-col gap-6 overflow-y-auto px-6 pb-6 pt-6">
              {/* Left panel with tabs */}
              {showLeftPanel && (
                <>
                  <aside className="hidden lg:absolute lg:flex h-[calc(100%-3rem)] w-72 flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white/85 shadow-inner" style={{ left: '1.5rem', top: '1.5rem' }}>
                    {/* Tab buttons */}
                    <div className="flex border-b border-slate-200/70 bg-slate-50/50">
                      <button
                        type="button"
                        onClick={() => setLeftPanelTab("info")}
                        className={`flex-1 px-4 py-3 text-xs font-semibold uppercase tracking-[0.28em] transition ${
                          leftPanelTab === "info"
                            ? "border-b-2 border-slate-900 bg-white text-slate-900"
                            : "text-slate-500 hover:text-slate-700 hover:bg-slate-100/50"
                        }`}
                      >
                        <div className="flex items-center justify-center gap-2">
                          <Layers size={14} />
                          Info
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setLeftPanelTab("history")}
                        className={`flex-1 px-4 py-3 text-xs font-semibold uppercase tracking-[0.28em] transition ${
                          leftPanelTab === "history"
                            ? "border-b-2 border-slate-900 bg-white text-slate-900"
                            : "text-slate-500 hover:text-slate-700 hover:bg-slate-100/50"
                        }`}
                      >
                        <div className="flex items-center justify-center gap-2">
                          <History size={14} />
                          History
                        </div>
                      </button>
                    </div>
                    {/* Tab content */}
                    <div className="flex-1 overflow-y-auto px-4 py-5">
                      {leftPanelTab === "info" ? (
                        renderContextPanel()
                      ) : (
                        <div>
                          {renderHistoryPanel()}
                        </div>
                      )}
                    </div>
                  </aside>

                  <div className="block lg:hidden">
                    <div className="mx-auto max-w-4xl rounded-2xl border border-slate-200/70 bg-white/90 shadow-sm">
                      {/* Tab buttons for mobile */}
                      <div className="flex border-b border-slate-200/70 bg-slate-50/50">
                        <button
                          type="button"
                          onClick={() => setLeftPanelTab("info")}
                          className={`flex-1 px-4 py-3 text-xs font-semibold uppercase tracking-[0.28em] transition ${
                            leftPanelTab === "info"
                              ? "border-b-2 border-slate-900 bg-white text-slate-900"
                              : "text-slate-500 hover:text-slate-700 hover:bg-slate-100/50"
                          }`}
                        >
                          <div className="flex items-center justify-center gap-2">
                            <Layers size={14} />
                            Info
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => setLeftPanelTab("history")}
                          className={`flex-1 px-4 py-3 text-xs font-semibold uppercase tracking-[0.28em] transition ${
                            leftPanelTab === "history"
                              ? "border-b-2 border-slate-900 bg-white text-slate-900"
                              : "text-slate-500 hover:text-slate-700 hover:bg-slate-100/50"
                          }`}
                        >
                          <div className="flex items-center justify-center gap-2">
                            <History size={14} />
                            History
                          </div>
                        </button>
                      </div>
                      {/* Tab content for mobile */}
                      <div className="px-4 py-5">
                        {leftPanelTab === "info" ? (
                          renderContextPanel()
                        ) : (
                          <div>
                            {renderHistoryPanel()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Main content area - expands to fill space */}
              <main className={`flex flex-1 flex-col gap-6 overflow-hidden ${showLeftPanel ? 'lg:ml-[19.5rem] lg:mr-6' : 'items-center'}`}>
                <div className={`flex-1 overflow-hidden rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-xl w-full ${showLeftPanel ? '' : journalMode === 'textThread' ? 'max-w-[600px]' : 'max-w-4xl'}`}>
                  {/* Mode Selection Modal */}
                  {(showModeSelection || (journalMode === null && activeEntryId === null)) ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="max-w-2xl w-full p-8">
                        <div className="text-center mb-8">
                          <h3 className="text-2xl font-bold text-slate-900 mb-2">
                            Choose Journal Type
                          </h3>
                          <p className="text-slate-600">
                            Select how you'd like to record this journal entry
                          </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <button
                            type="button"
                            onClick={() => handleModeSelect("normal")}
                            className="group relative p-6 rounded-2xl border-2 border-slate-200 hover:border-blue-500 bg-white hover:bg-blue-50/50 transition-all text-left"
                          >
                            <div className="flex items-start gap-4">
                              <div className="p-3 rounded-xl bg-blue-100 group-hover:bg-blue-200 transition">
                                <Book className="w-6 h-6 text-blue-600" />
                              </div>
                              <div className="flex-1">
                                <h4 className="text-lg font-semibold text-slate-900 mb-1">
                                  Journal
                                </h4>
                                <p className="text-sm text-slate-600">
                                  Traditional rich text editor with inline speaker notation. Perfect for structured journaling and notes.
                                </p>
                              </div>
                            </div>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleModeSelect("textThread")}
                            className="group relative p-6 rounded-2xl border-2 border-slate-200 hover:border-purple-500 bg-white hover:bg-purple-50/50 transition-all text-left"
                          >
                            <div className="flex items-start gap-4">
                              <div className="p-3 rounded-xl bg-purple-100 group-hover:bg-purple-200 transition">
                                <MessagesSquare className="w-6 h-6 text-purple-600" />
                              </div>
                              <div className="flex-1">
                                <h4 className="text-lg font-semibold text-slate-900 mb-1">
                                  Text Thread
                                </h4>
                                <p className="text-sm text-slate-600">
                                  Chat-style conversation interface. Great for IFS parts dialogues and back-and-forth exchanges.
                                </p>
                              </div>
                            </div>
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : journalMode === "textThread" ? (
                    <TextThreadEditor
                      content={journalData}
                      onContentChange={setJournalData}
                      partNodes={partNodes}
                      allPartNodes={allPartNodes}
                      nodeId={nodeId}
                      nodeType={nodeType}
                    />
                  ) : (
                    <JournalEditor
                      key={activeEntryId || "new-entry"}
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
                      selectedSpeakers={speakersArray}
                      activeSpeaker={activeSpeaker}
                      onToggleSpeaker={(id) => {
                        console.log("📞 onToggleSpeaker prop called with:", id);
                        toggleSpeaker(id);
                      }}
                      partNodes={partNodes}
                      allPartNodes={allPartNodes}
                      nodeId={nodeId}
                    />
                  )}
                </div>
              </main>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
