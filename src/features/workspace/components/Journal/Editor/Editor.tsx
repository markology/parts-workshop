/**
 * JournalEditor.tsx
 *
 * Clean, predictable Lexical editor with:
 * - Bold / Italic / Underline (works correctly for mixed selections)
 * - Bullet list toggle
 * - Text color picker
 * - JSON <-> Lexical state sync
 * - Debounced onContentChange
 *
 * Key behavior:
 * - Toolbar state is DERIVED from Lexical (selection + editor updates)
 * - Formatting commands ONLY mutate Lexical (no setFormats inside editor.update)
 * - Mixed selection formatting:
 *    - if entire selection already has format -> remove it from selection
 *    - else -> apply it only to segments missing it
 */

"use client";

import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { ImpressionType } from "@/features/workspace/types/Impressions";
import { useTheme } from "@/features/workspace/hooks/useTheme";
import { NodeBackgroundColors } from "../../../constants/Nodes";

// Lexical React
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import SmartListPlugin from "@/features/workspace/components/Journal/Editor/plugins/SmartListPlugin";

// Lexical core
import { LexicalEditor } from "lexical";

import { $generateHtmlFromNodes } from "@lexical/html";

import { ListNode, ListItemNode } from "@lexical/list";
import { Toolbar } from "./Toolbar";

interface JournalEditorProps {
  contentJson: string | null;
  onContentChange: (data: { json: string; text: string }) => void;
  readOnly?: boolean;
  nodeType?: ImpressionType | "part" | "tension" | "interaction";
}

const PLACEHOLDER_TEXT = "Start writing your journal entry...";

const lexicalTheme = {
  paragraph: "mb-1",
  text: {
    bold: "font-bold",
    italic: "italic",
    underline: "underline",
  },
  list: {
    nested: { listitem: "list-none" },
    ol: "list-decimal",
    ul: "list-disc",
    listitem: "ml-4",
  },
};

export function exportEditorHtml(editor: LexicalEditor): string {
  return editor
    .getEditorState()
    .read(() => $generateHtmlFromNodes(editor, null));
}

export default function JournalEditor({
  contentJson,
  onContentChange,
  readOnly = false,
  nodeType,
}: JournalEditorProps) {
  const theme = useTheme();
  const [activeColor, setActiveColor] = useState<string | null>(
    theme.textPrimary
  );

  const accentColor = useMemo(() => {
    return (
      (nodeType && NodeBackgroundColors[nodeType]) ||
      NodeBackgroundColors.default
    );
  }, [nodeType]);

  // Shared flag to prevent ContentSync -> ChangeHandler -> parent loop
  const isSyncingRef = useRef(false);

  const initialConfig = {
    namespace: "JournalEditor",
    theme: lexicalTheme,
    nodes: [ListNode, ListItemNode],
    onError: (error: Error) => {
      console.error("Lexical error:", error);
    },
    editable: !readOnly,
    editorState: null,
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className="flex h-full flex-col gap-4">
        {!readOnly && (
          <Toolbar activeColor={activeColor} setActiveColor={setActiveColor} />
        )}

        <div className="relative flex-1 overflow-hidden rounded-2xl border shadow-inner flex border-[var(--theme-border)] bg-[var(--theme-surface)]">
          <div className="flex-1 relative overflow-hidden">
            <style
              dangerouslySetInnerHTML={{
                __html: `
              .prose { color: var(--theme-text-primary); }
              .prose p:not([style*="color"]), 
              .prose li:not([style*="color"]), 
              .prose span:not([style*="color"]), 
              .prose div:not([style*="color"]) {
                color: var(--theme-text-primary);
              }
            `,
              }}
            />

            <div className="h-full relative overflow-y-auto">
              <RichTextPlugin
                contentEditable={
                  <ContentEditable
                    className="prose prose-slate w-full min-w-full max-w-none py-5 text-base leading-relaxed focus:outline-none focus-visible:ring-0 dark:prose-invert whitespace-pre-wrap min-h-full pl-[24px] pr-[24px]"
                    style={{
                      caretColor: accentColor,
                      color: "var(--theme-text-primary)",
                    }}
                  />
                }
                placeholder={
                  <div className="pointer-events-none absolute left-6 top-5 text-sm text-[var(--theme-text-muted)]">
                    {PLACEHOLDER_TEXT}
                  </div>
                }
                ErrorBoundary={({ children }) => <>{children}</>}
              />

              <HistoryPlugin />
              <ListPlugin />
              <SmartListPlugin />
              {/* <ContentSyncPlugin
                contentJson={contentJson}
                isSyncingRef={isSyncingRef}
              /> */}
              {/* 
              <ChangeHandler
                onContentChange={onContentChange}
                readOnly={readOnly}
                isSyncingRef={isSyncingRef}
                onClearFormatting={() => setActiveColor(null)}
              /> */}
            </div>
          </div>
        </div>
      </div>
    </LexicalComposer>
  );
}
