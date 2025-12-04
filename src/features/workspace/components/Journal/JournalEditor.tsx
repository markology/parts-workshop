"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ImpressionType } from "@/features/workspace/types/Impressions";
import { useThemeContext } from "@/state/context/ThemeContext";
import { NodeBackgroundColors } from "../../constants/Nodes";
import { User, SquareUserRound } from "lucide-react";

interface JournalEditorProps {
  content: string;
  onContentChange: (html: string) => void;
  readOnly?: boolean;
  nodeType?: ImpressionType | "part" | "tension" | "interaction";
  selectedSpeakers?: string[];
  onToggleSpeaker?: (speakerId: string) => void;
  partNodes?: Array<{ id: string; label: string }>;
}


const FONT_SIZE_OPTIONS = [
  { label: "Small", value: "1" },
  { label: "Normal", value: "3" },
  { label: "Large", value: "5" },
  { label: "Huge", value: "7" },
];

const PLACEHOLDER_TEXT = "Start writing your journal entry...";

type FormatState = {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  unorderedList: boolean;
};

export default function JournalEditor({
  content,
  onContentChange,
  readOnly = false,
  nodeType,
  selectedSpeakers = [],
  onToggleSpeaker,
  partNodes = [],
}: JournalEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isProgrammaticUpdate = useRef(false);
  const { darkMode } = useThemeContext();
  const [activeSpeaker, setActiveSpeaker] = useState<string | null>(null);
  
  // Convert HTML to plain text for storage (parseable string)
  const htmlToText = useCallback((html: string): string => {
    if (!html) return "";
    if (typeof window === "undefined") {
      // Server-side: simple regex strip
      return html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
    }
    const temp = document.createElement("div");
    temp.innerHTML = html;
    // Preserve line breaks from <br> and <p> tags
    const text = temp.innerText || temp.textContent || "";
    return text;
  }, []);

  const handleContentChange = useCallback(() => {
    if (readOnly) return;
    const rawHTML = editorRef.current?.innerHTML ?? "";
    // Convert HTML to plain text for storage
    const textContent = htmlToText(rawHTML);
    isProgrammaticUpdate.current = true;
    onContentChange(textContent);
  }, [onContentChange, readOnly, htmlToText]);
  
  // Get all available speakers including "?" and "self"
  const allAvailableSpeakers = useMemo(() => {
    const speakers: Array<{ id: string; label: string; isSelf: boolean; isUnknown: boolean }> = [
      { id: "self", label: "Self", isSelf: true, isUnknown: false },
      { id: "?", label: "?", isSelf: false, isUnknown: true },
      ...partNodes.map(part => ({ id: part.id, label: part.label, isSelf: false, isUnknown: false })),
    ];
    return speakers;
  }, [partNodes]);
  
  // Generate consistent color for each speaker
  const getSpeakerColor = useCallback((speakerId: string) => {
    if (speakerId === "self") {
      return darkMode ? "#3B82F6" : "#2563EB"; // Calm blue for Self
    }
    if (speakerId === "?") {
      return darkMode ? "#6B7280" : "#9CA3AF"; // Grey for Unknown
    }
    // Generate consistent color from ID
    let hash = 0;
    for (let i = 0; i < speakerId.length; i++) {
      hash = speakerId.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash % 360);
    const saturation = 65;
    const lightness = darkMode ? 55 : 50;
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  }, [darkMode]);
  
  // Handle speaker selection - inserts inline notation like "[Speaker Name:] "
  const handleSpeakerSelect = useCallback((speakerId: string) => {
    if (!editorRef.current || readOnly) return;
    
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      editorRef.current.focus();
      return;
    }
    
    const range = selection.getRangeAt(0);
    const speaker = allAvailableSpeakers.find(s => s.id === speakerId);
    const speakerLabel = speaker?.label || "Unknown";
    
    // Create inline notation span
    const span = document.createElement("span");
    span.style.cssText = `
      font-weight: 600;
      color: ${getSpeakerColor(speakerId)};
      margin-right: 4px;
    `;
    span.textContent = `[${speakerLabel}:] `;
    
    // Insert at cursor position
    range.deleteContents();
    range.insertNode(span);
    
    // Move cursor after the notation
    range.setStartAfter(span);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
    
    setActiveSpeaker(speakerId);
    editorRef.current.focus();
    handleContentChange();
  }, [readOnly, getSpeakerColor, allAvailableSpeakers, handleContentChange]);


  const [formats, setFormats] = useState<FormatState>({
    bold: false,
    italic: false,
    underline: false,
    unorderedList: false,
  });
  const [activeColor, setActiveColor] = useState("rgb(0, 0, 0)");
  const [activeFontSize, setActiveFontSize] = useState("3");

  const accentColor =
    (nodeType && NodeBackgroundColors[nodeType]) ||
    NodeBackgroundColors.default;

  const sanitizeHtml = useCallback(
    (rawHTML: string) => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(rawHTML, "text/html");

      doc.querySelectorAll("span").forEach((span) => {
        const color = span.style.color?.toLowerCase();
        if (
          color === "black" ||
          color === "#000000" ||
          color === "white" ||
          color === "#ffffff"
        ) {
          span.style.removeProperty("color");
        }
      });

      return doc.body.innerHTML;
    },
    []
  );

  // Debounced sanitization - only clean HTML when user stops typing
  const sanitizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const handleContentChangeWithSanitization = useCallback(() => {
    if (readOnly) return;
    const rawHTML = editorRef.current?.innerHTML ?? "";
    
    // Update immediately for responsiveness
    isProgrammaticUpdate.current = true;
    onContentChange(rawHTML);
    
    // Sanitize after a delay (only for cleanup, not blocking)
    if (sanitizeTimeoutRef.current) {
      clearTimeout(sanitizeTimeoutRef.current);
    }
    sanitizeTimeoutRef.current = setTimeout(() => {
      const cleanedHTML = sanitizeHtml(rawHTML);
      if (cleanedHTML !== rawHTML) {
        isProgrammaticUpdate.current = true;
        onContentChange(cleanedHTML);
      }
    }, 1000); // Sanitize 1 second after typing stops
  }, [onContentChange, readOnly, sanitizeHtml]);

  // Cleanup sanitization timeout on unmount
  useEffect(() => {
    return () => {
      if (sanitizeTimeoutRef.current) {
        clearTimeout(sanitizeTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!editorRef.current) return;
    if (isProgrammaticUpdate.current) {
      isProgrammaticUpdate.current = false;
      return;
    }
    // Only update if content actually changed and editor doesn't have focus
    // This prevents cursor jumping while typing
    if (editorRef.current.innerHTML !== content && document.activeElement !== editorRef.current) {
      editorRef.current.innerHTML = content || "";
    }
  }, [content]);

  const updateFormatState = useCallback(() => {
    const selection = document.getSelection();
    let color = "rgb(0, 0, 0)";

    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const parent = range.startContainer.parentElement;

      if (parent) {
        color = getComputedStyle(parent).color;
      }
    }

    const fontSize = document.queryCommandValue("fontSize") || "3";

    setFormats({
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
      underline: document.queryCommandState("underline"),
      unorderedList: document.queryCommandState("insertUnorderedList"),
    });

    setActiveColor(color);
    setActiveFontSize(fontSize);
  }, []);

  // Save and restore selection/cursor position
  const saveSelection = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || !editorRef.current) return null;

    const range = selection.getRangeAt(0);
    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(editorRef.current);
    preCaretRange.setEnd(range.startContainer, range.startOffset);
    
    const start = preCaretRange.toString().length;
    const end = start + range.toString().length;
    
    return { start, end };
  }, []);

  const restoreSelection = useCallback((savedSelection: { start: number; end: number } | null) => {
    if (!savedSelection || !editorRef.current) return;

    const selection = window.getSelection();
    if (!selection) return;

    const range = document.createRange();
    let charIndex = 0;
    let nodeStack: Node[] = [editorRef.current];
    let node: Node | undefined;
    let foundStart = false;
    let stop = false;

    while (!stop && (node = nodeStack.pop())) {
      if (node.nodeType === Node.TEXT_NODE) {
        const nextCharIndex = charIndex + (node.textContent?.length || 0);
        if (!foundStart && savedSelection.start >= charIndex && savedSelection.start <= nextCharIndex) {
          range.setStart(node, savedSelection.start - charIndex);
          foundStart = true;
        }
        if (foundStart && savedSelection.end >= charIndex && savedSelection.end <= nextCharIndex) {
          range.setEnd(node, savedSelection.end - charIndex);
          stop = true;
        }
        charIndex = nextCharIndex;
      } else {
        let i = node.childNodes.length;
        while (i--) {
          nodeStack.push(node.childNodes[i]);
        }
      }
    }

    selection.removeAllRanges();
    selection.addRange(range);
  }, []);

  const exec = useCallback(
    (command: string, value?: string) => {
      if (readOnly) return;
      editorRef.current?.focus();

      if (command === "foreColor" || command === "hiliteColor") {
        document.execCommand("styleWithCSS", false, "true");
      }

      document.execCommand(command, false, value);
      handleContentChange();
      updateFormatState();
    },
    [handleContentChange, readOnly, updateFormatState]
  );

  useEffect(() => {
    if (readOnly || !editorRef.current) return;

    const editor = editorRef.current;
    let rafId: number | null = null;
    
    const handleCursorChange = () => {
      // Cancel any pending animation frame
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      // Batch format state updates using requestAnimationFrame
      rafId = requestAnimationFrame(() => {
        updateFormatState();
        rafId = null;
      });
    };

    // Throttle keyup events - only update format state occasionally
    let keyupTimeout: NodeJS.Timeout | null = null;
    const handleKeyUp = () => {
      if (keyupTimeout) clearTimeout(keyupTimeout);
      keyupTimeout = setTimeout(handleCursorChange, 100); // Update format state 100ms after keyup
    };

    editor.addEventListener("keyup", handleKeyUp);
    editor.addEventListener("mouseup", handleCursorChange);
    editor.addEventListener("mousedown", () => {
      document.addEventListener("mouseup", handleCursorChange, { once: true });
    });

    return () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      if (keyupTimeout) {
        clearTimeout(keyupTimeout);
      }
      editor.removeEventListener("keyup", handleKeyUp);
      editor.removeEventListener("mouseup", handleCursorChange);
      editor.removeEventListener("mousedown", () => {
        document.removeEventListener("mouseup", handleCursorChange);
      });
    };
  }, [readOnly, updateFormatState]);

  const ToolbarButton = ({
    label,
    command,
    value,
    active,
    children,
  }: {
    label: string;
    command: string;
    value?: string;
    children?: React.ReactNode;
    active?: boolean;
  }) => (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault();
        exec(command, value);
      }}
      className={`rounded-md px-2.5 py-1 text-sm font-medium transition ${
        active
          ? darkMode
            ? "bg-slate-100 text-slate-900 shadow"
            : "bg-slate-900 text-white shadow"
          : darkMode
            ? "hover:bg-slate-800 text-slate-200"
            : "hover:bg-slate-200 text-slate-700"
      }`}
      title={label}
    >
      {children ?? label}
    </button>
  );

  const ColorButton = ({ color }: { color: string }) => (
    <button
      onMouseDown={(e) => {
        e.preventDefault();
        exec("foreColor", color);
        setActiveColor(color);
      }}
      className={`h-6 w-6 rounded-full border border-white/40 transition ${
        activeColor === color ? "ring-2 ring-offset-1 ring-offset-white" : ""
      }`}
      style={{ backgroundColor: color }}
      title={`Font color: ${color}`}
    />
  );

  return (
    <div className="flex h-full flex-col gap-4">
      {!readOnly && (
        <div
          className={`sticky top-0 z-10 flex flex-wrap items-center gap-3 rounded-xl border px-4 py-3 shadow-sm backdrop-blur ${
            darkMode
              ? "border-slate-700/80 bg-slate-900/80"
              : "border-slate-200 bg-white/90"
          }`}
        >
          <ToolbarButton label="Bold" command="bold" active={formats.bold}>
            <span className="font-semibold">B</span>
          </ToolbarButton>
          <ToolbarButton label="Italic" command="italic" active={formats.italic}>
            <span className="italic">I</span>
          </ToolbarButton>
          <ToolbarButton
            label="Underline"
            command="underline"
            active={formats.underline}
          >
            <span className="underline underline-offset-2">U</span>
          </ToolbarButton>
          <ToolbarButton
            label="Bulleted list"
            command="insertUnorderedList"
            active={formats.unorderedList}
          >
            • List
          </ToolbarButton>

          <div className="h-5 w-px bg-slate-200 dark:bg-slate-700" />

          <select
            value={activeFontSize}
            onChange={(e) => exec("fontSize", e.target.value)}
            className={`rounded-md border px-2 py-1 text-sm ${
              darkMode
                ? "border-slate-700 bg-slate-900 text-slate-200"
                : "border-slate-200 bg-white text-slate-700"
            }`}
            title="Font size"
          >
            {FONT_SIZE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-2">
            <ColorButton
              color={darkMode ? "rgb(255,255,255)" : "rgb(0,0,0)"}
            />
            <ColorButton color="rgb(229, 62, 62)" />
            <ColorButton color="rgb(56, 189, 248)" />
            <ColorButton color="rgb(34, 197, 94)" />
            <ColorButton color="rgb(250, 204, 21)" />
          </div>

          {!readOnly && onToggleSpeaker && (
            <>
              <div className="h-5 w-px bg-slate-200 dark:bg-slate-700" />
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs text-slate-500 font-medium">Assign to:</span>
                {allAvailableSpeakers.map((speaker) => {
                  const isActive = activeSpeaker === speaker.id;
                  const speakerColor = getSpeakerColor(speaker.id);
                  
                  return (
                    <button
                      key={speaker.id}
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleSpeakerSelect(speaker.id);
                      }}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                        isActive
                          ? "ring-2 ring-offset-2 scale-105"
                          : "hover:scale-102"
                      }`}
                      style={{
                        backgroundColor: isActive ? speakerColor : (darkMode ? "rgba(30, 41, 59, 0.8)" : "rgba(255, 255, 255, 0.9)"),
                        color: isActive ? "white" : (darkMode ? "rgb(203, 213, 225)" : "rgb(71, 85, 105)"),
                        borderColor: isActive ? speakerColor : (darkMode ? "rgba(148, 163, 184, 0.3)" : "rgba(148, 163, 184, 0.2)"),
                        boxShadow: isActive ? `0 4px 12px ${speakerColor}40` : "0 1px 3px rgba(0, 0, 0, 0.1)",
                      }}
                      title={`Start message as ${speaker.label}`}
                    >
                      {speaker.isSelf ? (
                        <User size={12} />
                      ) : speaker.isUnknown ? (
                        <span className="text-sm font-bold">?</span>
                      ) : (
                        <SquareUserRound size={12} />
                      )}
                      {speaker.label}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
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
            <div
              ref={editorRef}
              contentEditable={!readOnly}
              suppressContentEditableWarning
              className={`prose prose-slate w-full min-w-full max-w-none py-5 text-base leading-relaxed focus:outline-none focus-visible:ring-0 dark:prose-invert ${
                darkMode ? "text-slate-100" : "text-slate-800"
              }`}
              style={{ 
                whiteSpace: "pre-wrap", 
                caretColor: accentColor, 
                minHeight: "100%", 
                paddingLeft: "24px", 
                paddingRight: "24px",
                display: "flex",
                flexDirection: "column",
                gap: "0",
              }}
              onInput={handleContentChange}
              onBlur={handleContentChangeWithSanitization}
            />

            {!readOnly && (!content || content.length === 0) && (
              <div className="pointer-events-none absolute left-6 top-5 text-sm text-slate-400">
                {PLACEHOLDER_TEXT}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
