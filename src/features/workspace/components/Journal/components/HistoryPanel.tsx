"use client";

import { Clock, Trash2 } from "lucide-react";
import { useTheme } from "@/features/workspace/hooks/useTheme";
import { JournalEntry } from "@/features/workspace/types/Journal";
import { extractPlainText } from "../utils/journalPreview";

interface HistoryPanelProps {
  isLoading: boolean;
  isStartingNewEntry: boolean;
  activeEntryId: string | null;
  relevantEntries: JournalEntry[];
  journalDataJson: string | null;
  journalDataText: string;
  speakersArray: string[];
  partNodes: Array<{ id: string; label: string }>;
  nodeId: string | undefined;
  journalMode: "normal" | "textThread" | null;
  onSelectEntry: (entry: JournalEntry) => void;
  onDeleteEntry: (entryId: string) => void;
}

export default function HistoryPanel({
  isLoading,
  isStartingNewEntry,
  activeEntryId,
  relevantEntries,
  journalDataJson,
  journalDataText,
  speakersArray,
  partNodes,
  nodeId,
  journalMode,
  onSelectEntry,
  onDeleteEntry,
}: HistoryPanelProps) {
  const theme = useTheme();

  if (isLoading) {
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
        contentJson: journalDataJson
          ? typeof journalDataJson === "string"
            ? JSON.parse(journalDataJson)
            : journalDataJson
          : null,
        contentText: journalDataText,
        title: journalDataText
          ? journalDataText
              .split(/\r?\n/)
              .find((line) => line.trim().length > 0)
              ?.slice(0, 80) || journalDataText.slice(0, 80)
          : "Draft",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        speakers: speakersArray,
        journalType: journalMode || "normal",
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
            // Get preview text - prefer contentText, fallback to extracting from contentJson
            const preview = entry.contentText
              ? entry.contentText.slice(0, 150) +
                (entry.contentText.length > 150 ? "..." : "")
              : extractPlainText(
                  entry.content || "",
                  partNodes,
                  entry.journalType
                ); // Legacy fallback

            // Use stored journalType, defaulting to "normal" for legacy entries
            const entryIsTextThread = entry.journalType === "textThread";
            const journalTypeLabel = entryIsTextThread
              ? "Text Thread"
              : "Journal";

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
                    onSelectEntry(entry);
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
                    <span
                      className="rounded-full px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide whitespace-nowrap"
                      style={{
                        backgroundColor: isActive
                          ? theme.surface
                          : "var(--theme-sub-button)",
                        color: isActive
                          ? theme.textPrimary
                          : theme.textSecondary,
                      }}
                    >
                      {journalTypeLabel}
                    </span>
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
                        void onDeleteEntry(entry.id);
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
}
