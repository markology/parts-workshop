"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useJournalStore } from "@/features/workspace/state/stores/Journal";
import JournalEditor from "./JournalEditor";
import TextThreadEditor from "./TextThreadEditor";
import { useSaveJournalEntry } from "../../state/hooks/useSaveJournalEntry";
import { useAllJournalEntries } from "../../state/hooks/useAllJournalEntries";
import { JournalEntry } from "@/features/workspace/types/Journal";
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
import {
  Brain,
  Book,
  Clock,
  FilePlus2,
  Heart,
  History,
  Layers,
  MessagesSquare,
  Plus,
  Save,
  Shield,
  SquareUserRound,
  User,
  X,
  Trash2,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { NodeBackgroundColors, NodeTextColors } from "../../constants/Nodes";
import { ImpressionList } from "../../constants/Impressions";
import { ImpressionTextType } from "@/features/workspace/types/Impressions";
import { useTheme } from "@/features/workspace/hooks/useTheme";
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
const extractTextThreadPreview = (
  content: string,
  partNodes: Array<{ id: string; label: string }> = []
): string => {
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
          const part = partNodes.find((p) => p.id === msg.speakerId);
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

const extractPlainText = (
  content: string,
  partNodes: Array<{ id: string; label: string }> = []
) => {
  if (!content) return "";

  // Check if it's a text thread first
  if (isTextThread(content)) {
    return extractTextThreadPreview(content, partNodes);
  }

  // Otherwise treat as HTML and extract text
  let text = "";
  if (typeof window === "undefined") {
    text = content
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
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
    text = content
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
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

// const formatTimestamp = (iso: string) => {
//   const date = new Date(iso);
//   if (Number.isNaN(date.getTime())) return "";
//   try {
//     return new Intl.DateTimeFormat(undefined, {
//       dateStyle: "medium",
//       timeStyle: "short",
//     }).format(date);
//   } catch {
//     return date.toLocaleString();
//   }
// };

// const capitalize = (value: string) =>
//   value.charAt(0).toUpperCase() + value.slice(1);

// const toRgba = (hex: string, opacity: number) => {
//   const sanitized = hex.replace("#", "");
//   const bigint = parseInt(sanitized, 16);
//   const r = (bigint >> 16) & 255;
//   const g = (bigint >> 8) & 255;
//   const b = bigint & 255;
//   return `rgba(${r}, ${g}, ${b}, ${opacity})`;
// };

// const withAlpha = (hex: string, alpha: number) => {
//   const sanitized = hex.replace("#", "");
//   if (sanitized.length !== 6) {
//     return hex;
//   }

//   const r = parseInt(sanitized.slice(0, 2), 16);
//   const g = parseInt(sanitized.slice(2, 4), 16);
//   const b = parseInt(sanitized.slice(4, 6), 16);

//   return `rgba(${r}, ${g}, ${b}, ${alpha})`;
// };

export default function JournalDrawer() {
  const theme = useTheme();
  const { activeTheme, setActiveTheme } = useThemeContext();
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
  const lastSavedJournalData = useJournalStore((s) => s.lastSavedJournalData);

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
  const [journalMode, setJournalMode] = useState<
    "normal" | "textThread" | null
  >(null);
  const [showModeSelection, setShowModeSelection] = useState(false);
  const [isStartingNewEntry, setIsStartingNewEntry] = useState(false);
  const [distractionFree, setDistractionFree] = useState(false);

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

    const found = nodes.find((node) => node.id === nodeId) ?? null;

    return found;
  }, [nodeId, nodes, flowNodesContext]);

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
      return [
        {
          id: targetNode.id,
          label: partData?.label || "Unnamed Part",
        },
      ];
    }

    if (
      targetNode.type === "tension" ||
      targetNode.type === "interaction" ||
      targetNode.type === "relationship"
    ) {
      // Tension/Interaction journal - show only parts in connectedNodes
      const data = targetNode.data as
        | TensionNodeData
        | { connectedNodes?: ConnectedNodeType[]; [key: string]: unknown };
      const connectedNodes: ConnectedNodeType[] = Array.isArray(
        data.connectedNodes
      )
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

  // const activeEntry = useMemo(() => {
  //   if (!activeEntryId) return null;
  //   return relevantEntries.find((entry) => entry.id === activeEntryId) ?? null;
  // }, [activeEntryId, relevantEntries]);

  const hasUnsavedChanges = journalData !== lastSavedJournalData;

  // Check if there's actual content to save
  const hasContentToSave = useMemo(() => {
    if (!hasUnsavedChanges) return false;
    const textContent = extractPlainText(journalData);
    return textContent && textContent.trim().length > 0;
  }, [journalData, hasUnsavedChanges]);

  // Don't allow saving if it's a new entry with no content
  const canSave = useMemo(() => {
    if (!hasUnsavedChanges) return false;
    // If it's a new entry (never been saved), require content
    if (!activeEntryId) {
      return hasContentToSave;
    }
    // If it's an existing entry, allow saving even if empty (to clear it)
    return true;
  }, [hasUnsavedChanges, activeEntryId, hasContentToSave]);

  // Detect mode from content (JSON array = textThread, otherwise normal)
  const detectModeFromContent = useCallback(
    (content: string | null | undefined): "normal" | "textThread" => {
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
    },
    []
  );

  // Clear journal data when switching to a different node
  const previousNodeIdRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (!isOpen || !journalTarget) {
      previousNodeIdRef.current = nodeId;
      return;
    }

    // Only clear if we're switching to a different node
    if (
      previousNodeIdRef.current !== undefined &&
      previousNodeIdRef.current !== nodeId
    ) {
      setJournalData("");
      // For impressions, default to only "self" in speakers
      const defaultSpeakers = isImpressionJournal ? ["self"] : [];
      loadEntry({ entryId: null, content: "", speakers: defaultSpeakers });
      setJournalMode(null); // Reset mode when switching nodes
    }

    previousNodeIdRef.current = nodeId;
  }, [nodeId, isOpen, journalTarget, setJournalData, loadEntry]);

  // Check if current journal target is an impression
  const isImpressionJournal = useMemo(() => {
    return (
      nodeType && IMPRESSION_NODE_TYPES.includes(nodeType as ImpressionType)
    );
  }, [nodeType]);

  // Reset isStartingNewEntry when an entry is loaded
  useEffect(() => {
    if (activeEntryId !== null) {
      setIsStartingNewEntry(false);
    }
  }, [activeEntryId]);

  // Reset active speaker and formatting when entry changes
  useEffect(() => {
    // Clear active speaker and selected speakers whenever activeEntryId changes
    setActiveSpeaker(null);
    setSelectedSpeakers([]);
  }, [activeEntryId, setSelectedSpeakers]);

  // Show mode selection when opening journal with no specific entry
  useEffect(() => {
    if (!isOpen || !journalTarget) return;
    if (activeEntryId !== null) return; // Already have a specific entry loaded
    if (isStartingNewEntry) return; // Don't change if user is starting a new entry
    if (hasUnsavedChanges) return; // Don't change if there are unsaved changes

    // For impressions, automatically set to normal mode and skip mode selection
    if (isImpressionJournal) {
      if (journalMode !== "normal") {
        setJournalMode("normal");
      }
      setShowModeSelection(false);
      return;
    }

    // If no mode is set and no entry is loaded, show mode selection
    if (journalMode === null && activeEntryId === null) {
      setShowModeSelection(true);
    }
  }, [
    isOpen,
    journalTarget,
    activeEntryId,
    journalMode,
    isStartingNewEntry,
    hasUnsavedChanges,
    isImpressionJournal,
  ]);

  const handleSave = useCallback(
    async (options?: { createNewVersion?: boolean }) => {
      if (!journalTarget) return false;

      const textContent = extractPlainText(journalData);
      const hasContent = textContent && textContent.trim().length > 0;

      // Don't allow saving if there's no content and it's a new entry (never been saved)
      if (!activeEntryId && !hasContent) {
        return false; // Don't save empty new entries
      }

      // If it's an existing entry but now empty, allow saving to clear it
      // (This handles the case where user deletes all content from an existing entry)

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
            options?.createNewVersion || !activeEntryId
              ? undefined
              : activeEntryId,
          createNewVersion: options?.createNewVersion || !activeEntryId,
          speakers: speakersArray,
        });

        if (!entry || !entry.id) {
          console.error("Save returned invalid entry:", entry);
          alert(
            "We had trouble saving that entry. The server response was invalid."
          );
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
        // Force normal mode for impressions
        if (isImpressionJournal) {
          mode = "normal";
        }
        setJournalMode(mode);
        loadEntry({
          entryId: entry.id,
          content: entry.content ?? journalData,
          speakers: Array.isArray(entry.speakers)
            ? entry.speakers
            : speakersArray,
        });

        return true;
      } catch (error) {
        console.error("Failed to save journal entry", error);
        const errorMessage =
          error instanceof Error ? error.message : String(error);
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
    // For impressions, default to only "self" in speakers
    const defaultSpeakers = isImpressionJournal ? ["self"] : [];
    loadEntry({ entryId: null, content: "", speakers: defaultSpeakers });
    // Flag will be reset when mode is selected in handleModeSelect
  }, [loadEntry, isImpressionJournal]);

  const handleModeSelect = useCallback(
    (mode: "normal" | "textThread") => {
      // Prevent text thread mode for impressions
      if (isImpressionJournal && mode === "textThread") {
        return;
      }
      setJournalMode(mode);
      setShowModeSelection(false);
      // For impressions, default to only "self" in speakers
      const defaultSpeakers = isImpressionJournal ? ["self"] : [];
      loadEntry({
        entryId: null,
        content: mode === "textThread" ? "[]" : "",
        speakers: defaultSpeakers,
      });
      // Keep isStartingNewEntry true until user actually starts typing or saves
      // This prevents auto-load from running
    },
    [loadEntry, isImpressionJournal]
  );

  // Listen for mode setting from external sources (like PartDetailPanel)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleSetMode = (e: Event) => {
      const customEvent = e as CustomEvent<{ mode: "normal" | "textThread" }>;
      if (customEvent.detail && customEvent.detail.mode) {
        // Prevent text thread mode for impressions
        const mode =
          isImpressionJournal && customEvent.detail.mode === "textThread"
            ? "normal"
            : customEvent.detail.mode;
        setJournalMode(mode);
        setShowModeSelection(false);
      }
    };

    window.addEventListener("journal-set-mode", handleSetMode);
    return () => {
      window.removeEventListener("journal-set-mode", handleSetMode);
    };
  }, [isImpressionJournal]);

  const handleSelectEntry = useCallback(
    (entry: JournalEntry) => {
      // Always load the entry, even if it's the same one (allows re-opening)
      setIsStartingNewEntry(false); // Reset flag when selecting an existing entry
      const content = entry.content ?? "";
      let detectedMode = detectModeFromContent(content);
      // Force normal mode for impressions, even if content is a text thread
      if (isImpressionJournal) {
        detectedMode = "normal";
      }
      console.log(
        "📖 Detected mode:",
        detectedMode,
        "Content length:",
        content.length
      );
      setJournalMode(detectedMode);
      setShowModeSelection(false); // Hide mode selection when loading an entry
      loadEntry({
        entryId: entry.id,
        content,
        speakers: Array.isArray(entry.speakers) ? entry.speakers : [],
      });
    },
    [loadEntry, detectModeFromContent, isImpressionJournal]
  );

  const handleDeleteEntry = useCallback(
    async (entryId: string) => {
      if (!journalTarget) return;

      const confirmed = window.confirm(
        "Are you sure you want to delete this journal entry?"
      );
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
            await queryClient.invalidateQueries({
              queryKey: ["journal", "node", nodeId],
            });
          }

          // If we deleted the active entry, wait for refetch then load the most recent remaining entry or clear
          if (entryId === activeEntryId) {
            // Refetch and wait for the data to update
            await queryClient.refetchQueries({ queryKey: ["journal", "all"] });

            // Get the updated entries from cache
            const updatedEntries =
              queryClient.getQueryData<JournalEntry[]>(["journal", "all"]) ??
              [];
            const remainingEntries = updatedEntries.filter((e) =>
              nodeId ? e.nodeId === nodeId || (!e.nodeId && !nodeId) : !e.nodeId
            );

            if (remainingEntries.length > 0) {
              const latestEntry = remainingEntries[0];
              const content = latestEntry.content ?? "";
              const detectedMode = detectModeFromContent(content);
              setJournalMode(detectedMode);
              loadEntry({
                entryId: latestEntry.id,
                content,
                speakers: Array.isArray(latestEntry.speakers)
                  ? latestEntry.speakers
                  : [],
              });
            } else {
              // No entries left, show mode selection
              setJournalMode(null);
              setShowModeSelection(true);
              // For impressions, default to only "self" in speakers
              const defaultSpeakers = isImpressionJournal ? ["self"] : [];
              loadEntry({
                entryId: null,
                content: "",
                speakers: defaultSpeakers,
              });
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
    [
      journalTarget,
      nodeId,
      activeEntryId,
      relevantEntries,
      loadEntry,
      detectModeFromContent,
      queryClient,
    ]
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

  const toggleSpeaker = useCallback(
    (speakerId: string) => {
      // Toggle: if already active, deselect; otherwise, set as active
      if (activeSpeaker === speakerId) {
        setActiveSpeaker(null);
        setSelectedSpeakers([]);
      } else {
        setActiveSpeaker(speakerId);
        setSelectedSpeakers([speakerId]); // Keep as array for compatibility but only one item
      }
    },
    [activeSpeaker, setSelectedSpeakers]
  );

  const renderContextPanel = () => {
    if (!journalTarget) {
      return (
        <div
          className="space-y-3 text-sm"
          style={{ color: theme.textSecondary }}
        >
          <p>This journal entry is not linked to a specific node.</p>
          <p>
            Open a part, impression, or interaction to display its context here.
          </p>
        </div>
      );
    }

    // Check if we have the target node first - if we do, we can render it even without flowNodesContext
    if (!targetNode) {
      // Only show the "context not available" message if we also don't have any nodes
      if (!flowNodesContext && nodes.length === 0) {
        return (
          <div className="space-y-3 text-sm text-[var(--theme-text-secondary)]">
            <p className="font-semibold text-[var(--theme-text-primary)]">
              Node context is not available.
            </p>
            <p>The workspace may not be fully loaded yet.</p>
            <p className="text-xs mt-2 text-[var(--theme-text-muted)]">
              Make sure you&apos;re viewing a workspace with nodes.
            </p>
            <div
              className="mt-3 rounded-lg border p-3 text-xs"
              style={{
                backgroundColor: theme.warning + "1a",
                borderColor: theme.warning + "33",
              }}
            >
              <p
                className="font-semibold mb-1"
                style={{ color: theme.warning }}
              >
                Debug Info:
              </p>
              <p className="text-[var(--theme-text-secondary)]">
                flowNodesContext: {flowNodesContext ? "available" : "null"}
              </p>
              <p className="text-[var(--theme-text-secondary)]">
                nodes.length: {nodes.length}
              </p>
              <p className="text-[var(--theme-text-secondary)]">
                nodeId: {nodeId || "none"}
              </p>
            </div>
          </div>
        );
      }
      return (
        <div
          className="space-y-3 text-sm"
          style={{ color: theme.textSecondary }}
        >
          <p className="font-semibold" style={{ color: theme.textPrimary }}>
            We couldn&apos;t find this node in the current workspace.
          </p>
          <p>It may have been removed or moved to another map.</p>
          {nodeId && (
            <p className="text-xs mt-2 text-[var(--theme-text-muted)]">
              Looking for node:{" "}
              <code className="px-1 rounded bg-[var(--theme-surface)]">
                {nodeId}
              </code>
            </p>
          )}
          {nodes.length > 0 && (
            <div
              className="mt-3 rounded-lg border p-3 text-xs"
              style={{
                backgroundColor: theme.info + "1a",
                borderColor: theme.info + "33",
              }}
            >
              <p className="font-semibold mb-2" style={{ color: theme.info }}>
                Found {nodes.length} node{nodes.length !== 1 ? "s" : ""} in
                workspace:
              </p>
              <ul className="space-y-1 text-[var(--theme-text-secondary)]">
                {nodes.slice(0, 5).map((n) => (
                  <li key={n.id}>
                    <code className="px-1 rounded bg-[var(--theme-surface)]">
                      {n.id}
                    </code>{" "}
                    ({n.type})
                  </li>
                ))}
                {nodes.length > 5 && (
                  <li className="text-[var(--theme-text-muted)]">
                    ... and {nodes.length - 5} more
                  </li>
                )}
              </ul>
            </div>
          )}
          {nodes.length === 0 && (
            <div
              className="mt-3 rounded-lg border p-3 text-xs"
              style={{
                backgroundColor: theme.error + "1a",
                borderColor: theme.error + "33",
              }}
            >
              <p className="font-semibold" style={{ color: theme.error }}>
                No nodes found in workspace
              </p>
              <p style={{ color: theme.textSecondary }}>
                The workspace appears to be empty or not loaded.
              </p>
            </div>
          )}
        </div>
      );
    }

    if (targetNode.type === "part") {
      const data = targetNode.data as PartNodeData;

      // Flatten all impressions and sort by recency (most recent first)
      const impressions = ImpressionList.flatMap((impressionType) => {
        const impressionData =
          (data[ImpressionTextType[impressionType]] as ImpressionNode[]) || [];
        return impressionData.map((imp) => ({
          ...imp,
          impressionType,
          addedAt:
            imp.data?.addedAt || imp.data?.createdAt || imp.data?.timestamp,
        }));
      });

      const allImpressions = impressions.sort((a, b) => {
        const dateA =
          typeof a.addedAt === "string"
            ? new Date(a.addedAt).getTime()
            : Number(a.addedAt || 0);
        const dateB =
          typeof b.addedAt === "string"
            ? new Date(b.addedAt).getTime()
            : Number(b.addedAt || 0);
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
        <div
          className="space-y-6 text-sm"
          style={{ color: theme.textSecondary }}
        >
          <section className="p-0">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <h3
                  className="text-xl font-semibold"
                  style={{ color: theme.textPrimary }}
                >
                  {data.label}
                </h3>
                <div
                  className="mt-3 flex flex-wrap items-center gap-2 text-xs"
                  style={{ color: theme.textMuted }}
                >
                  {(() => {
                    const partType =
                      data.partType === "custom"
                        ? data.customPartType
                        : data.partType;
                    const mapping: Record<
                      string,
                      { icon: React.ReactNode; className: string }
                    > = {
                      manager: {
                        icon: <Brain className="w-3.5 h-3.5" />,
                        className:
                          "theme-light:bg-sky-100 theme-light:text-sky-600 theme-dark:bg-sky-500/15 theme-dark:text-sky-100",
                      },
                      firefighter: {
                        icon: <Shield className="w-3.5 h-3.5" />,
                        className:
                          "theme-light:bg-rose-100 theme-light:text-rose-600 theme-dark:bg-rose-500/15 theme-dark:text-rose-100",
                      },
                      exile: {
                        icon: <Heart className="w-3.5 h-3.5" />,
                        className:
                          "theme-light:bg-purple-100 theme-light:text-purple-600 theme-dark:bg-purple-500/15 theme-dark:text-purple-100",
                      },
                    };

                    const pill =
                      partType && mapping[partType]
                        ? mapping[partType]
                        : {
                            icon: <User className="w-3.5 h-3.5" />,
                            className:
                              "theme-light:bg-slate-100 theme-light:text-slate-600 theme-dark:bg-slate-800/60 theme-dark:text-slate-200",
                          };

                    return (
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium capitalize shadow-sm ${pill.className}`}
                      >
                        {pill.icon}
                        {partType || "No type set"}
                      </span>
                    );
                  })()}
                  {data.age && String(data.age).toLowerCase() !== "unknown" && (
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-3 py-0.5 font-medium shadow-sm"
                      style={{
                        backgroundColor: theme.surface,
                        color: theme.textMuted,
                      }}
                    >
                      Age{" "}
                      <span
                        className="font-semibold"
                        style={{ color: theme.textPrimary }}
                      >
                        {data.age}
                      </span>
                    </span>
                  )}
                  {data.gender && data.gender.toLowerCase() !== "unknown" && (
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-3 py-0.5 font-medium shadow-sm"
                      style={{
                        backgroundColor: theme.surface,
                        color: theme.textMuted,
                      }}
                    >
                      Gender{" "}
                      <span
                        className="font-semibold"
                        style={{ color: theme.textPrimary }}
                      >
                        {data.gender}
                      </span>
                    </span>
                  )}
                  {metadata.map((item) => (
                    <span
                      key={item.label}
                      className="inline-flex items-center gap-1 rounded-full px-3 py-0.5 font-medium shadow-sm"
                      style={{
                        backgroundColor: theme.surface,
                        color: theme.textMuted,
                      }}
                    >
                      {item.label}{" "}
                      <span
                        className="font-semibold"
                        style={{ color: theme.textPrimary }}
                      >
                        {item.value}
                      </span>
                    </span>
                  ))}
                </div>
              </div>

              {data.image && (
                <div
                  className="relative h-24 w-24 overflow-hidden rounded-xl border shadow-sm"
                  style={{
                    borderColor: theme.border,
                    backgroundColor: theme.surface,
                  }}
                >
                  <img
                    src={data.image}
                    alt={`${data.label} image`}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
            </div>

            {data.scratchpad?.trim() && (
              <div
                className="rounded-xl px-3.5 py-3 text-xs leading-relaxed shadow-sm"
                style={{
                  backgroundColor: theme.surface,
                  color: theme.textSecondary,
                  marginTop: "10px",
                }}
              >
                <span
                  className="font-medium"
                  style={{ color: theme.textMuted }}
                >
                  Description{" "}
                </span>
                <span style={{ color: theme.textPrimary }}>
                  {data.scratchpad}
                </span>
              </div>
            )}
          </section>

          <section className="space-y-3">
            <p
              className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: theme.textMuted }}
            >
              Impressions
            </p>
            {hasImpressions ? (
              <div className="flex flex-wrap gap-2">
                {allImpressions.map((item) => {
                  const impressionType = item.impressionType as ImpressionType;

                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-xl border px-3 py-2 shadow-sm"
                      style={{
                        backgroundColor: `var(--theme-impression-${impressionType}-bg)`,
                        borderColor: "transparent",
                        color: `var(--theme-impression-${impressionType}-text)`,
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
              <div
                className="rounded-xl border px-3 py-2"
                style={{
                  borderColor: theme.border,
                  backgroundColor: theme.surface,
                }}
              >
                <span className="text-xs" style={{ color: theme.textMuted }}>
                  No impressions
                </span>
              </div>
            )}
          </section>

          {data.needs && data.needs.length > 0 && (
            <section className="space-y-2">
              <p
                className="text-xs font-semibold uppercase tracking-wide"
                style={{ color: theme.textMuted }}
              >
                Key Needs
              </p>
              <ul className="flex flex-wrap gap-2">
                {data.needs
                  .filter(Boolean)
                  .slice(0, 6)
                  .map((need, idx) => (
                    <li
                      key={`${need}-${idx}`}
                      className="rounded-full px-3 py-1 text-xs font-medium shadow-sm"
                      style={{
                        backgroundColor: theme.surface,
                        color: theme.textPrimary,
                      }}
                    >
                      {need}
                    </li>
                  ))}
              </ul>
            </section>
          )}

          {data.insights && data.insights.length > 0 && (
            <section className="space-y-2">
              <p
                className="text-xs font-semibold uppercase tracking-wide"
                style={{ color: theme.textMuted }}
              >
                Insights
              </p>
              <ul className="flex flex-col gap-1.5">
                {data.insights
                  .filter(Boolean)
                  .slice(0, 4)
                  .map((insight, idx) => (
                    <li
                      key={`${insight}-${idx}`}
                      className="rounded-lg px-3 py-1.5 text-sm shadow-sm"
                      style={{
                        backgroundColor: theme.card,
                        color: theme.textPrimary,
                      }}
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
      const data = targetNode.data as
        | TensionNodeData
        | {
            connectedNodes?: ConnectedNodeType[];
            relationshipType?: string;
            label?: string;
            [key: string]: unknown;
          };

      const connectedNodes: ConnectedNodeType[] = Array.isArray(
        (data as TensionNodeData).connectedNodes
      )
        ? ((data as TensionNodeData).connectedNodes as ConnectedNodeType[])
        : [];

      // Get the actual part nodes from the workspace to ensure we have full data
      const enrichedConnectedNodes = connectedNodes.map(
        ({ part, tensionDescription }) => {
          const actualPartNode = nodes.find(
            (n) => n.id === part.id && n.type === "part"
          );
          return {
            part: actualPartNode || part,
            tensionDescription,
            isFromWorkspace: !!actualPartNode,
          };
        }
      );

      const relationshipType =
        (data as TensionNodeData).relationshipType ||
        (targetNode.type === "relationship"
          ? "relationship"
          : targetNode.type) ||
        "interaction";
      const displayLabel =
        data.label ||
        (targetNode.data as { label?: string })?.label ||
        "No summary yet";

      return (
        <div
          className="space-y-3 text-sm"
          style={{ color: theme.textSecondary }}
        >
          {enrichedConnectedNodes.length === 0 ? (
            <div className="space-y-2">
              <p
                className="rounded-lg px-3 py-2 text-sm"
                style={{
                  backgroundColor: theme.surface,
                  color: theme.textSecondary,
                }}
              >
                No parts linked to this {relationshipType} yet.
              </p>
              <div
                className="rounded-lg border p-3 text-xs"
                style={{
                  backgroundColor: theme.warning + "1a",
                  borderColor: theme.warning + "33",
                }}
              >
                <p
                  className="font-semibold mb-1"
                  style={{ color: theme.warning }}
                >
                  Debug Info:
                </p>
                <p style={{ color: theme.textSecondary }}>
                  connectedNodes extracted: {connectedNodes.length}
                </p>
                <p style={{ color: theme.textSecondary }}>
                  data.connectedNodes type:{" "}
                  {typeof (data as TensionNodeData).connectedNodes}
                </p>
                <p style={{ color: theme.textSecondary }}>
                  data.connectedNodes isArray:{" "}
                  {Array.isArray((data as TensionNodeData).connectedNodes)}
                </p>
                <p style={{ color: theme.textSecondary }}>
                  nodeType: {targetNode.type}
                </p>
                <p style={{ color: theme.textSecondary }}>
                  data keys: {Object.keys(data).join(", ")}
                </p>
              </div>
            </div>
          ) : (
            enrichedConnectedNodes.map(
              ({ part, tensionDescription, isFromWorkspace }) => {
                const partData = part.data as PartNodeData | undefined;
                const partLabel =
                  partData?.label || part.data?.label || "Unnamed part";

                const partType =
                  partData?.partType === "custom"
                    ? partData.customPartType
                    : partData?.partType;
                const partTypeMapping: Record<
                  string,
                  { icon: React.ReactNode; className: string }
                > = {
                  manager: {
                    icon: <Brain className="w-3.5 h-3.5" />,
                    className:
                      "theme-light:bg-sky-100 theme-light:text-sky-600 theme-dark:bg-sky-500/15 theme-dark:text-sky-100",
                  },
                  firefighter: {
                    icon: <Shield className="w-3.5 h-3.5" />,
                    className:
                      "theme-light:bg-rose-100 theme-light:text-rose-600 theme-dark:bg-rose-500/15 theme-dark:text-rose-100",
                  },
                  exile: {
                    icon: <Heart className="w-3.5 h-3.5" />,
                    className:
                      "theme-light:bg-purple-100 theme-light:text-purple-600 theme-dark:bg-purple-500/15 theme-dark:text-purple-100",
                  },
                };

                const partTypePill =
                  partType && partTypeMapping[partType]
                    ? partTypeMapping[partType]
                    : {
                        icon: <User className="w-3.5 h-3.5" />,
                        className:
                          "theme-light:bg-slate-100 theme-light:text-slate-600 theme-dark:bg-slate-800/60 theme-dark:text-slate-200",
                      };

                return (
                  <div
                    key={part.id}
                    className="rounded-xl border px-3.5 py-3 shadow-sm"
                    style={{
                      borderColor: theme.border,
                      backgroundColor: theme.card,
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p
                        className="font-semibold"
                        style={{ color: theme.textPrimary }}
                      >
                        {partLabel}
                      </p>
                    </div>
                    {tensionDescription ? (
                      <p
                        className="mt-1 text-sm leading-relaxed"
                        style={{ color: theme.textSecondary }}
                      >
                        {tensionDescription}
                      </p>
                    ) : (
                      <p
                        className="mt-1 text-xs uppercase tracking-wide"
                        style={{ color: theme.textMuted }}
                      >
                        No notes yet
                      </p>
                    )}
                    {partData && (
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium capitalize shadow-sm ${partTypePill.className}`}
                        >
                          {partTypePill.icon}
                          {partType || "No type set"}
                        </span>
                        {partData.needs && partData.needs.length > 0 && (
                          <span
                            className="text-xs"
                            style={{ color: theme.textMuted }}
                          >
                            Needs: {partData.needs.slice(0, 2).join(", ")}
                            {partData.needs.length > 2 ? "..." : ""}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              }
            )
          )}
        </div>
      );
    }

    if (IMPRESSION_NODE_TYPES.includes(targetNode.type as ImpressionType)) {
      const label = (targetNode.data as { label?: string })?.label;

      return (
        <div
          className="space-y-3 text-sm"
          style={{ color: theme.textSecondary }}
        >
          <div
            className="rounded-xl border px-3.5 py-3 text-base leading-relaxed shadow-sm"
            style={{
              backgroundColor: theme.surface,
              borderColor: theme.border,
              color: theme.textPrimary,
            }}
          >
            {label || "No text added to this impression yet."}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-3 text-sm" style={{ color: theme.textSecondary }}>
        <p>Node context is available for parts, impressions, and tensions.</p>
      </div>
    );
  };

  const renderHistoryPanel = () => {
    if (isHistoryLoading) {
      return (
        <div
          className="flex h-full items-center justify-center text-sm"
          style={{ color: theme.textMuted }}
        >
          Loading history…
        </div>
      );
    }

    // Check if there's a draft entry (show even if no content yet)
    // Only show draft when explicitly starting a new entry
    const isDraft = isStartingNewEntry;
    const draftEntry: JournalEntry | null = isDraft
      ? {
          id: "draft",
          nodeId: nodeId || null,
          content: journalData,
          title: deriveTitleFromContent(journalData, "Draft"),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          speakers: speakersArray,
        }
      : null;

    // Combine draft entry with saved entries (draft first)
    const allEntriesToShow = draftEntry
      ? [draftEntry, ...relevantEntries]
      : relevantEntries;

    return (
      <div className="space-y-3">
        {/* History List */}
        {allEntriesToShow.length === 0 ? (
          <div className="space-y-3 text-sm py-4 text-[var(--theme-text-secondary)]">
            <p className="text-[var(--theme-text)]">
              No saved journal entries yet.
            </p>
            <p className="text-xs text-[var(--theme-text-muted)]">
              Click "New Entry" in the header to start, then save your first
              entry.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {allEntriesToShow.map((entry) => {
              const isDraftEntry = entry.id === "draft";
              const isActive = entry.id === activeEntryId || isDraftEntry;
              const preview = extractPlainText(entry.content, partNodes);
              const entryIsTextThread = isTextThread(entry.content || "");

              // Calculate word and character counts
              const wordCount = entryIsTextThread
                ? (() => {
                    try {
                      const parsed = JSON.parse(entry.content || "[]");
                      if (Array.isArray(parsed)) {
                        return parsed.reduce((acc: number, msg: any) => {
                          return (
                            acc +
                            (msg.text || "")
                              .split(/\s+/)
                              .filter((w: string) => w.length > 0).length
                          );
                        }, 0);
                      }
                    } catch {}
                    return 0;
                  })()
                : (entry.content || "").split(/\s+/).filter((w) => w.length > 0)
                    .length;
              const charCount = entry.content?.length || 0;

              return (
                <button
                  key={entry.id}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!isDraftEntry) {
                      handleSelectEntry(entry);
                    }
                  }}
                  className={`w-full rounded-xl transition text-left p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer ${isActive ? "border-0 bg-[var(--theme-journal-entry-card-active-bg)]" : "border-2 bg-[var(--theme-journal-entry-card-inactive-bg)] hover:bg-[var(--theme-journal-entry-card-hover-bg)]"}`}
                  style={{
                    borderColor: isActive ? "transparent" : theme.border,
                    ...(isActive
                      ? {
                          boxShadow:
                            "var(--theme-journal-entry-card-active-shadow)",
                        }
                      : {}),
                  }}
                >
                  {/* Header with dates and actions */}
                  <div className="flex items-start justify-between mb-3 gap-4">
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs min-w-0">
                        <Clock
                          className="w-3.5 h-3.5 flex-shrink-0"
                          style={{
                            color: isActive
                              ? theme.textPrimary
                              : theme.textSecondary,
                          }}
                        />
                        <span
                          className="truncate"
                          style={{
                            color: isActive
                              ? theme.textPrimary
                              : theme.textSecondary,
                          }}
                        >
                          {isDraftEntry
                            ? "Now"
                            : `${new Date(entry.updatedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })} ${new Date(entry.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isActive && (
                        <span className="rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide whitespace-nowrap bg-[var(--theme-journal-entry-card-active-badge-bg)] text-[var(--theme-journal-entry-card-active-badge-color)]">
                          {isDraftEntry ? "Draft" : "Current"}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Preview content */}
                  <p
                    className="text-sm leading-relaxed mb-2"
                    style={{
                      color: isActive ? theme.textPrimary : theme.textSecondary,
                      display: "-webkit-box",
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {preview || "This entry is currently empty."}
                  </p>

                  {/* Word and character count with delete button */}
                  <div
                    className="pt-2 border-t flex items-center justify-between"
                    style={{ borderColor: theme.border }}
                  >
                    <span
                      className="text-[10px]"
                      style={{ color: theme.textMuted }}
                    >
                      {wordCount} words • {charCount.toLocaleString()} chars
                    </span>
                    {!isDraftEntry && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          void handleDeleteEntry(entry.id);
                        }}
                        className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium transition-colors"
                        style={{ color: theme.textMuted }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = theme.error;
                          e.currentTarget.style.backgroundColor =
                            "var(--theme-journal-entry-delete-hover-bg)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = theme.textMuted;
                          e.currentTarget.style.backgroundColor = "transparent";
                        }}
                        title="Delete entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </button>
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
        className="absolute inset-0 transition-opacity duration-300"
        style={{
          backgroundColor: `${theme.modal}73`,
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
        }}
        onClick={() => void attemptClose()}
      />

      <aside
        className={`absolute top-0 left-0 h-full w-full pointer-events-auto transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* TEMPORARY DEBUG: Theme toggle - remove when done debugging */}
        <div className="absolute top-4 right-4 z-[10000] pointer-events-auto">
          <div
            className="flex items-center gap-2 rounded-lg border px-2 py-1.5 shadow-lg"
            style={{ backgroundColor: theme.card, borderColor: theme.border }}
          >
            <span
              className="text-xs font-medium"
              style={{ color: theme.textSecondary }}
            >
              Theme:
            </span>
            <button
              type="button"
              onClick={() => {
                const themes: Array<"light" | "dark" | "cherry"> = [
                  "light",
                  "dark",
                  "cherry",
                ];
                const currentIndex = themes.indexOf(activeTheme);
                const nextIndex = (currentIndex + 1) % themes.length;
                setActiveTheme(themes[nextIndex]);
              }}
              className="px-2 py-1 rounded text-xs font-semibold transition-colors"
              style={{
                backgroundColor: theme.button,
                color: theme.textPrimary,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme.buttonHover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = theme.button;
              }}
            >
              {activeTheme}
            </button>
          </div>
        </div>
        {/* END TEMPORARY DEBUG */}
        <div
          className="flex h-full flex-col overflow-hidden shadow-2xl"
          style={{ backgroundColor: theme.modal }}
        >
          {distractionFree ? (
            <>
              {/* Distraction-free header */}
              <header
                className="px-4 py-3"
                style={{
                  border: "none",
                  backgroundColor: "transparent",
                  boxShadow: "none",
                }}
              >
                <div className="flex items-center justify-center">
                  <div
                    className="flex items-center justify-end gap-2 w-full transition-all duration-300 ease-in-out"
                    style={{
                      maxWidth: (() => {
                        const isShowingJournalOptions =
                          showModeSelection ||
                          (journalMode === null && activeEntryId === null);
                        if (journalMode === "textThread") return "600px";
                        return isShowingJournalOptions ? "700px" : "56rem";
                      })(),
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => void handleSave()}
                      disabled={!canSave || isSaving}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold flex-shrink-0 shadow-sm ${isSaving ? "animate-pulse" : ""} theme-dark:shadow-[var(--theme-button-shadow)] border-t-[var(--theme-button-border-top)]`}
                      style={{
                        backgroundColor:
                          canSave && !isSaving ? theme.info : theme.button,
                        color: canSave && !isSaving ? "white" : theme.textMuted,
                        transition: "none !important",
                      }}
                      onMouseEnter={(e) => {
                        if (canSave && !isSaving) {
                          e.currentTarget.style.backgroundColor = "#2563eb";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (canSave && !isSaving) {
                          e.currentTarget.style.backgroundColor = theme.info;
                          e.currentTarget.style.color = "white";
                        }
                      }}
                    >
                      <Save size={14} />
                      {isSaving ? "Saving…" : "Save"}
                    </button>

                    <button
                      type="button"
                      onClick={() => setDistractionFree(false)}
                      className="rounded-full p-1.5 flex-shrink-0 shadow-sm border-t-[var(--theme-journal-button-border-top)] theme-dark:shadow-[var(--theme-journal-button-shadow)]"
                      style={{
                        backgroundColor: theme.card,
                        color: theme.textSecondary,
                        border: "none",
                        transition: "none !important",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor =
                          theme.buttonHover;
                        e.currentTarget.style.color = theme.textPrimary;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = theme.card;
                        e.currentTarget.style.color = theme.textSecondary;
                      }}
                      title="Exit distraction-free mode"
                    >
                      <Minimize2 size={18} />
                    </button>
                  </div>
                </div>
              </header>
            </>
          ) : (
            <>
              {/* Normal header */}
              <header
                className="border-b px-4 py-3 shadow-sm backdrop-blur"
                style={{
                  borderColor: theme.border,
                  backgroundColor: theme.elevated,
                }}
              >
                <div
                  className="flex items-center justify-center"
                  style={{ transition: "none" }}
                >
                  <div
                    className="flex items-center justify-between gap-3 w-full"
                    style={{
                      maxWidth: (() => {
                        const isShowingJournalOptions =
                          showModeSelection ||
                          (journalMode === null && activeEntryId === null);

                        if (journalMode === "textThread") {
                          return showLeftPanel
                            ? "calc(600px + 19.5rem)"
                            : "600px";
                        }

                        return showLeftPanel
                          ? isShowingJournalOptions
                            ? "calc(700px + 19.5rem)"
                            : "calc(56rem + 19.5rem)"
                          : isShowingJournalOptions
                            ? "700px"
                            : "56rem";
                      })(),
                      paddingRight:
                        journalMode === "normal" &&
                        !showModeSelection &&
                        activeEntryId !== null
                          ? "24px"
                          : undefined,
                      transition: "max-width 300ms ease-in-out",
                    }}
                  >
                    <h2
                      className="text-lg font-semibold truncate flex-1 min-w-0"
                      style={{ color: theme.textPrimary }}
                    >
                      {nodeLabel}
                    </h2>

                    <div className="flex items-center gap-2 flex-shrink-0 transition-all duration-300 ease-in-out">
                      <button
                        type="button"
                        onClick={() => setShowLeftPanel((prev) => !prev)}
                        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium flex-shrink-0 shadow-sm border-t-[var(--theme-journal-button-border-top)] theme-dark:shadow-[var(--theme-journal-button-shadow)] text-[var(--theme-text-primary)] bg-[var(--theme-sub-button)] hover:bg-[var(--theme-sub-button-hover)] border-none"
                        style={{
                          transition: "none !important",
                        }}
                        // onMouseEnter={(e) => {
                        //   e.currentTarget.style.backgroundColor = theme.buttonHover;
                        // }}
                        // onMouseLeave={(e) => {
                        //   e.currentTarget.style.backgroundColor = theme.card;
                        // }}
                        title={
                          showLeftPanel
                            ? "Info active - Hide sidebar"
                            : "Info inactive - Show sidebar"
                        }
                      >
                        <Layers size={14} />
                        {showLeftPanel ? "Hide Info" : "Info"}
                      </button>

                      <button
                        type="button"
                        onClick={() => void handleStartNewEntry()}
                        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium flex-shrink-0 shadow-sm border-none text-[var(--theme-text-primary)] bg-[var(--theme-sub-button)] hover:bg-[var(--theme-sub-button-hover)] border-t-[var(--theme-button-border-top)] theme-dark:shadow-[var(--theme-button-shadow)]"
                        style={{
                          transition: "none !important",
                        }}
                        // onMouseEnter={(e) => {
                        //   e.currentTarget.style.backgroundColor = theme.buttonHover;
                        // }}
                        // onMouseLeave={(e) => {
                        //   e.currentTarget.style.backgroundColor = theme.card;
                        // }}
                        title="Start a new journal entry"
                      >
                        <Plus size={14} />
                        New Entry
                      </button>

                      <button
                        type="button"
                        onClick={() => void handleSave()}
                        disabled={!canSave || isSaving}
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold flex-shrink-0 shadow-sm border-t-[var(--theme-button-border-top)] theme-dark:shadow-[var(--theme-button-shadow)] ${isSaving ? "animate-pulse" : ""}`}
                        style={{
                          backgroundColor:
                            canSave && !isSaving ? theme.info : theme.button,
                          color:
                            canSave && !isSaving ? "white" : theme.textMuted,
                          transition: "none !important",
                        }}
                        onMouseEnter={(e) => {
                          if (canSave && !isSaving) {
                            e.currentTarget.style.backgroundColor = "#2563eb"; // Darker blue on hover
                            e.currentTarget.style.color = "white";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (canSave && !isSaving) {
                            e.currentTarget.style.backgroundColor = theme.info;
                            e.currentTarget.style.color = "white";
                          }
                        }}
                      >
                        <Save size={14} />
                        {isSaving ? "Saving…" : "Save"}
                      </button>

                      <button
                        type="button"
                        onClick={() => setDistractionFree(true)}
                        className="rounded-full p-1.5 flex-shrink-0 shadow-sm border-none text-[var(--theme-text-secondary)] border-t-[var(--theme-button-border-top)] theme-dark:shadow-[var(--theme-button-shadow)] bg-[var(--theme-sub-button)] hover:bg-[var(--theme-sub-button-hover)] "
                        style={{
                          transition: "none !important",
                        }}
                        // onMouseEnter={(e) => {
                        //   e.currentTarget.style.color = theme.textPrimary;
                        // }}
                        // onMouseLeave={(e) => {
                        //   e.currentTarget.style.color = theme.textSecondary;
                        // }}
                        title="Enter distraction-free mode"
                      >
                        <Maximize2 size={18} />
                      </button>

                      <button
                        type="button"
                        onClick={() => void attemptClose()}
                        className="rounded-full p-1.5 flex-shrink-0 shadow-sm border-none text-[var(--theme-text-secondary)] border-t-[var(--theme-button-border-top)] theme-dark:shadow-[var(--theme-button-shadow)] bg-[var(--theme-sub-button)] hover:bg-[var(--theme-sub-button-hover)]"
                        style={{
                          transition: "none !important",
                        }}
                        // onMouseEnter={(e) => {
                        //   e.currentTarget.style.backgroundColor = theme.buttonHover;
                        //   e.currentTarget.style.color = theme.textPrimary;
                        // }}
                        // onMouseLeave={(e) => {
                        //   e.currentTarget.style.backgroundColor = theme.card;
                        //   e.currentTarget.style.color = theme.textSecondary;
                        // }}
                        title="Close"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </header>
            </>
          )}

          <div className="flex flex-1 flex-col overflow-hidden">
            <div
              className={`relative flex flex-1 flex-col gap-6 transition-all duration-300 ease-in-out ${distractionFree ? "px-0 pt-0 overflow-hidden" : "px-6 pb-6 pt-6 overflow-y-auto"}`}
              style={
                distractionFree
                  ? { paddingBottom: "1.5rem" }
                  : { paddingTop: "1.5rem" }
              }
            >
              {/* Container wrapper for centering */}
              <div
                className={`relative flex items-start gap-6 w-full ${distractionFree ? "mx-auto h-full" : "h-full"}`}
                style={{
                  maxWidth: (() => {
                    const isShowingJournalOptions =
                      showModeSelection ||
                      (journalMode === null && activeEntryId === null);

                    if (distractionFree) {
                      return isShowingJournalOptions
                        ? "700px"
                        : journalMode === "textThread"
                          ? "600px"
                          : "56rem";
                    }

                    if (journalMode === "textThread") {
                      return showLeftPanel ? "calc(600px + 19.5rem)" : "600px";
                    }

                    if (isShowingJournalOptions) {
                      return showLeftPanel ? "calc(700px + 19.5rem)" : "700px";
                    }

                    return showLeftPanel ? "calc(56rem + 19.5rem)" : "56rem";
                  })(),
                  marginLeft: "auto",
                  marginRight: "auto",
                  ...(distractionFree ? { height: "100%" } : {}),
                  transition: distractionFree
                    ? "height 300ms ease-in-out"
                    : "max-width 300ms ease-in-out, height 300ms ease-in-out",
                }}
              >
                {/* Left panel with tabs */}
                {!distractionFree && showLeftPanel && (
                  <>
                    <aside className="hidden lg:flex w-72 flex-shrink-0 flex-col overflow-hidden rounded-2xl border shadow-inner transition-all duration-300 ease-in-out h-full border-[var(--theme-border)] bg-[var(--theme-card)]">
                      {/* Tab buttons */}
                      <div className="flex bg-[var(--theme-surface)]">
                        <button
                          type="button"
                          onClick={() => setLeftPanelTab("info")}
                          className="flex-1 px-4 py-3 text-xs font-semibold uppercase tracking-[0.28em]"
                          style={{
                            border:
                              leftPanelTab === "info" ? "none" : undefined,
                            borderBottom:
                              leftPanelTab === "info"
                                ? "none"
                                : `1px solid var(--theme-journal-tab-border-inactive)`,
                            borderRight:
                              leftPanelTab === "info"
                                ? "none"
                                : `1px solid var(--theme-journal-tab-border-inactive)`,
                            backgroundColor:
                              leftPanelTab === "info"
                                ? "var(--theme-journal-tab-button-active-bg)"
                                : "var(--theme-journal-tab-button-inactive-bg)",
                            transition: "none !important",
                            color:
                              leftPanelTab === "info"
                                ? theme.textPrimary
                                : theme.textSecondary,
                          }}
                          onMouseEnter={(e) => {
                            if (leftPanelTab !== "info") {
                              e.currentTarget.style.backgroundColor =
                                "var(--theme-journal-tab-button-hover-bg)";
                              e.currentTarget.style.color = theme.textPrimary;
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (leftPanelTab !== "info") {
                              e.currentTarget.style.backgroundColor =
                                "var(--theme-journal-tab-button-inactive-bg)";
                              e.currentTarget.style.color = theme.textSecondary;
                            }
                          }}
                        >
                          <div className="flex items-center justify-center gap-2">
                            <Layers size={14} />
                            Info
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => setLeftPanelTab("history")}
                          className="flex-1 px-4 py-3 text-xs font-semibold uppercase tracking-[0.28em]"
                          style={{
                            border:
                              leftPanelTab === "history" ? "none" : undefined,
                            borderBottom:
                              leftPanelTab === "history"
                                ? "none"
                                : `1px solid var(--theme-journal-tab-border-inactive)`,
                            borderLeft:
                              leftPanelTab === "history"
                                ? "none"
                                : `1px solid var(--theme-journal-tab-border-inactive)`,
                            backgroundColor:
                              leftPanelTab === "history"
                                ? "var(--theme-journal-tab-button-active-bg)"
                                : "var(--theme-journal-tab-button-inactive-bg)",
                            color:
                              leftPanelTab === "history"
                                ? theme.textPrimary
                                : theme.textSecondary,
                          }}
                          onMouseEnter={(e) => {
                            if (leftPanelTab !== "history") {
                              e.currentTarget.style.backgroundColor =
                                "var(--theme-journal-tab-button-hover-bg)";
                              e.currentTarget.style.color = theme.textPrimary;
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (leftPanelTab !== "history") {
                              e.currentTarget.style.backgroundColor =
                                "var(--theme-journal-tab-button-inactive-bg)";
                              e.currentTarget.style.color = theme.textSecondary;
                            }
                          }}
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
                          <div>{renderHistoryPanel()}</div>
                        )}
                      </div>
                    </aside>

                    <div className="block lg:hidden">
                      <div className="mx-auto max-w-4xl rounded-2xl border shadow-sm border-[var(--theme-border)] bg-[var(--theme-card)]">
                        {/* Tab buttons for mobile */}
                        <div className="flex bg-[var(--theme-surface)]">
                          <button
                            type="button"
                            onClick={() => setLeftPanelTab("info")}
                            className="flex-1 px-4 py-3 text-xs font-semibold uppercase tracking-[0.28em]"
                            style={{
                              border:
                                leftPanelTab === "info" ? "none" : undefined,
                              borderBottom:
                                leftPanelTab === "info"
                                  ? "none"
                                  : `1px solid var(--theme-journal-tab-border-inactive)`,
                              borderRight:
                                leftPanelTab === "info"
                                  ? "none"
                                  : `1px solid var(--theme-journal-tab-border-inactive)`,
                              backgroundColor:
                                leftPanelTab === "info"
                                  ? "var(--theme-journal-tab-button-active-bg)"
                                  : "var(--theme-journal-tab-button-inactive-bg)",
                              color:
                                leftPanelTab === "info"
                                  ? theme.textPrimary
                                  : theme.textSecondary,
                            }}
                            onMouseEnter={(e) => {
                              if (leftPanelTab !== "info") {
                                e.currentTarget.style.backgroundColor =
                                  "var(--theme-journal-tab-button-hover-bg)";
                                e.currentTarget.style.color = theme.textPrimary;
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (leftPanelTab !== "info") {
                                e.currentTarget.style.backgroundColor =
                                  "var(--theme-journal-tab-button-inactive-bg)";
                                e.currentTarget.style.color =
                                  theme.textSecondary;
                              }
                            }}
                          >
                            <div className="flex items-center justify-center gap-2">
                              <Layers size={14} />
                              Info
                            </div>
                          </button>
                          <button
                            type="button"
                            onClick={() => setLeftPanelTab("history")}
                            className="flex-1 px-4 py-3 text-xs font-semibold uppercase tracking-[0.28em]"
                            style={{
                              border:
                                leftPanelTab === "history" ? "none" : undefined,
                              borderBottom:
                                leftPanelTab === "history"
                                  ? "none"
                                  : `1px solid var(--theme-journal-tab-border-inactive)`,
                              borderLeft:
                                leftPanelTab === "history"
                                  ? "none"
                                  : `1px solid var(--theme-journal-tab-border-inactive)`,
                              backgroundColor:
                                leftPanelTab === "history"
                                  ? "var(--theme-journal-tab-button-active-bg)"
                                  : "var(--theme-journal-tab-button-inactive-bg)",
                              color:
                                leftPanelTab === "history"
                                  ? theme.textPrimary
                                  : theme.textSecondary,
                            }}
                            onMouseEnter={(e) => {
                              if (leftPanelTab !== "history") {
                                e.currentTarget.style.backgroundColor =
                                  "var(--theme-journal-tab-button-hover-bg)";
                                e.currentTarget.style.color = theme.textPrimary;
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (leftPanelTab !== "history") {
                                e.currentTarget.style.backgroundColor =
                                  "var(--theme-journal-tab-button-inactive-bg)";
                                e.currentTarget.style.color =
                                  theme.textSecondary;
                              }
                            }}
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
                            <div>{renderHistoryPanel()}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                )}
                {/* Main content area */}
                <main
                  className={`flex flex-col overflow-hidden flex-shrink-0 ${distractionFree ? "flex-1 gap-0" : "gap-6 transition-all duration-300 ease-in-out"} ${journalMode === "textThread" ? "shadow-sm" : ""}`}
                  style={{
                    width: (() => {
                      const isShowingJournalOptions =
                        showModeSelection ||
                        (journalMode === null && activeEntryId === null);
                      if (journalMode === "textThread") return "600px";
                      return isShowingJournalOptions ? "700px" : "56rem";
                    })(),
                    maxWidth: (() => {
                      const isShowingJournalOptions =
                        showModeSelection ||
                        (journalMode === null && activeEntryId === null);
                      if (journalMode === "textThread") return "600px";
                      return isShowingJournalOptions ? "700px" : "56rem";
                    })(),
                    ...(distractionFree
                      ? {
                          height: "100%",
                          maxHeight: "100%",
                          transition: "height 300ms ease-in-out",
                        }
                      : { height: "100%" }),
                    ...(journalMode === "textThread"
                      ? {
                          borderRadius: "16px",
                          padding: "24px",
                          backgroundColor:
                            "var(--theme-journal-textthread-container-bg)",
                        }
                      : {}),
                  }}
                >
                  <div
                    className={`flex-1 overflow-hidden w-full transition-all duration-300 ease-in-out ${distractionFree && journalMode !== "textThread" ? "rounded-none flex flex-col" : journalMode === "textThread" ? "" : "px-6"}`}
                    style={{
                      backgroundColor:
                        journalMode === "textThread"
                          ? "transparent"
                          : theme.card,
                      ...(distractionFree && journalMode !== "textThread"
                        ? { padding: 0, minHeight: 0 }
                        : {}),
                    }}
                  >
                    {/* Mode Selection Modal */}
                    {showModeSelection ||
                    (journalMode === null && activeEntryId === null) ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="w-full p-8 w-[700px] max-w-[700px]">
                          <div className="text-center mb-8">
                            <h3 className="text-2xl font-bold mb-2 text-[var(--theme-text-primary)]">
                              Choose Journal Type
                            </h3>
                            <p className="text-[var(--theme-text-secondary)]">
                              Select how you'd like to record this journal entry
                            </p>
                          </div>
                          <div
                            className={`grid gap-4 ${isImpressionJournal ? "grid-cols-1 max-w-md mx-auto" : "grid-cols-1 md:grid-cols-2"}`}
                          >
                            <button
                              type="button"
                              onClick={() => handleModeSelect("normal")}
                              className="group relative p-6 rounded-2xl transition-all text-left bg-[var(--theme-journal-mode-card-bg)] hover:bg-[var(--theme-journal-mode-card-hover-bg)] shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1),0_4px_6px_-2px_rgba(0,0,0,0.05)]"
                            >
                              <span
                                data-create-pill
                                className="absolute top-3 right-3 rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide transition-opacity duration-200 bg-[var(--theme-journal-mode-card-journal-pill-bg)] text-[var(--theme-journal-mode-card-journal-pill-color)] opacity-0 invisible group-hover:opacity-100 group-hover:visible"
                              >
                                New
                              </span>
                              <div className="flex items-start gap-4">
                                <div className="p-3 rounded-xl transition bg-[var(--theme-journal-mode-card-journal-icon-bg)]">
                                  <Book className="w-6 h-6 text-[var(--theme-journal-mode-card-journal-icon-color)]" />
                                </div>
                                <div className="flex-1">
                                  <h4 className="text-lg font-semibold mb-1 text-[var(--theme-text-primary)]">
                                    Journal
                                  </h4>
                                  <p className="text-sm text-[var(--theme-text-secondary)]">
                                    Traditional rich text editor with inline
                                    speaker notation. Perfect for structured
                                    journaling and notes.
                                  </p>
                                </div>
                              </div>
                            </button>
                            {!isImpressionJournal && (
                              <button
                                type="button"
                                onClick={() => handleModeSelect("textThread")}
                                className="group relative p-6 rounded-2xl transition-all text-left bg-[var(--theme-journal-mode-card-bg)] hover:bg-[var(--theme-journal-mode-card-textthread-hover-bg)] shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1),0_4px_6px_-2px_rgba(0,0,0,0.05)]"
                              >
                                <span
                                  data-create-pill
                                  className="absolute top-3 right-3 rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide transition-opacity duration-200 bg-[var(--theme-journal-mode-card-textthread-pill-bg)] text-[var(--theme-journal-mode-card-textthread-pill-color)] opacity-0 invisible group-hover:opacity-100 group-hover:visible"
                                >
                                  New
                                </span>
                                <div className="flex items-start gap-4">
                                  <div className="p-3 rounded-xl transition bg-[var(--theme-journal-mode-card-textthread-icon-bg)]">
                                    <MessagesSquare className="w-6 h-6 text-[var(--theme-journal-mode-card-textthread-icon-color)]" />
                                  </div>
                                  <div className="flex-1">
                                    <h4 className="text-lg font-semibold mb-1 text-[var(--theme-text-primary)]">
                                      Text Thread
                                    </h4>
                                    <p className="text-sm text-[var(--theme-text-secondary)]">
                                      Chat-style conversation interface. Great
                                      for IFS parts dialogues and back-and-forth
                                      exchanges.
                                    </p>
                                  </div>
                                </div>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : journalMode === "textThread" && !isImpressionJournal ? (
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
                          console.log(
                            "📞 onToggleSpeaker prop called with:",
                            id
                          );
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
        </div>
      </aside>
    </div>
  );
}
