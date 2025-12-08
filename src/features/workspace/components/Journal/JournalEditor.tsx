"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { ImpressionType } from "@/features/workspace/types/Impressions";
import { useThemeContext } from "@/state/context/ThemeContext";
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
} from "lexical";
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
  content: string;
  onContentChange: (html: string) => void;
  readOnly?: boolean;
  nodeType?: ImpressionType | "part" | "tension" | "interaction";
  selectedSpeakers?: string[];
  onToggleSpeaker?: (speakerId: string) => void;
  partNodes?: Array<{ id: string; label: string }>;
}

const PLACEHOLDER_TEXT = "Start writing your journal entry...";

const theme = {
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
}: {
  onContentChange: (html: string) => void;
  readOnly: boolean;
}) {
  const [editor] = useLexicalComposerContext();

  return (
    <OnChangePlugin
      onChange={(editorState: EditorState) => {
        if (readOnly) return;
        editorState.read(() => {
          const htmlString = $generateHtmlFromNodes(editor, null);
          onContentChange(htmlString);
        });
      }}
    />
  );
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
  darkMode,
  activeColor,
  onColorChange,
}: {
  darkMode: boolean;
  activeColor: string | null;
  onColorChange: (color: string | null) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
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

  const displayColor = activeColor || "#000000";
  const needsWhiteText = isDarkColor(displayColor);

  return (
    <div className="relative" ref={pickerRef}>
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          setIsOpen(!isOpen);
        }}
        className={`relative h-8 w-8 rounded-md border-2 transition-all duration-200 ${
          isOpen
            ? darkMode
              ? "border-slate-500 bg-slate-800 shadow-md"
              : "border-slate-400 bg-slate-50 shadow-md"
            : darkMode
            ? "border-slate-700 hover:border-slate-600 hover:bg-slate-800/50"
            : "border-slate-300 hover:border-slate-400 hover:bg-slate-50/50"
        }`}
        style={{
          backgroundColor: displayColor,
        }}
        title="Text Color"
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className={`text-xs font-semibold ${
              needsWhiteText ? "text-white" : "text-slate-900"
            }`}
            style={{
              textShadow: needsWhiteText
                ? "0 1px 2px rgba(0,0,0,0.3)"
                : "none",
            }}
          >
            A
          </span>
        </div>
      </button>

      {isOpen && (
        <div
          className={`absolute top-full left-0 mt-2 z-50 rounded-xl border shadow-2xl backdrop-blur-sm p-3 min-w-[190px] ${
            darkMode
              ? "border-slate-700/70 bg-slate-900/95"
              : "border-slate-200/80 bg-white/95"
          }`}
          style={{
            boxShadow: darkMode
              ? "0 14px 42px rgba(0,0,0,0.45)"
              : "0 14px 42px rgba(0,0,0,0.18)",
          }}
        >
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
                      ? "ring-1 ring-offset-2 scale-105 shadow-md z-10"
                      : "hover:scale-105 hover:shadow-sm"
                  } ${
                    darkMode
                      ? activeColor === color
                        ? "border-white ring-white ring-offset-slate-900"
                        : "border-slate-700 hover:border-slate-500"
                      : activeColor === color
                      ? "border-slate-900 ring-slate-900 ring-offset-white"
                      : "border-slate-300 hover:border-slate-400"
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>

            <div className="pt-2 border-t border-slate-300/40 dark:border-slate-700/50">
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleColorSelect(null);
                }}
                className={`w-full rounded-md px-2.5 py-1.5 text-sm font-medium transition ${
                  darkMode
                    ? "hover:bg-slate-800 text-slate-200"
                    : "hover:bg-slate-200 text-slate-700"
                }`}
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
  darkMode,
  activeColor,
  setActiveColor,
}: {
  darkMode: boolean;
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

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState, prevEditorState }) => {
      let editorWasEmpty = false;
      let editorIsEmpty = false;

      prevEditorState.read(() => {
        const prevRoot = $getRoot();
        editorWasEmpty = prevRoot.getTextContent().trim().length === 0;
      });

      editorState.read(() => {
        const selection = $getSelection();
        const root = $getRoot();
        editorIsEmpty = root.getTextContent().trim().length === 0;

        if ($isRangeSelection(selection)) {
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

          setFormats({
            bold: selection.hasFormat("bold"),
            italic: selection.hasFormat("italic"),
            underline: selection.hasFormat("underline"),
            list: inList,
          });

          // 👉 Get current color from selection style (works for caret AND ranges)
          const color = $getSelectionStyleValueForProperty(
            selection,
            "color",
            null
          );
          setActiveColor(color || null);
        } else {
          // No selection: reset formats; leave color alone (color picker controls it)
          setFormats({
            bold: false,
            italic: false,
            underline: false,
            list: false,
          });
        }
      });

      // If content was just cleared (had text, now empty), reset style & indicator
      if (!editorWasEmpty && editorIsEmpty) {
        editor.update(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            $patchStyleText(selection, { color: null });
          }
        });
        setActiveColor(null);
      }
    });
  }, [editor, setActiveColor]);

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

  // Color via $patchStyleText (works for selection + caret "current style")
  const applyColor = (color: string | null) => {
    // 1) Update Lexical selection if it exists
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const styles = color ? { color } : { color: null };
        $patchStyleText(selection, styles);
      }
    });

    // 2) Always update the toolbar indicator, even if no selection (empty editor)
    setActiveColor(color);
  };

  return (
    <div
      className={`sticky top-0 z-10 flex flex-wrap items-center gap-3 rounded-xl border px-4 py-3 shadow-sm backdrop-blur ${
        darkMode
          ? "border-slate-700/80 bg-slate-900/80"
          : "border-slate-200 bg-white/90"
      }`}
    >
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          formatText("bold");
        }}
        className={`rounded-md px-2.5 py-1 text-sm font-medium transition ${
          formats.bold
            ? darkMode
              ? "bg-slate-100 text-slate-900 shadow"
              : "bg-slate-900 text-white shadow"
            : darkMode
            ? "hover:bg-slate-800 text-slate-200"
            : "hover:bg-slate-200 text-slate-700"
        }`}
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
        className={`rounded-md px-2.5 py-1 text-sm font-medium transition ${
          formats.italic
            ? darkMode
              ? "bg-slate-100 text-slate-900 shadow"
              : "bg-slate-900 text-white shadow"
            : darkMode
            ? "hover:bg-slate-800 text-slate-200"
            : "hover:bg-slate-200 text-slate-700"
        }`}
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
        className={`rounded-md px-2.5 py-1 text-sm font-medium transition ${
          formats.underline
            ? darkMode
              ? "bg-slate-100 text-slate-900 shadow"
              : "bg-slate-900 text-white shadow"
            : darkMode
            ? "hover:bg-slate-800 text-slate-200"
            : "hover:bg-slate-200 text-slate-700"
        }`}
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
        className={`rounded-md px-2.5 py-1 text-sm font-medium transition ${
          formats.list
            ? darkMode
              ? "bg-slate-100 text-slate-900 shadow"
              : "bg-slate-900 text-white shadow"
            : darkMode
            ? "hover:bg-slate-800 text-slate-200"
            : "hover:bg-slate-200 text-slate-700"
        }`}
        title="Bullet List"
      >
        • List
      </button>

      <div className="h-5 w-px bg-slate-200 dark:bg-slate-700" />

      <ColorPicker
        darkMode={darkMode}
        activeColor={activeColor}
        onColorChange={applyColor}
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
  const { darkMode } = useThemeContext();
  const [activeColor, setActiveColor] = useState<string | null>(null);

  const accentColor = useMemo(() => {
    return (
      (nodeType && NodeBackgroundColors[nodeType]) ||
      NodeBackgroundColors.default
    );
  }, [nodeType]);

  const initialConfig = {
    namespace: "JournalEditor",
    theme,
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
          <Toolbar
            darkMode={darkMode}
            activeColor={activeColor}
            setActiveColor={setActiveColor}
          />
        )}
        <div
          className={`relative flex-1 overflow-hidden rounded-2xl border shadow-inner flex ${
            darkMode
              ? "border-slate-700 bg-slate-900/80"
              : "border-slate-200 bg-white"
          }`}
          style={{
            boxShadow: `0 0 0 1.5px ${accentColor}20`,
          }}
        >
          <div className="flex-1 relative overflow-hidden">
            <div className="h-full relative overflow-y-auto">
              <RichTextPlugin
                contentEditable={
                  <ContentEditable
                    className={`prose prose-slate w-full min-w-full max-w-none py-5 text-base leading-relaxed focus:outline-none focus-visible:ring-0 dark:prose-invert ${
                      darkMode ? "text-slate-100" : "text-slate-800"
                    }`}
                    style={{
                      whiteSpace: "pre-wrap",
                      caretColor: accentColor,
                      minHeight: "100%",
                      paddingLeft: "24px",
                      paddingRight: "24px",
                    }}
                  />
                }
                placeholder={
                  <div className="pointer-events-none absolute left-6 top-5 text-sm text-slate-400">
                    {PLACEHOLDER_TEXT}
                  </div>
                }
                ErrorBoundary={({ children }) => <>{children}</>}
              />
              <HistoryPlugin />
              <ListPlugin />
              <ChangeHandler
                onContentChange={onContentChange}
                readOnly={readOnly}
              />
            </div>
          </div>
        </div>
      </div>
    </LexicalComposer>
  );
}
