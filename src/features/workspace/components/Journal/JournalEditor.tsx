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
import { NodeBackgroundColors } from "../../constants/Nodes";

// Lexical React
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

// Lexical core
import {
  EditorState,
  LexicalEditor,
  LexicalNode,
  $createParagraphNode,
  $getRoot,
  $getSelection,
  $isRangeSelection,
} from "lexical";

import { $generateHtmlFromNodes } from "@lexical/html";

import {
  ListNode,
  ListItemNode,
  REMOVE_LIST_COMMAND,
  $isListNode,
} from "@lexical/list";
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

/* ----------------------------- Change Handler ----------------------------- */

function ChangeHandler({
  onContentChange,
  readOnly,
  onClearFormatting,
  isSyncingRef,
}: {
  onContentChange: (data: { json: string; text: string }) => void;
  readOnly: boolean;
  onClearFormatting?: () => void;
  isSyncingRef: React.MutableRefObject<boolean>;
}) {
  const [editor] = useLexicalComposerContext();
  const previousTextContentRef = useRef<string>("");
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  return (
    <OnChangePlugin
      onChange={(editorState: EditorState) => {
        if (readOnly) return;
        if (isSyncingRef.current) return; // prevent loops during external sync

        editorState.read(() => {
          const root = $getRoot();
          const textContent = root.getTextContent();

          const wasNotEmpty = previousTextContentRef.current.trim().length > 0;
          const isNowEmpty = textContent.trim().length === 0;

          if (wasNotEmpty && isNowEmpty) {
            editor.update(
              () => {
                // Remove list formatting if cursor is currently in a list
                const selection = $getSelection();
                if ($isRangeSelection(selection)) {
                  let node: LexicalNode | null = selection.anchor.getNode();
                  while (node) {
                    if ($isListNode(node)) {
                      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
                      break;
                    }
                    node = node.getParent();
                  }
                }

                // Reset to a clean empty paragraph
                root.clear();
                root.append($createParagraphNode());
              },
              { discrete: true }
            );

            onClearFormatting?.();
          }

          previousTextContentRef.current = textContent;

          if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

          // debounceTimerRef.current = setTimeout(() => {
          //   const json = JSON.stringify(editorState.toJSON());
          //   onContentChange({ json, text: textContent });
          // }, 300);
        });
      }}
    />
  );
}

/* ----------------------------- Content Sync ------------------------------ */

function ContentSyncPlugin({
  contentJson,
  isSyncingRef,
}: {
  contentJson: string | null;
  isSyncingRef: React.MutableRefObject<boolean>;
}) {
  const [editor] = useLexicalComposerContext();
  const previousContentRef = useRef<string | null>(null);

  useEffect(() => {
    if (isSyncingRef.current) return;
    if (contentJson === previousContentRef.current) return;

    const normalized =
      contentJson && contentJson !== "null" && contentJson.trim() !== ""
        ? contentJson
        : null;

    // If null/empty, ensure editor is empty (but avoid extra work if already empty)
    if (!normalized) {
      let alreadyEmpty = false;
      editor.getEditorState().read(() => {
        alreadyEmpty = $getRoot().getTextContent().trim().length === 0;
      });

      previousContentRef.current = contentJson;
      if (alreadyEmpty) return;

      isSyncingRef.current = true;
      editor.update(
        () => {
          const root = $getRoot();
          root.clear();
          root.append($createParagraphNode());
        },
        { discrete: true }
      );
      queueMicrotask(() => {
        isSyncingRef.current = false;
      });
      return;
    }

    // Sync real JSON into editor
    try {
      isSyncingRef.current = true;
      const nextState = editor.parseEditorState(normalized);
      editor.setEditorState(nextState);
    } catch (e) {
      console.warn("ContentSyncPlugin: failed to parse editor state", e);
      editor.update(
        () => {
          const root = $getRoot();
          root.clear();
          root.append($createParagraphNode());
        },
        { discrete: true }
      );
    } finally {
      previousContentRef.current = contentJson;
      queueMicrotask(() => {
        isSyncingRef.current = false;
      });
    }
  }, [contentJson, editor, isSyncingRef]);

  return null;
}

/* ------------------------------ Main Editor ------------------------------ */

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

              <ContentSyncPlugin
                contentJson={contentJson}
                isSyncingRef={isSyncingRef}
              />

              <ChangeHandler
                onContentChange={onContentChange}
                readOnly={readOnly}
                isSyncingRef={isSyncingRef}
                onClearFormatting={() => setActiveColor(null)}
              />
            </div>
          </div>
        </div>
      </div>
    </LexicalComposer>
  );
}
