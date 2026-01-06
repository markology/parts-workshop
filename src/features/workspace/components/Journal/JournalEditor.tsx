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
  TextNode,
  $createParagraphNode,
  $getRoot,
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  SELECTION_CHANGE_COMMAND,
  COMMAND_PRIORITY_LOW,
  IS_BOLD,
  IS_ITALIC,
  IS_UNDERLINE,
} from "lexical";

import { mergeRegister } from "@lexical/utils";

import {
  $patchStyleText,
  $getSelectionStyleValueForProperty,
} from "@lexical/selection";

import { $generateHtmlFromNodes } from "@lexical/html";

import {
  ListNode,
  ListItemNode,
  INSERT_UNORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
  $isListNode,
} from "@lexical/list";

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

/* ------------------------------ Color Picker ------------------------------ */

const PRESET_COLORS = [
  "#000000",
  "#FFFFFF",
  "#EF4444",
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#8B5CF6",
  "#EC4899",
];

function ColorPicker({
  activeColor,
  onColorChange,
  disabled,
}: {
  activeColor: string | null;
  onColorChange: (color: string | null) => void;
  disabled?: boolean;
}) {
  const theme = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const isDarkColor = (color: string | null): boolean => {
    if (!color) return true;
    const hex = color.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance < 0.5;
  };

  const displayColor = activeColor || theme.textPrimary;
  const needsWhiteText = isDarkColor(displayColor);

  return (
    <div className="relative" ref={pickerRef}>
      <button
        type="button"
        disabled={disabled}
        onMouseDown={(e) => {
          e.preventDefault();
          if (!disabled) setIsOpen((v) => !v);
        }}
        className="relative w-8 rounded-md transition-all duration-200"
        style={{
          backgroundColor: displayColor,
          border: "none",
          height: "24px",
          verticalAlign: "bottom",
          boxShadow: isOpen ? "0 2px 4px rgba(0, 0, 0, 0.1)" : "none",
          opacity: disabled ? 0.5 : 1,
          cursor: disabled ? "not-allowed" : "pointer",
        }}
        title="Text Color"
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className={`text-xs font-semibold ${needsWhiteText ? "text-white" : "text-slate-900"}`}
            style={{
              textShadow: needsWhiteText ? "0 1px 2px rgba(0,0,0,0.3)" : "none",
            }}
          >
            A
          </span>
        </div>
      </button>

      {isOpen && !disabled && (
        <div className="absolute top-full left-0 mt-2 z-50 rounded-xl border backdrop-blur-sm p-3 min-w-[190px] theme-light:shadow-[0_14px_42px_rgba(0,0,0,0.18)] theme-dark:shadow-[0_14px_42px_rgba(0,0,0,0.45)] border-[var(--theme-border)] bg-[var(--theme-modal)]">
          <div className="space-y-3">
            <div className="grid grid-cols-5 gap-2.5">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onColorChange(color);
                    setIsOpen(false);
                  }}
                  className={`relative h-8 w-8 rounded-full border transition-all duration-150 ${
                    activeColor === color
                      ? "scale-105 shadow-sm"
                      : "hover:scale-105 hover:shadow-sm"
                  }`}
                  style={{
                    backgroundColor: color,
                    borderColor:
                      activeColor === color
                        ? "var(--theme-accent)"
                        : "var(--theme-border)",
                  }}
                  title={color}
                />
              ))}
            </div>

            <div className="pt-2 border-t border-[var(--theme-border)]">
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onColorChange(null);
                  setIsOpen(false);
                }}
                className="w-full rounded-md px-2.5 py-1.5 text-sm font-medium transition text-[var(--theme-text-primary)]"
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor =
                    "var(--theme-button-hover)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* --------------------------- Formatting Helpers --------------------------- */

type Format = "bold" | "italic" | "underline";

const FORMAT_FLAG: Record<Format, number> = {
  bold: IS_BOLD,
  italic: IS_ITALIC,
  underline: IS_UNDERLINE,
};

function addFormat(node: TextNode, format: Format) {
  const flag = FORMAT_FLAG[format];
  node.setFormat(node.getFormat() | flag);
}

function removeFormat(node: TextNode, format: Format) {
  const flag = FORMAT_FLAG[format];
  node.setFormat(node.getFormat() & ~flag);
}

/**
 * Split partially-selected boundary text nodes so formatting applies ONLY
 * to the highlighted characters (not outside the selection).
 */
function getSelectedTextNodes(selection: any): TextNode[] {
  const isBackward = selection.isBackward();
  const startPoint = isBackward ? selection.focus : selection.anchor;
  const endPoint = isBackward ? selection.anchor : selection.focus;

  const startNode = startPoint.getNode();
  const endNode = endPoint.getNode();

  const sizeOf = (n: TextNode) => n.getTextContentSize();

  if ($isTextNode(startNode) && $isTextNode(endNode)) {
    if (startNode === endNode) {
      const a = Math.min(startPoint.offset, endPoint.offset);
      const b = Math.max(startPoint.offset, endPoint.offset);
      if (a !== 0 || b !== sizeOf(startNode)) {
        startNode.splitText(a, b);
      }
    } else {
      const startOffset = startPoint.offset;
      if (startOffset !== 0 && startOffset !== sizeOf(startNode)) {
        startNode.splitText(startOffset);
      }

      const endOffset = endPoint.offset;
      if (endOffset !== 0 && endOffset !== sizeOf(endNode)) {
        endNode.splitText(endOffset);
      }
    }
  }

  return selection.getNodes().filter($isTextNode) as TextNode[];
}

function toggleFormatUniform(editor: LexicalEditor, format: Format) {
  editor.update(() => {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) return;

    // Cursor: Lexical toggle is correct
    if (selection.isCollapsed()) {
      selection.formatText(format);
      return;
    }

    // Range: "uniform toggle"
    const textNodes = getSelectedTextNodes(selection);
    if (textNodes.length === 0) return;

    const allHave = textNodes.every((n) => n.hasFormat(format));
    if (allHave) {
      textNodes.forEach((n) => removeFormat(n, format));
    } else {
      textNodes.forEach((n) => {
        if (!n.hasFormat(format)) addFormat(n, format);
      });
    }
  });
}

/* -------------------------------- Toolbar -------------------------------- */

function Toolbar({
  activeColor,
  setActiveColor,
}: {
  activeColor: string | null;
  setActiveColor: (color: string | null) => void;
}) {
  const [editor] = useLexicalComposerContext();
  const theme = useTheme();

  const [formats, setFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    list: false,
  });

  const readToolbarState = useCallback(
    (editorState: EditorState) => {
      editorState.read(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) {
          setFormats({
            bold: false,
            italic: false,
            underline: false,
            list: false,
          });
          return;
        }

        // list
        let inList = false;
        let node: LexicalNode | null = selection.anchor.getNode();
        while (node) {
          if ($isListNode(node)) {
            inList = true;
            break;
          }
          node = node.getParent();
        }

        // formats
        let bold = selection.hasFormat("bold");
        let italic = selection.hasFormat("italic");
        let underline = selection.hasFormat("underline");

        // For a range selection, make button "active" only if ALL selected text is formatted
        if (!selection.isCollapsed()) {
          const textNodes = selection
            .getNodes()
            .filter($isTextNode) as TextNode[];
          if (textNodes.length > 0) {
            bold = textNodes.every((n) => n.hasFormat("bold"));
            italic = textNodes.every((n) => n.hasFormat("italic"));
            underline = textNodes.every((n) => n.hasFormat("underline"));
          }
        }

        setFormats({ bold, italic, underline, list: inList });

        // color indicator (selection style is the least surprising)
        const selectionStyleColor = $getSelectionStyleValueForProperty(
          selection,
          "color",
          undefined
        );
        setActiveColor(selectionStyleColor ?? null);
      });
    },
    [setActiveColor]
  );

  // Keep toolbar synced (selection changes + editor updates)
  useEffect(() => {
    const sync = () => readToolbarState(editor.getEditorState());

    // initial sync
    sync();

    return mergeRegister(
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          sync();
          return false;
        },
        COMMAND_PRIORITY_LOW
      ),
      editor.registerUpdateListener(({ editorState }) => {
        readToolbarState(editorState);
      })
    );
  }, [editor, readToolbarState]);

  const toggleList = () => {
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;

      let node: LexicalNode | null = selection.anchor.getNode();
      while (node) {
        if ($isListNode(node)) {
          editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
          return;
        }
        node = node.getParent();
      }

      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
    });
  };

  const applyColor = (color: string | null) => {
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;
      const styles = color ? { color } : { color: theme.textPrimary };
      $patchStyleText(selection, styles);
    });

    // update indicator immediately (listeners will also update it)
    setActiveColor(color);
  };

  const activeButtonStyle = (isActive: boolean) => {
    if (!isActive) {
      return {
        backgroundColor: "transparent",
        color: "var(--theme-text-secondary)",
        boxShadow: "none",
        border: "1px solid transparent",
      } as const;
    }

    return {
      backgroundColor: "var(--theme-workspace)",
      color: "var(--theme-text-primary)",
      boxShadow: "0 1px 2px rgba(0, 0, 0, 0.08)",
    } as const;
  };

  return (
    <div className="sticky top-0 z-10 flex flex-wrap items-center gap-3 rounded-xl border px-4 py-3 shadow-sm backdrop-blur border-[var(--theme-border)] bg-[var(--theme-elevated)]">
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          toggleFormatUniform(editor, "bold");
        }}
        className="rounded-md px-2.5 py-1 text-sm font-medium"
        style={{
          ...activeButtonStyle(formats.bold),
          transition: "none !important",
        }}
        title="Bold"
      >
        <span className="font-semibold">B</span>
      </button>

      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          toggleFormatUniform(editor, "italic");
        }}
        className="rounded-md px-2.5 py-1 text-sm font-medium"
        style={{
          ...activeButtonStyle(formats.italic),
          transition: "none !important",
        }}
        title="Italic"
      >
        <span className="italic">I</span>
      </button>

      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          toggleFormatUniform(editor, "underline");
        }}
        className="rounded-md px-2.5 py-1 text-sm font-medium"
        style={{
          ...activeButtonStyle(formats.underline),
          transition: "none !important",
        }}
        title="Underline"
      >
        <span className="underline underline-offset-2">U</span>
      </button>

      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          toggleList();
        }}
        className="rounded-md px-2.5 py-1 text-sm font-medium"
        style={{
          ...activeButtonStyle(formats.list),
          transition: "none !important",
        }}
        title="Bullet List"
      >
        • List
      </button>

      <div className="h-5 w-px bg-[var(--theme-border)]" />

      <ColorPicker
        activeColor={activeColor}
        onColorChange={applyColor}
        disabled={false}
      />
    </div>
  );
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
