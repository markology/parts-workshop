"use client";

import { Book, MessagesSquare } from "lucide-react";

interface ModeSelectionProps {
  isImpressionJournal: boolean;
  onSelectMode: (mode: "normal" | "textThread") => void;
}

export default function ModeSelection({
  isImpressionJournal,
  onSelectMode,
}: ModeSelectionProps) {
  return (
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
            onClick={() => onSelectMode("normal")}
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
                  Traditional rich text editor with inline speaker notation.
                  Perfect for structured journaling and notes.
                </p>
              </div>
            </div>
          </button>
          {!isImpressionJournal && (
            <button
              type="button"
              onClick={() => onSelectMode("textThread")}
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
                    Chat-style conversation interface. Great for dialogues and
                    multi-speaker interactions.
                  </p>
                </div>
              </div>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

