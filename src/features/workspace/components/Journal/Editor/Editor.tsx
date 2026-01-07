/**
 * JournalEditor.tsx
 */

"use client";

import { useMemo } from "react";
import { ImpressionType } from "@/features/workspace/types/Impressions";
import { NodeBackgroundColors } from "../../../constants/Nodes";

// Lexical React
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import SmartListPlugin from "@/features/workspace/components/Journal/Editor/plugins/SmartListPlugin";
import PointerGhostSelectionPlugin from "@/features/workspace/components/Journal/Editor/plugins/PointerGhostSelectionPlugin";
import ToolbarPlugin from "@/features/workspace/components/Journal/Editor/plugins/ToolbarPlugin";

// Lexical core
import { LexicalEditor } from "lexical";

import { $generateHtmlFromNodes } from "@lexical/html";
import { ListNode, ListItemNode } from "@lexical/list";

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

const innerHtmlStyle = {
  __html: `
.prose { color: var(--theme-text-primary); }
.prose p:not([style*="color"]), 
.prose li:not([style*="color"]), 
.prose span:not([style*="color"]), 
.prose div:not([style*="color"]) {
  color: var(--theme-text-primary);
}
`,
};

export default function JournalEditor({
  contentJson,
  onContentChange,
  readOnly = false,
  nodeType,
}: JournalEditorProps) {
  const accentColor = useMemo(() => {
    return (
      (nodeType && NodeBackgroundColors[nodeType]) ||
      NodeBackgroundColors.default
    );
  }, [nodeType]);

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
        {!readOnly && <ToolbarPlugin />}

        <div className="relative flex-1 overflow-hidden rounded-2xl border shadow-inner flex border-[var(--theme-border)] bg-[var(--theme-surface)]">
          <div className="flex-1 relative overflow-hidden">
            <style dangerouslySetInnerHTML={innerHtmlStyle} />

            <div className="h-full relative overflow-y-auto">
              <RichTextPlugin
                contentEditable={
                  <ContentEditable
                    className="prose prose-slate w-full min-w-full max-w-none py-5 text-base leading-relaxed focus:outline-none focus-visible:ring-0 dark:prose-invert whitespace-pre-wrap min-h-full pl-[24px] pr-[24px] text-[var(--theme-text-primary)]"
                    style={{
                      caretColor: accentColor,
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
              <PointerGhostSelectionPlugin />
            </div>
          </div>
        </div>
      </div>
    </LexicalComposer>
  );
}
