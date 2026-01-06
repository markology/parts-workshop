"use client";

import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { ImpressionType } from "@/features/workspace/types/Impressions";
import { useTheme } from "@/features/workspace/hooks/useTheme";
import { NodeBackgroundColors } from "../../constants/Nodes";

// Lexical imports
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

import {
  EditorState,
  $getSelection,
  $isRangeSelection,
  $getRoot,
  $createParagraphNode,
  TextNode,
  $isTextNode,
  LexicalNode,
} from "lexical";
import {
  $patchStyleText,
  $getSelectionStyleValueForProperty,
} from "@lexical/selection";
import { $generateHtmlFromNodes, $generateNodesFromDOM } from "@lexical/html";
import {
  ListNode,
  ListItemNode,
  INSERT_UNORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
  $isListNode,
} from "@lexical/list";

interface JournalEditorProps {
  content: string;
  onContentChange: (html: string) => void;
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
    nested: {
      listitem: "list-none",
    },
    ol: "list-decimal",
    ul: "list-disc",
    listitem: "ml-4",
  },
};

function ChangeHandler({
  onContentChange,
  readOnly,
  onClearFormatting,
}: {
  onContentChange: (html: string) => void;
  readOnly: boolean;
  onClearFormatting?: () => void;
}) {
  const [editor] = useLexicalComposerContext();
  const previousTextContentRef = useRef<string>("");

  return (
    <OnChangePlugin
      onChange={(editorState: EditorState) => {
        if (readOnly) return;
        editorState.read(() => {
          const root = $getRoot();
          const textContent = root.getTextContent();
          const htmlString = $generateHtmlFromNodes(editor, null);

          // Check if editor is now empty (was not empty before)
          const wasNotEmpty = previousTextContentRef.current.trim().length > 0;
          const isNowEmpty = textContent.trim().length === 0;

          if (wasNotEmpty && isNowEmpty) {
            // All text was deleted - clear all formatting by resetting to clean empty state
            editor.update(
              () => {
                // Check if we're in a list and remove it
                const selection = $getSelection();
                if ($isRangeSelection(selection)) {
                  const anchor = selection.anchor;
                  let node = anchor.getNode();
                  while (node) {
                    if ($isListNode(node)) {
                      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
                      break;
                    }
                    const parent = node.getParent();
                    if (!parent) break;
                    node = parent;
                  }
                }

                // Clear the root and create a fresh empty paragraph with no formatting
                root.clear();
                const parser = new DOMParser();
                const dom = parser.parseFromString("<p></p>", "text/html");
                const nodes = $generateNodesFromDOM(editor, dom);
                root.append(...nodes);
              },
              { discrete: true }
            );

            // Notify parent to clear active color in toolbar
            onClearFormatting?.();
          }

          previousTextContentRef.current = textContent;
          onContentChange(htmlString);
        });
      }}
    />
  );
}

// Plugin to apply default theme color when editor selection has no color style
function DefaultColorPlugin({ defaultColor }: { defaultColor: string }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    // Use update listener to ensure selection always has default color when no explicit color is set
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection) && selection.isCollapsed()) {
          // Check if current selection has no color style
          const currentColor = $getSelectionStyleValueForProperty(
            selection,
            "color"
          );
          if (!currentColor) {
            // Apply default color in a separate update to avoid read/write conflict
            setTimeout(() => {
              editor.update(() => {
                const currentSelection = $getSelection();
                if (
                  $isRangeSelection(currentSelection) &&
                  currentSelection.isCollapsed()
                ) {
                  const color = $getSelectionStyleValueForProperty(
                    currentSelection,
                    "color"
                  );
                  if (!color) {
                    $patchStyleText(currentSelection, { color: defaultColor });
                  }
                }
              });
            }, 0);
          }
        }
      });
    });
  }, [editor, defaultColor]);

  return null;
}

function ContentSyncPlugin({ content }: { content: string }) {
  const [editor] = useLexicalComposerContext();
  const previousContentRef = useRef<string>("");
  const isUpdatingRef = useRef<boolean>(false);

  useEffect(() => {
    // Skip if we're already updating or content hasn't changed
    if (isUpdatingRef.current || content === previousContentRef.current) return;

    // Check if editor content already matches (prevents unnecessary updates)
    let shouldUpdate = true;
    editor.getEditorState().read(() => {
      const currentHtml = $generateHtmlFromNodes(editor, null);
      if (currentHtml === content || (currentHtml === "<p></p>" && !content)) {
        shouldUpdate = false;
        previousContentRef.current = content;
      }
    });

    if (!shouldUpdate) return;

    // Update editor with new content
    isUpdatingRef.current = true;
    editor.update(
      () => {
        const parser = new DOMParser();
        const dom = parser.parseFromString(content || "<p></p>", "text/html");
        const nodes = $generateNodesFromDOM(editor, dom);
        const root = $getRoot();
        root.clear();
        root.append(...nodes);
      },
      { discrete: true }
    );

    // Reset flag after update completes
    setTimeout(() => {
      isUpdatingRef.current = false;
      previousContentRef.current = content;
    }, 0);
  }, [content, editor]);

  return null;
}

// Preset colors for quick selection
const PRESET_COLORS = [
  "#000000", // Black
  "#FFFFFF", // White
  "#EF4444", // Red
  "#3B82F6", // Blue
  "#10B981", // Green
  "#F59E0B", // Yellow/Orange
  "#8B5CF6", // Purple
  "#EC4899", // Pink
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

  const handleColorSelect = (color: string | null) => {
    if (disabled) return;
    onColorChange(color);
    setIsOpen(false);
  };

  // Helper to determine if color is dark (needs white text)
  const isDarkColor = (color: string | null): boolean => {
    if (!color) return true; // Default to dark
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
          if (!disabled) {
            setIsOpen(!isOpen);
          }
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
        onMouseEnter={(e) => {
          if (!disabled && !isOpen) {
            e.currentTarget.style.opacity = "0.9";
          }
        }}
        onMouseLeave={(e) => {
          if (!disabled && !isOpen) {
            e.currentTarget.style.opacity = "1";
          }
        }}
        title="Text Color"
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className={`text-xs font-semibold ${
              needsWhiteText ? "text-white" : "text-slate-900"
            }`}
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
                    handleColorSelect(color);
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
                  onMouseEnter={(e) => {
                    if (activeColor !== color) {
                      e.currentTarget.style.borderColor = "var(--theme-accent)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeColor !== color) {
                      e.currentTarget.style.borderColor = "var(--theme-border)";
                    }
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
                  handleColorSelect(null);
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

function Toolbar({
  activeColor,
  setActiveColor,
}: {
  activeColor: string | null;
  setActiveColor: (color: string | null) => void;
}) {
  const [editor] = useLexicalComposerContext();
  const [formats, setFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    list: false,
  });

  // Helper function to update formatting state from editor state
  const updateFormattingFromEditorState = useCallback(
    (editorState: EditorState) => {
      editorState.read(() => {
        const selection = $getSelection();

        if ($isRangeSelection(selection)) {
          const anchorNode = selection.anchor.getNode();
          // Check if caret/selection is in a list
          const anchor = selection.anchor;
          let inList = false;
          let node = anchor.getNode();
          while (node) {
            if ($isListNode(node)) {
              inList = true;
              break;
            }
            const parent = node.getParent();
            if (!parent) break;
            node = parent;
          }

          const selectionStyleColor = $getSelectionStyleValueForProperty(
            selection,
            "color",
            undefined
          );

          // Read color from text node if available
          let effectiveColor: string | null = null;

          const readColorFromStyleString = (
            style: string | null | undefined
          ) => {
            if (!style) return null;
            const match = style.match(
              /(?:^|;)\s*color\s*:\s*([^;]+)\s*(?:;|$)/i
            );
            return match?.[1]?.trim() ?? null;
          };

          if (selection.isCollapsed()) {
            // Try the node the caret is in.
            if ($isTextNode(anchorNode)) {
              const fromNode = readColorFromStyleString(anchorNode.getStyle());
              if (fromNode) {
                effectiveColor = fromNode;
              }
            }

            // If caret is at an element boundary, check nearest text neighbors.
            if (!effectiveColor) {
              const tryNeighbor = (node: LexicalNode | null | undefined) => {
                if ($isTextNode(node)) {
                  return readColorFromStyleString(
                    (node as TextNode).getStyle()
                  );
                }
                return null;
              };

              const prev = (anchorNode as any)?.getPreviousSibling?.();
              const next = (anchorNode as any)?.getNextSibling?.();
              const fromPrev = tryNeighbor(prev);
              const fromNext = tryNeighbor(next);
              if (fromPrev) {
                effectiveColor = fromPrev;
              } else if (fromNext) {
                effectiveColor = fromNext;
              }
            }
          }

          if (!effectiveColor) {
            effectiveColor = selectionStyleColor ?? null;
          }

          // Compute effective formats
          let effectiveBold = selection.hasFormat("bold");
          let effectiveItalic = selection.hasFormat("italic");
          let effectiveUnderline = selection.hasFormat("underline");

          if (selection.isCollapsed()) {
            const readFormatsFromNode = (
              node: LexicalNode | null | undefined
            ) => {
              if (!$isTextNode(node)) return null;
              const t = node as TextNode;
              return {
                bold: t.hasFormat("bold"),
                italic: t.hasFormat("italic"),
                underline: t.hasFormat("underline"),
              };
            };

            const fromAnchor = readFormatsFromNode(anchorNode);
            if (fromAnchor) {
              effectiveBold = fromAnchor.bold;
              effectiveItalic = fromAnchor.italic;
              effectiveUnderline = fromAnchor.underline;
            } else {
              const prev = anchorNode.getPreviousSibling();
              const next = anchorNode.getNextSibling();
              const fromPrev = readFormatsFromNode(prev);
              const fromNext = readFormatsFromNode(next);
              if (fromPrev) {
                effectiveBold = fromPrev.bold;
                effectiveItalic = fromPrev.italic;
                effectiveUnderline = fromPrev.underline;
              } else if (fromNext) {
                effectiveBold = fromNext.bold;
                effectiveItalic = fromNext.italic;
                effectiveUnderline = fromNext.underline;
              }
            }
          }

          setFormats({
            bold: effectiveBold,
            italic: effectiveItalic,
            underline: effectiveUnderline,
            list: inList,
          });

          setActiveColor(effectiveColor || null);
        } else {
          // No selection: reset formats
          setFormats({
            bold: false,
            italic: false,
            underline: false,
            list: false,
          });
        }
      });
    },
    [setActiveColor]
  );

  // Listen for editor state updates
  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      setTimeout(() => {
        const latestState = editor.getEditorState();
        updateFormattingFromEditorState(latestState);
      }, 0);
    });
  }, [editor, updateFormattingFromEditorState]);

  const formatText = (format: "bold" | "italic" | "underline") => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        selection.formatText(format);
      }
    });
  };

  const toggleList = () => {
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;

      const anchor = selection.anchor;
      let node = anchor.getNode();
      while (node) {
        if ($isListNode(node)) {
          editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
          return;
        }
        const parent = node.getParent();
        if (!parent) break;
        node = parent;
      }
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
    });
  };

  const theme = useTheme();
  const applyColor = (color: string | null) => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        // When color is null, use theme text color as default
        const styles = color ? { color } : { color: theme.textPrimary };
        $patchStyleText(selection, styles);
      }
    });

    // Always update the toolbar indicator, even if no selection (empty editor)
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
          formatText("bold");
        }}
        className="rounded-md px-2.5 py-1 text-sm font-medium"
        style={{
          ...activeButtonStyle(formats.bold),
          transition: "none !important",
        }}
        onMouseEnter={(e) => {
          if (!formats.bold) {
            e.currentTarget.style.backgroundColor = "var(--theme-button-hover)";
            e.currentTarget.style.color = "var(--theme-text-primary)";
          }
        }}
        onMouseLeave={(e) => {
          if (!formats.bold) {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.color = "var(--theme-text-secondary)";
          }
        }}
        title="Bold"
      >
        <span className="font-semibold">B</span>
      </button>

      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          formatText("italic");
        }}
        className="rounded-md px-2.5 py-1 text-sm font-medium"
        style={{
          ...activeButtonStyle(formats.italic),
          transition: "none !important",
        }}
        onMouseEnter={(e) => {
          if (!formats.italic) {
            e.currentTarget.style.backgroundColor = "var(--theme-button-hover)";
            e.currentTarget.style.color = "var(--theme-text-primary)";
          }
        }}
        onMouseLeave={(e) => {
          if (!formats.italic) {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.color = "var(--theme-text-secondary)";
          }
        }}
        title="Italic"
      >
        <span className="italic">I</span>
      </button>

      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          formatText("underline");
        }}
        className="rounded-md px-2.5 py-1 text-sm font-medium"
        style={{
          ...activeButtonStyle(formats.underline),
          transition: "none !important",
        }}
        onMouseEnter={(e) => {
          if (!formats.underline) {
            e.currentTarget.style.backgroundColor = "var(--theme-button-hover)";
            e.currentTarget.style.color = "var(--theme-text-primary)";
          }
        }}
        onMouseLeave={(e) => {
          if (!formats.underline) {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.color = "var(--theme-text-secondary)";
          }
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
        onMouseEnter={(e) => {
          if (!formats.list) {
            e.currentTarget.style.backgroundColor = "var(--theme-button-hover)";
            e.currentTarget.style.color = "var(--theme-text-primary)";
          }
        }}
        onMouseLeave={(e) => {
          if (!formats.list) {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.color = "var(--theme-text-secondary)";
          }
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

export default function JournalEditor({
  content,
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
              /* Override prose default text color - only apply to elements without inline color style */
              .prose {
                color: var(--theme-text-primary);
              }
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
              {!readOnly && (
                <DefaultColorPlugin defaultColor={theme.textPrimary} />
              )}
              <ContentSyncPlugin content={content} />
              <ChangeHandler
                onContentChange={onContentChange}
                readOnly={readOnly}
                onClearFormatting={() => setActiveColor(null)}
              />
            </div>
          </div>
        </div>
      </div>
    </LexicalComposer>
  );
}
