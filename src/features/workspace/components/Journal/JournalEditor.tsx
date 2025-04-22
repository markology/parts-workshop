"use client";

import { useThemeContext } from "@/context/ThemeContext";
import { useEffect, useRef, useState } from "react";

interface JournalEditorProps {
  initialContent?: string;
  onSave?: (html: string) => void;
  readOnly?: boolean;
  title?: string;
}

export default function JournalEditor({
  initialContent = "",
  onSave,
  readOnly = false,
  title = "Scratch",
}: JournalEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const { darkMode } = useThemeContext();
  const [content, setContent] = useState(initialContent);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");

  const [formats, setFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    unorderedList: false,
  });

  // --- Rich Text Commands ---
  const exec = (command: string, value?: string) => {
    if (readOnly) return;
    editorRef.current?.focus();

    if (command === "foreColor" || command === "hiliteColor") {
      document.execCommand("styleWithCSS", false, "true");
    }

    document.execCommand(command, false, value);
    setContent(editorRef.current?.innerHTML || "");
    updateFormatState();
  };

  const updateFormatState = () => {
    setFormats({
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
      underline: document.queryCommandState("underline"),
      unorderedList: document.queryCommandState("insertUnorderedList"),
    });
  };

  // --- Debounced Save ---
  useEffect(() => {
    if (readOnly || !onSave) return;
    const timeout = setTimeout(() => {
      if (content) {
        setSaveStatus("saving");
        try {
          onSave(content);
          setSaveStatus("saved");
        } catch {
          setSaveStatus("error");
        }
      }
    }, 2000);
    return () => clearTimeout(timeout);
  }, [content]);

  // --- Initial DOM hydration ---
  useEffect(() => {
    if (editorRef.current && initialContent && !readOnly) {
      editorRef.current.innerHTML = initialContent;
    }
  }, [initialContent, readOnly]);

  useEffect(() => {
    if (!readOnly) {
      document.addEventListener("selectionchange", updateFormatState);
      return () =>
        document.removeEventListener("selectionchange", updateFormatState);
    }
  }, [readOnly]);

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
      className={`px-2 py-1 border rounded text-sm transition ${
        active ? (darkMode ? "bg-gray-100" : "bg-black") : "hover:bg-gray-300"
      }`}
      title={label}
    >
      <span className={active ? (darkMode ? "text-black" : "text-white") : ""}>
        {children || label}
      </span>
    </button>
  );

  const ColorButton = ({ color }: { color: string }) => (
    <button
      onMouseDown={(e) => {
        e.preventDefault();
        exec("foreColor", color);
      }}
      className="w-6 h-6 rounded-full border border-black"
      style={{ backgroundColor: color }}
      title={`Font color: ${color}`}
    />
  );

  return (
    <div
      id="journal-editor"
      className="max-w-2xl mx-auto space-y-6 p-4 shadow-md rounded h-full flex flex-col"
    >
      <p>{title}</p>
      {!readOnly && (
        <div className="flex flex-wrap items-center gap-2 border-b pb-3 sticky top-0 z-10">
          <ToolbarButton label="Bold" command="bold" active={formats.bold}>
            <b>B</b>
          </ToolbarButton>
          <ToolbarButton
            label="Italic"
            command="italic"
            active={formats.italic}
          >
            <i>I</i>
          </ToolbarButton>
          <ToolbarButton
            label="Underline"
            command="underline"
            active={formats.underline}
          >
            <u>U</u>
          </ToolbarButton>
          <ToolbarButton
            label="List"
            command="insertUnorderedList"
            active={formats.unorderedList}
          >
            • List
          </ToolbarButton>

          <select
            onChange={(e) => exec("fontSize", e.target.value)}
            className="border px-2 py-1 rounded text-sm"
            title="Font Size"
          >
            <option value="1">Small</option>
            <option selected value="3">
              Normal
            </option>
            <option value="5">Large</option>
            <option value="7">Huge</option>
          </select>

          <div className="flex items-center gap-1 ml-4">
            <ColorButton color={`${darkMode ? "#ffffff" : "#000000"}`} />
            <ColorButton color="#ff0000" />
            <ColorButton color="#007bff" />
            <ColorButton color="#28a745" />
            <ColorButton color="#ffc107" />
          </div>
        </div>
      )}

      {/* Editable Area */}
      <div className="relative flex-1 overflow-auto">
        <div
          ref={editorRef}
          contentEditable={!readOnly}
          suppressContentEditableWarning
          className="min-h-[250px] border rounded p-4 focus:outline-none"
          style={{ whiteSpace: "pre-wrap" }}
          onInput={() => setContent(editorRef.current?.innerHTML || "")}
          dangerouslySetInnerHTML={readOnly ? { __html: content } : undefined}
        />
        {!readOnly && content === "" && (
          <div className="absolute top-4 left-4 text-gray-400 pointer-events-none">
            Start writing your journal entry...
          </div>
        )}
      </div>

      {/* Save status */}
      {!readOnly && (
        <div className="text-right text-sm text-gray-500">
          {saveStatus === "saving" && "Saving..."}
          {saveStatus === "saved" && "Saved"}
          {saveStatus === "error" && "Error saving"}
        </div>
      )}
      {!readOnly && (
        <div className="flex justify-end">
          <button
            id="save-entry"
            onClick={() => {
              setSaveStatus("saving");
              try {
                onSave?.(content);
                setSaveStatus("saved");
              } catch {
                setSaveStatus("error");
              }
            }}
            className="px-4 py-2 rounded shadow hover:bg-gray-300 border"
          >
            Save Entry
          </button>
        </div>
      )}
    </div>
  );
}
