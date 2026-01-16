"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useJournalStore } from "@/features/workspace/state/stores/Journal";
import { useSaveJournalEntry } from "../../../state/hooks/useSaveJournalEntry";
import { useAllJournalEntries } from "../../../state/hooks/useAllJournalEntries";
import { JournalEntry } from "@/features/workspace/types/Journal";
import { useFlowNodesContextOptional } from "../../../state/FlowNodesContext";
import { useWorkingStore } from "../../../state/stores/useWorkingStore";
import {
  ConnectedNodeType,
  PartNodeData,
  WorkshopNode,
} from "@/features/workspace/types/Nodes";
import { ImpressionType } from "@/features/workspace/types/Impressions";
import { ImpressionList } from "../../../constants/Impressions";
import { getJournalModeFromType } from "@/features/workspace/utils/journalType";

interface UseJournalDrawerProps {
  targetNodeProp?: WorkshopNode | null;
}

export function useJournalDrawer({ targetNodeProp }: UseJournalDrawerProps) {
  const queryClient = useQueryClient();

  // Store state
  const isOpen = useJournalStore((s) => s.isOpen);
  const closeJournal = useJournalStore((s) => s.closeJournal);
  const journalTarget = useJournalStore((s) => s.journalTarget);
  const journalDataJson = useJournalStore((s) => s.journalDataJson);
  const journalDataText = useJournalStore((s) => s.journalDataText);
  const setJournalData = useJournalStore((s) => s.setJournalData);
  const loadEntry = useJournalStore((s) => s.loadEntry);
  const activeEntryId = useJournalStore((s) => s.activeEntryId);
  const selectedSpeakers = useJournalStore((s) => s.selectedSpeakers);
  const setSelectedSpeakers = useJournalStore((s) => s.setSelectedSpeakers);
  const lastSavedJournalDataJson = useJournalStore(
    (s) => s.lastSavedJournalDataJson
  );
  const lastSavedJournalDataText = useJournalStore(
    (s) => s.lastSavedJournalDataText
  );

  // Context
  const flowNodesContext = useFlowNodesContextOptional();
  const workingStoreNodes = useWorkingStore((s) => s.nodes);

  // Use context nodes if available, otherwise fall back to working store nodes
  const nodes = flowNodesContext?.nodes ?? workingStoreNodes ?? [];
  const { data: allEntries = [], isLoading: isHistoryLoading } =
    useAllJournalEntries();
  const { mutateAsync: saveJournalEntry, isPending: isSaving } =
    useSaveJournalEntry();

  // UI State
  const [leftPanelTab, setLeftPanelTab] = useState<"info" | "history">("info");
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [journalMode, setJournalMode] = useState<
    "normal" | "textThread" | null
  >(null);
  const [showJournalModeSelection, setShowJournalModeSelection] =
    useState(false);
  const [isStartingNewEntry, setIsStartingNewEntry] = useState(false);
  const [distractionFree, setDistractionFree] = useState(false);
  const [confirmDeleteEntryId, setConfirmDeleteEntryId] = useState<
    string | null
  >(null);
  const [isDeletingEntry, setIsDeletingEntry] = useState(false);
  const [showSaveBeforeCloseModal, setShowSaveBeforeCloseModal] =
    useState(false);
  const [isSavingBeforeClose, setIsSavingBeforeClose] = useState(false);
  const [pendingEntryToSwitch, setPendingEntryToSwitch] =
    useState<JournalEntry | null>(null);
  // Speaker-related state for normal journal editor - moved to backup for future use
  // const [activeSpeaker, setActiveSpeaker] = useState<string | null>(null);

  // Ensure selectedSpeakers is always an array (still used for text threads and saving)
  const speakersArray = Array.isArray(selectedSpeakers) ? selectedSpeakers : [];

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Close left panel by default for global journal
    if (journalTarget?.type === "global") {
      setShowLeftPanel(false);
    } else if (window.innerWidth < 768) {
      // Only auto-hide on very small screens, but allow user to toggle
      setShowLeftPanel(false);
    }
  }, [journalTarget]);

  const nodeId =
    journalTarget?.type === "node" ? journalTarget.nodeId : undefined;
  const nodeType =
    journalTarget?.type === "node" ? journalTarget.nodeType : undefined;
  const nodeLabel =
    journalTarget?.type === "node" ? journalTarget.title : "Global Journal";

  // Use provided targetNode if available, otherwise compute it from nodeId and nodes
  const targetNode = useMemo<WorkshopNode | null>(() => {
    if (targetNodeProp !== undefined) {
      return targetNodeProp;
    }
    // Fallback: compute from nodeId and nodes (backward compatibility)
    return nodeId ? (nodes.find((node) => node.id === nodeId) ?? null) : null;
  }, [targetNodeProp, nodeId, nodes]);

  const relevantEntries = useMemo(
    () =>
      (journalTarget?.type === "node"
        ? allEntries.filter((entry) => entry.nodeId === nodeId)
        : allEntries.filter((entry) => !entry.nodeId)) ?? [],
    [allEntries, journalTarget, nodeId]
  );

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
    if (targetNode?.type === "part") {
      // Part journal - show only that part
      const partData = targetNode?.data as PartNodeData;
      return [
        {
          id: targetNode?.id,
          label: partData?.label || "Unnamed Part",
        },
      ];
    }

    if (targetNode?.type === "tension" || targetNode?.type === "interaction") {
      // Tension/Interaction journal - show only parts in connectedNodes
      const data = targetNode?.data;
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

  // Compare text content to detect unsaved changes
  // This is more reliable than comparing JSON since Lexical may serialize
  // the same content slightly differently (especially after edits)
  const hasUnsavedChanges = useMemo(() => {
    // Normalize text by trimming for comparison
    const currentText = (journalDataText || "").trim();
    const savedText = (lastSavedJournalDataText || "").trim();

    // Compare normalized text content
    return currentText !== savedText;
  }, [journalDataText, lastSavedJournalDataText]);

  // Don't allow saving if it's a new entry with no content
  const canSave = useMemo(() => {
    if (!hasUnsavedChanges) return false;
    // If it's a new entry (never been saved), require content
    if (!activeEntryId) {
      return journalDataText && journalDataText.trim().length > 0;
    }
    // If it's an existing entry, allow saving even if empty (to clear it)
    return true;
  }, [hasUnsavedChanges, activeEntryId, journalDataText]);

  // Check if current journal target is an impression
  const isImpressionJournal = useMemo(() => {
    return (
      nodeType &&
      (ImpressionList.includes(nodeType as ImpressionType) ||
        nodeType === "default")
    );
  }, [nodeType]);

  // Reset all state when drawer closes
  useEffect(() => {
    if (!isOpen) {
      // Reset all local UI state when drawer closes
      setLeftPanelTab("info");
      setShowLeftPanel(true);
      setJournalMode(null);
      setShowJournalModeSelection(false);
      setIsStartingNewEntry(false);
      setDistractionFree(false);
      setConfirmDeleteEntryId(null);
      setIsDeletingEntry(false);
      setShowSaveBeforeCloseModal(false);
      setIsSavingBeforeClose(false);
      setPendingEntryToSwitch(null);
      // setActiveSpeaker(null); // Speaker functionality disabled
    }
  }, [isOpen]);

  // On open or target change, start fresh for the new target
  useEffect(() => {
    if (!isOpen || !journalTarget) return;
    setJournalData({ json: null, text: "" });
    loadEntry({
      entryId: null,
      contentJson: null,
      contentText: "",
      speakers: ["self"],
    });
    setJournalMode(null);
  }, [isOpen, journalTarget, setJournalData, loadEntry]);

  // Reset isStartingNewEntry and set mode from entry's journalType when an entry is loaded
  useEffect(() => {
    if (activeEntryId !== null) {
      setIsStartingNewEntry(false);

      // Find the entry and set mode from its journalType
      const entry = relevantEntries.find((e) => e.id === activeEntryId);
      if (
        entry?.journalType === "normal" ||
        entry?.journalType === "textThread"
      ) {
        const mode = isImpressionJournal ? "normal" : entry.journalType;
        if (journalMode !== mode) {
          setJournalMode(mode);
        }
        setShowJournalModeSelection(false);
      }
    }
  }, [activeEntryId, relevantEntries, isImpressionJournal, journalMode]);

  // Reset active speaker and formatting when entry changes - moved to backup for future use
  // useEffect(() => {
  //   // Clear active speaker and selected speakers whenever activeEntryId changes
  //   setActiveSpeaker(null);
  //   setSelectedSpeakers([]);
  // }, [activeEntryId, setSelectedSpeakers]);

  // Determine if should show journal mode selection or select journal mode based on current state
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
      setShowJournalModeSelection(false);
      return;
    }

    // If no mode is set and no entry is loaded, show mode selection
    if (journalMode === null && activeEntryId === null) {
      setShowJournalModeSelection(true);
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

      // Use plain text directly from store
      const hasContent = journalDataText && journalDataText.trim().length > 0;

      // Don't allow saving if there's no content and it's a new entry (never been saved)
      if (!activeEntryId && !hasContent) {
        return false; // Don't save empty new entries
      }

      try {
        // Ensure we have JSON to save
        if (!journalDataJson) {
          console.error("Cannot save: no journalDataJson");
          return false;
        }

        const saveData = {
          nodeId,
          contentJson: journalDataJson,
          contentText: journalDataText,
          title: undefined, // Don't save empty title
          entryId:
            options?.createNewVersion || !activeEntryId
              ? undefined
              : activeEntryId,
          createNewVersion: options?.createNewVersion || !activeEntryId,
          speakers: speakersArray,
          journalType: journalMode || undefined, // Use current journalMode
        };

        console.log("SAVING JOURNAL entry with data:", saveData);

        const entry = await saveJournalEntry(saveData);

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

        // Force normal mode for impressions if needed
        const currentMode = journalMode ?? "normal";
        const nextMode = isImpressionJournal ? "normal" : currentMode;
        setJournalMode(nextMode);

        // Load the saved entry back into store
        loadEntry({
          entryId: entry.id,
          contentJson: entry.contentJson
            ? typeof entry.contentJson === "string"
              ? entry.contentJson
              : JSON.stringify(entry.contentJson)
            : null,
          contentText: entry.contentText || journalDataText || "",
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
      journalDataJson,
      journalDataText,
      journalTarget,
      loadEntry,
      nodeId,
      saveJournalEntry,
      speakersArray,
      isImpressionJournal,
      journalMode,
    ]
  );

  const handleNewEntry = useCallback(() => {
    // Allow starting new entry freely - don't block
    // Reset mode and show mode selection modal
    setIsStartingNewEntry(true);
    console.log("IS IMPRESSION JOURNAL");
    setJournalMode(isImpressionJournal ? "normal" : null);
    setShowJournalModeSelection(!isImpressionJournal);
    // For impressions, default to only "self" in speakers
    loadEntry({
      entryId: null,
      contentJson: null,
      contentText: "",
      speakers: ["self"],
    });
    // Flag will be reset when mode is selected in handleModeSelect
  }, [isImpressionJournal, loadEntry]);

  const handleModeSelect = useCallback(
    (mode: "normal" | "textThread") => {
      // Prevent text thread mode for impressions
      if (isImpressionJournal && mode === "textThread") {
        return;
      }
      setJournalMode(mode);
      setShowJournalModeSelection(false);
      // For impressions, default to only "self" in speakers
      loadEntry({
        entryId: null,
        contentJson: mode === "textThread" ? "[]" : null,
        contentText: "",
        speakers: ["self"],
      });
      // Keep isStartingNewEntry true until user actually starts typing or saves
      // This prevents auto-load from running
    },
    [loadEntry, isImpressionJournal]
  );

  // Internal function to actually load an entry (called after save modal resolves)
  const loadEntryInternal = useCallback(
    (entry: JournalEntry) => {
      // Don't load if it's the same entry we're already viewing
      if (entry.id === activeEntryId && !isStartingNewEntry) {
        return;
      }

      setIsStartingNewEntry(false); // Reset flag when selecting an existing entry

      // Get contentJson - prefer contentJson, fallback to content (legacy) for migration
      const contentJson = entry.contentJson
        ? typeof entry.contentJson === "string"
          ? entry.contentJson
          : JSON.stringify(entry.contentJson)
        : entry.content // Legacy: if contentJson is missing, might be old HTML in content field
          ? null // If only old content field exists, we can't use it (would need migration)
          : null;

      const detectedMode = getJournalModeFromType(entry.journalType, {
        isImpression: isImpressionJournal,
      });
      setJournalMode(detectedMode);
      setShowJournalModeSelection(false); // Hide mode selection when loading an entry
      loadEntry({
        entryId: entry.id,
        contentJson: contentJson,
        contentText: entry.contentText || "",
        speakers: Array.isArray(entry.speakers) ? entry.speakers : ["self"],
      });
    },
    [loadEntry, isImpressionJournal, activeEntryId, isStartingNewEntry]
  );

  const handleSelectEntry = useCallback(
    (entry: JournalEntry) => {
      // Don't do anything if clicking on the same entry
      if (entry.id === activeEntryId && !isStartingNewEntry) {
        return;
      }

      // Check if there are unsaved changes or draft with content
      const hasContent = journalDataText && journalDataText.trim().length > 0;
      const isDraft = isStartingNewEntry || !activeEntryId;

      if (hasUnsavedChanges || (isDraft && hasContent)) {
        // Store the entry we want to switch to and show the save modal
        setPendingEntryToSwitch(entry);
        setShowSaveBeforeCloseModal(true);
        return;
      }

      // No unsaved changes, proceed with loading the entry
      loadEntryInternal(entry);
    },
    [
      activeEntryId,
      isStartingNewEntry,
      hasUnsavedChanges,
      journalDataText,
      loadEntryInternal,
    ]
  );

  const handleDeleteEntry = useCallback(
    (entryId: string) => {
      if (!journalTarget) return;
      setConfirmDeleteEntryId(entryId);
    },
    [journalTarget]
  );

  const handleConfirmDeleteEntry = useCallback(async () => {
    if (!journalTarget) return;
    if (!confirmDeleteEntryId) return;
    if (isDeletingEntry) return;

    const entryId = confirmDeleteEntryId;
    setIsDeletingEntry(true);

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
            queryClient.getQueryData<JournalEntry[]>(["journal", "all"]) ?? [];
          const remainingEntries = updatedEntries.filter((e) =>
            nodeId ? e.nodeId === nodeId || (!e.nodeId && !nodeId) : !e.nodeId
          );

          if (remainingEntries.length > 0) {
            const latestEntry = remainingEntries[0];
            const contentJson = latestEntry.contentJson
              ? typeof latestEntry.contentJson === "string"
                ? latestEntry.contentJson
                : JSON.stringify(latestEntry.contentJson)
              : null;
            const detectedMode = getJournalModeFromType(
              latestEntry.journalType,
              {
                isImpression: isImpressionJournal,
              }
            );
            setJournalMode(detectedMode);
            loadEntry({
              entryId: latestEntry.id,
              contentJson: contentJson,
              contentText: latestEntry.contentText || "",
              speakers: Array.isArray(latestEntry.speakers)
                ? latestEntry.speakers
                : [],
            });
          } else {
            // No entries left, show mode selection
            setJournalMode(null);
            setShowJournalModeSelection(true);
            // For impressions, default to only "self" in speakers
            loadEntry({
              entryId: null,
              contentJson: null,
              contentText: "",
              speakers: ["self"],
            });
          }
        }
      } else {
        alert("Failed to delete journal entry. Please try again.");
      }
    } catch (error) {
      console.error("Failed to delete journal entry:", error);
      alert("Failed to delete journal entry. Please try again.");
    } finally {
      setIsDeletingEntry(false);
      setConfirmDeleteEntryId(null);
    }
  }, [
    journalTarget,
    confirmDeleteEntryId,
    isDeletingEntry,
    nodeId,
    activeEntryId,
    loadEntry,
    queryClient,
    isImpressionJournal,
  ]);

  const attemptClose = useCallback(() => {
    // Check if there are unsaved changes or draft with content
    const hasContent = journalDataText && journalDataText.trim().length > 0;
    const isDraft = isStartingNewEntry || !activeEntryId;

    if (hasUnsavedChanges || (isDraft && hasContent)) {
      setPendingEntryToSwitch(null); // Clear any pending entry since we're closing
      setShowSaveBeforeCloseModal(true);
      return;
    }

    setJournalMode(null);
    setShowJournalModeSelection(false);
    closeJournal();
  }, [
    closeJournal,
    hasUnsavedChanges,
    journalDataText,
    isStartingNewEntry,
    activeEntryId,
  ]);

  const handleSaveAndClose = useCallback(async () => {
    setIsSavingBeforeClose(true);
    try {
      await handleSave();
      // Continue closing even if save fails
    } catch (error) {
      console.error("Failed to save before closing:", error);
    } finally {
      setIsSavingBeforeClose(false);
      setShowSaveBeforeCloseModal(false);

      // If there's a pending entry to switch to, load it instead of closing
      if (pendingEntryToSwitch) {
        loadEntryInternal(pendingEntryToSwitch);
        setPendingEntryToSwitch(null);
      } else {
        // Otherwise, close the journal
        setJournalMode(null);
        setShowJournalModeSelection(false);
        closeJournal();
      }
    }
  }, [handleSave, closeJournal, pendingEntryToSwitch, loadEntryInternal]);

  const handleCloseWithoutSaving = useCallback(() => {
    setShowSaveBeforeCloseModal(false);

    // If there's a pending entry to switch to, load it instead of closing
    if (pendingEntryToSwitch) {
      loadEntryInternal(pendingEntryToSwitch);
      setPendingEntryToSwitch(null);
    } else {
      // Otherwise, close the journal
      setJournalMode(null);
      setShowJournalModeSelection(false);
      closeJournal();
    }
  }, [closeJournal, pendingEntryToSwitch, loadEntryInternal]);

  const handleCancelSaveModal = useCallback(() => {
    // Cancel button - just close the modal and clear pending entry
    // Don't allow canceling if currently saving
    if (isSavingBeforeClose) return;
    setShowSaveBeforeCloseModal(false);
    setPendingEntryToSwitch(null);
  }, [isSavingBeforeClose]);

  // toggleSpeaker function moved to backup for future use (normal journal editor only)
  // const toggleSpeaker = useCallback(
  //   (speakerId: string) => {
  //     if (activeSpeaker === speakerId) {
  //       setActiveSpeaker(null);
  //       setSelectedSpeakers([]);
  //     } else {
  //       setActiveSpeaker(speakerId);
  //       setSelectedSpeakers([speakerId]);
  //     }
  //   },
  //   [activeSpeaker, setSelectedSpeakers]
  // );
  
  // Stub function to prevent errors (normal journal editor no longer uses speakers)
  const toggleSpeaker = useCallback(() => {
    // No-op: speaker functionality disabled for normal journal
  }, []);

  return {
    // Store state
    isOpen,
    closeJournal,
    journalTarget,
    journalDataJson,
    journalDataText,
    activeEntryId,
    speakersArray,
    setJournalData,
    // Context
    flowNodesContext,
    nodes,
    // Data
    allEntries,
    isHistoryLoading,
    relevantEntries,
    allPartNodes,
    partNodes,
    targetNode,
    nodeId,
    nodeType,
    nodeLabel,
    // UI State
    leftPanelTab,
    setLeftPanelTab,
    showLeftPanel,
    setShowLeftPanel,
    journalMode,
    setJournalMode,
    showJournalModeSelection,
    setShowJournalModeSelection,
    isStartingNewEntry,
    distractionFree,
    setDistractionFree,
    confirmDeleteEntryId,
    setConfirmDeleteEntryId,
    isDeletingEntry,
    showSaveBeforeCloseModal,
    setShowSaveBeforeCloseModal,
    isSavingBeforeClose,
    // activeSpeaker, // Speaker functionality disabled for normal journal
    activeSpeaker: null, // Stub value for compatibility
    // Computed
    hasUnsavedChanges,
    canSave,
    isImpressionJournal,
    isSaving,
    // Handlers
    handleSave,
    handleNewEntry,
    handleModeSelect,
    handleSelectEntry,
    handleDeleteEntry,
    handleConfirmDeleteEntry,
    attemptClose,
    handleSaveAndClose,
    handleCloseWithoutSaving,
    handleCancelSaveModal,
    toggleSpeaker,
  };
}
