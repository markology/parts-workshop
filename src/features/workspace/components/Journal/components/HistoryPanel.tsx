"use client";

import { Clock, Trash2, MessagesSquare, Book } from "lucide-react";
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

            // Helper to get content text from entry (supports both new and legacy formats)
            const getEntryContentText = (entry: any): string => {
              if (entry.contentText) return entry.contentText;
              if (entry.content) return entry.content;
              if (entry.contentJson) {
                try {
                  const json =
                    typeof entry.contentJson === "string"
                      ? JSON.parse(entry.contentJson)
                      : entry.contentJson;
                  if (json?.root?.children) {
                    const extractText = (nodes: any[]): string => {
                      let text = "";
                      for (const node of nodes) {
                        if (node.type === "text") {
                          text += node.text || "";
                        } else if (node.children) {
                          text += extractText(node.children);
                        }
                      }
                      return text;
                    };
                    return extractText(json.root.children);
                  }
                } catch {}
              }
              return "";
            };

            // Helper to get content JSON from entry (supports both new and legacy formats)
            const getEntryContentJson = (entry: any): any => {
              if (entry.contentJson) {
                return typeof entry.contentJson === "string"
                  ? JSON.parse(entry.contentJson)
                  : entry.contentJson;
              }
              if (entry.content) {
                try {
                  return JSON.parse(entry.content);
                } catch {
                  return null;
                }
              }
              return null;
            };

            // Use stored journalType, defaulting to "normal" for legacy entries
            const entryIsTextThread = entry.journalType === "textThread";

            // Get content preview (matching PartDetailPanel logic)
            const contentPreview = (() => {
              if (entryIsTextThread) {
                const parsed = getEntryContentJson(entry);
                if (Array.isArray(parsed) && parsed.length > 0) {
                  // Get part nodes for speaker name resolution
                  const partNodesMap = new Map(partNodes.map((n) => [n.id, n]));

                  return (
                    parsed
                      .slice(0, 8)
                      .map((msg: any) => {
                        let speakerLabel = "Unknown";
                        if (msg.speakerId === "self") {
                          speakerLabel = "Self";
                        } else if (
                          msg.speakerId === "unknown" ||
                          msg.speakerId === "?"
                        ) {
                          speakerLabel = "Unknown";
                        } else {
                          const partNode = partNodesMap.get(msg.speakerId);
                          speakerLabel = partNode?.label || msg.speakerId;
                        }
                        return `${speakerLabel}: ${msg.text || msg.content || ""}`;
                      })
                      .join("\n") +
                    (parsed.length > 8
                      ? `\n... (${parsed.length - 8} more messages)`
                      : "")
                  );
                }
              }
              // Regular content - use contentText or extract from contentJson
              let text = getEntryContentText(entry);
              // Remove HTML tags and extract plain text
              if (typeof window !== "undefined") {
                const temp = document.createElement("div");
                temp.innerHTML = text;
                text = (temp.textContent || temp.innerText || "").trim();
              } else {
                // Server-side fallback
                text = text
                  .replace(/<[^>]+>/g, " ")
                  .replace(/\s+/g, " ")
                  .trim();
              }
              return text.length > 500 ? text.substring(0, 500) + "..." : text;
            })();

            // Calculate word and character counts
            const contentText = getEntryContentText(entry);
            const wordCount = entryIsTextThread
              ? (() => {
                  const parsed = getEntryContentJson(entry);
                  if (Array.isArray(parsed)) {
                    return parsed.reduce((acc: number, msg: any) => {
                      return (
                        acc +
                        (msg.text || msg.content || "")
                          .split(/\s+/)
                          .filter((w: string) => w.length > 0).length
                      );
                    }, 0);
                  }
                  return 0;
                })()
              : contentText.split(/\s+/).filter((w: string) => w.length > 0)
                  .length;
            const charCount = contentText.length;

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
                    {isActive && (
                      <span className="rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide whitespace-nowrap bg-[var(--theme-journal-entry-card-active-badge-bg)] text-[var(--theme-journal-entry-card-active-badge-color)]">
                        {isDraftEntry ? "Draft" : "Current"}
                      </span>
                    )}
                  </div>
                </div>

                {/* Preview content */}
                <div
                  className={`whitespace-pre-wrap text-sm leading-relaxed mb-2 max-h-32 overflow-y-auto theme-dark:text-slate-300 theme-light:text-slate-700`}
                  style={{
                    border: "none",
                    padding: "10px",
                    borderRadius: "10px",
                    background: "var(--theme-part-detail-list-item-bg)",
                  }}
                >
                  {contentPreview || "This entry is currently empty."}
                </div>

                {/* Word and character count with delete button */}
                <div
                  className="pt-2 border-t flex items-center justify-between"
                  style={{ borderColor: theme.border }}
                >
                  <div className="flex items-center gap-1.5">
                    {entryIsTextThread ? (
                      <MessagesSquare className="w-3 h-3 theme-dark:text-purple-200 theme-light:text-purple-700" />
                    ) : (
                      <Book className="w-3 h-3 theme-dark:text-blue-200 theme-light:text-blue-700" />
                    )}
                    <span
                      className="text-[10px]"
                      style={{ color: theme.textMuted }}
                    >
                      {wordCount} words • {charCount.toLocaleString()} chars
                    </span>
                  </div>
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
