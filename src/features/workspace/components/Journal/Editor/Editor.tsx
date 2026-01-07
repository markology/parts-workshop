/**
 * JournalEditor.tsx
 */

"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { ImpressionType } from "@/features/workspace/types/Impressions";
import { useTheme } from "@/features/workspace/hooks/useTheme";
import { NodeBackgroundColors } from "../../../constants/Nodes";

// Lexical React
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import SmartListPlugin from "@/features/workspace/components/Journal/Editor/plugins/SmartListPlugin";

// Lexical core
import {
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  LexicalEditor,
} from "lexical";

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

  const editorRef = useRef<LexicalEditor | null>(null);
  const [editorReady, setEditorReady] = useState(false);

  useEffect(() => {
    if (!editorReady) return;

    const editor = editorRef.current;
    if (!editor) return;

    const root = editor.getRootElement();
    if (!root) return;

    // ✅ Track whether this interaction was a DRAG (selection) vs a CLICK.
    let isPointerDown = false;
    let didDrag = false;
    let activePointerId: number | null = null;

    function firstTextDescendant(node: any): any | null {
      if (!node) return null;
      if ($isTextNode(node)) return node;

      if (typeof node.getChildren === "function") {
        const kids = node.getChildren();
        for (const k of kids) {
          const found = firstTextDescendant(k);
          if (found) return found;
        }
      }
      return null;
    }

    function getNextTextNode(start: any): any | null {
      let node: any = start;

      while (node) {
        // 1) try next sibling
        let sib = node.getNextSibling?.();
        while (sib) {
          const found = firstTextDescendant(sib);
          if (found) return found;
          sib = sib.getNextSibling?.();
        }

        // 2) go up and try parent's siblings
        node = node.getParent?.();
        if (!node || node.getType?.() === "root") return null;
      }

      return null;
    }

    const fixGhostSelection = () => {
      editor.update(() => {
        const sel = $getSelection();
        if (!$isRangeSelection(sel)) return;

        // ✅ if click collapses selection, do nothing
        if (sel.isCollapsed()) return;

        const isBackward = sel.isBackward();
        const a = sel.anchor;
        const f = sel.focus;

        const aNode = a.getNode();
        const fNode = f.getNode();

        const aIsText = $isTextNode(aNode);
        const fIsText = $isTextNode(fNode);

        if (!aIsText && !fIsText) return;

        const aLen = aIsText ? aNode.getTextContentSize() : 0;
        const fLen = fIsText ? fNode.getTextContentSize() : 0;

        const backwardAnchorGhost = isBackward && aIsText && a.offset === 0;
        const backwardFocusGhost = isBackward && fIsText && f.offset === fLen;

        const forwardFocusGhost = !isBackward && fIsText && f.offset === 0;
        const forwardAnchorAtEnd = !isBackward && aIsText && a.offset === aLen;

        const granularity: "character" | "lineboundary" = "lineboundary";

        if (backwardAnchorGhost) sel.modify("extend", "backward", granularity);
        if (backwardFocusGhost) sel.modify("extend", "forward", granularity);

        if (forwardFocusGhost) sel.modify("extend", "forward", granularity);

        if (forwardAnchorAtEnd) {
          if (aIsText && fIsText) {
            const nextText = getNextTextNode(aNode);
            if (nextText) {
              sel.setTextNodeRange(nextText, 0, fNode, f.offset);
            } else {
              sel.modify("extend", "backward", granularity);
            }
          } else {
            sel.modify("extend", "backward", granularity);
          }
        }
      });
    };

    const onPointerDown = (e: PointerEvent) => {
      isPointerDown = true;
      didDrag = false;
      activePointerId = e.pointerId;

      // ✅ capture so move/up still arrive even if pointer leaves the box
      try {
        root.setPointerCapture(e.pointerId);
      } catch {}
    };

    const onPointerMove = () => {
      if (!isPointerDown) return;
      didDrag = true;
    };

    const onPointerUp = (_e: PointerEvent) => {
      const wasDrag = didDrag;

      isPointerDown = false;
      didDrag = false;

      if (activePointerId != null) {
        try {
          root.releasePointerCapture(activePointerId);
        } catch {}
        activePointerId = null;
      }

      // ✅ only run fix after a drag-selection, not a click
      if (!wasDrag) return;

      queueMicrotask(fixGhostSelection);
    };

    const onPointerCancel = () => {
      isPointerDown = false;
      didDrag = false;

      if (activePointerId != null) {
        try {
          root.releasePointerCapture(activePointerId);
        } catch {}
        activePointerId = null;
      }
    };

    root.addEventListener("pointerdown", onPointerDown);
    root.addEventListener("pointermove", onPointerMove);
    root.addEventListener("pointerup", onPointerUp);
    root.addEventListener("pointercancel", onPointerCancel);

    return () => {
      root.removeEventListener("pointerdown", onPointerDown);
      root.removeEventListener("pointermove", onPointerMove);
      root.removeEventListener("pointerup", onPointerUp);
      root.removeEventListener("pointercancel", onPointerCancel);
    };
  }, [editorReady]);

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <CaptureEditorPlugin
        onEditor={(ed) => {
          editorRef.current = ed;
          setEditorReady(true);
        }}
      />

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
            </div>
          </div>
        </div>
      </div>
    </LexicalComposer>
  );
}

/**
 * Tiny plugin to grab the LexicalEditor instance (so we can bind DOM events).
 */
function CaptureEditorPlugin({
  onEditor,
}: {
  onEditor: (ed: LexicalEditor) => void;
}) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    onEditor(editor);
  }, [editor, onEditor]);

  return null;
}
