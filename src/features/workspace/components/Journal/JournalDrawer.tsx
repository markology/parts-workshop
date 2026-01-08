"use client";

import JournalEditor from "./Editor/Editor";
import TextThreadEditor from "./TextThreadEditor";
import { WorkshopNode } from "@/features/workspace/types/Nodes";
import { ImpressionType } from "@/features/workspace/types/Impressions";
import {
  History,
  Layers,
  Plus,
  Save,
  X,
  Maximize2,
  Minimize2,
} from "lucide-react";
// import { NodeBackgroundColors, NodeTextColors } from "../../constants/Nodes";
import { useTheme } from "@/features/workspace/hooks/useTheme";
import DeleteConfirmModal from "./components/DeleteConfirmModal";
import SaveBeforeCloseModal from "./components/SaveBeforeCloseModal";
import ModeSelection from "./components/ModeSelection";
import ContextPanel from "./components/ContextPanel";
import HistoryPanel from "./components/HistoryPanel";
import { useJournalDrawer } from "./hooks/useJournalDrawer";

// Check if content is a text thread (JSON array)

import { extractPlainText } from "./utils/journalPreview";

interface JournalDrawerProps {
  targetNode?: WorkshopNode | null;
}

export default function JournalDrawer(
  { targetNode: targetNodeProp }: JournalDrawerProps = {} as JournalDrawerProps
) {
  const theme = useTheme();

  // Use the custom hook to manage all state and logic
  const {
    // Store state
    isOpen,
    closeJournal,
    journalTarget,
    journalDataJson,
    journalDataText,
    activeEntryId,
    speakersArray,
    // Context
    flowNodesContext,
    nodes,
    // Data
    isHistoryLoading,
    relevantEntries,
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
    showJournalModeSelection,
    isStartingNewEntry,
    distractionFree,
    setDistractionFree,
    confirmDeleteEntryId,
    isDeletingEntry,
    showSaveBeforeCloseModal,
    isSavingBeforeClose,
    activeSpeaker,
    // Computed
    hasUnsavedChanges,
    canSave,
    isImpressionJournal,
    isSaving,
    // Additional state setters
    setConfirmDeleteEntryId,
    setShowSaveBeforeCloseModal,
    setJournalData,
    allPartNodes,
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
  } = useJournalDrawer({ targetNodeProp });

  // ContextPanel and HistoryPanel are now separate components

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999]">
      <DeleteConfirmModal
        show={confirmDeleteEntryId !== null}
        isDeleting={isDeletingEntry}
        onClose={() => {
          if (isDeletingEntry) return;
          setConfirmDeleteEntryId(null);
        }}
        onConfirm={() => void handleConfirmDeleteEntry()}
      />

      <SaveBeforeCloseModal
        show={showSaveBeforeCloseModal}
        isSaving={isSavingBeforeClose}
        onClose={handleCancelSaveModal}
        onSave={() => void handleSaveAndClose()}
        onDontSave={handleCloseWithoutSaving}
      />

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
        {/* <div className="absolute top-4 right-4 z-[10000] pointer-events-auto">
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
        </div> */}
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
                          showJournalModeSelection ||
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
                          showJournalModeSelection ||
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
                        !showJournalModeSelection &&
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
                        onClick={() => void handleNewEntry()}
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
                      showJournalModeSelection ||
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
                          <ContextPanel
                            journalTarget={journalTarget}
                            targetNode={targetNode}
                            nodeId={nodeId}
                            nodes={nodes}
                            flowNodesContext={flowNodesContext}
                          />
                        ) : (
                          <HistoryPanel
                            isLoading={isHistoryLoading}
                            isStartingNewEntry={isStartingNewEntry}
                            activeEntryId={activeEntryId}
                            relevantEntries={relevantEntries}
                            journalDataJson={journalDataJson}
                            journalDataText={journalDataText}
                            speakersArray={speakersArray}
                            partNodes={partNodes}
                            nodeId={nodeId}
                            journalMode={journalMode}
                            onSelectEntry={handleSelectEntry}
                            onDeleteEntry={handleDeleteEntry}
                          />
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
                            <ContextPanel
                              journalTarget={journalTarget}
                              targetNode={targetNode}
                              nodeId={nodeId}
                              nodes={nodes}
                              flowNodesContext={flowNodesContext}
                            />
                          ) : (
                            <HistoryPanel
                              isLoading={isHistoryLoading}
                              isStartingNewEntry={isStartingNewEntry}
                              activeEntryId={activeEntryId}
                              relevantEntries={relevantEntries}
                              journalDataJson={journalDataJson}
                              journalDataText={journalDataText}
                              speakersArray={speakersArray}
                              partNodes={partNodes}
                              nodeId={nodeId}
                              journalMode={journalMode}
                              onSelectEntry={handleSelectEntry}
                              onDeleteEntry={handleDeleteEntry}
                            />
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
                        showJournalModeSelection ||
                        (journalMode === null && activeEntryId === null);
                      if (journalMode === "textThread") return "600px";
                      return isShowingJournalOptions ? "700px" : "56rem";
                    })(),
                    maxWidth: (() => {
                      const isShowingJournalOptions =
                        showJournalModeSelection ||
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
                    {/* Mode Selection */}
                    {showJournalModeSelection ||
                    (journalMode === null && activeEntryId === null) ? (
                      <ModeSelection
                        isImpressionJournal={isImpressionJournal ?? false}
                        onSelectMode={handleModeSelect}
                      />
                    ) : journalMode === "textThread" && !isImpressionJournal ? (
                      <TextThreadEditor
                        content={journalDataJson || "[]"}
                        onContentChange={(jsonString) => {
                          // TextThreadEditor returns JSON array string
                          // Extract text from the array for contentText
                          try {
                            const parsed = JSON.parse(jsonString);
                            const text = Array.isArray(parsed)
                              ? parsed
                                  .map((msg: any) => msg.text || "")
                                  .join(" ")
                                  .trim()
                              : "";
                            setJournalData({ json: jsonString, text });
                          } catch {
                            setJournalData({ json: jsonString, text: "" });
                          }
                        }}
                        partNodes={partNodes}
                        allPartNodes={allPartNodes}
                        nodeId={nodeId}
                        nodeType={nodeType}
                      />
                    ) : (
                      <JournalEditor
                        key={activeEntryId || "new-entry"}
                        contentJson={journalDataJson}
                        onContentChange={setJournalData}
                        nodeType={
                          nodeType as
                            | ImpressionType
                            | "part"
                            | "tension"
                            | "interaction"
                            | undefined
                        }
                        partNodes={partNodes}
                        allPartNodes={allPartNodes}
                        selectedSpeakers={speakersArray}
                        activeSpeaker={activeSpeaker}
                        onToggleSpeaker={toggleSpeaker}
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
