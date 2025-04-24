"use client";

import { useThemeContext } from "@/context/ThemeContext";
import { useCallback, useEffect, useRef, useState } from "react";
import Utilities from "../Utilities/Utilities";
import { Check, LoaderCircle, Save, SaveAll } from "lucide-react";
import { ImpressionType } from "@/types/Impressions";
import { NodeBackgroundColors } from "../../constants/Nodes";

interface JournalEditorProps {
  initialContent?: string;
  onSave?: (html: string) => void;
  readOnly?: boolean;
  title?: string;
  nodeType?: ImpressionType | "part" | "conflict";
  isLoading: boolean; // ✅ renamed for clarity
}

export default function JournalEditor({
  initialContent = "",
  onSave,
  readOnly = false,
  title = "Scratch",
  nodeType,
}: // isLoading,
JournalEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const { darkMode } = useThemeContext();
  const [content, setContent] = useState(initialContent);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error" | "cooldown"
  >("idle");
  const [hasEditorMounted, setHasEditorMounted] = useState(false);
  const [activeColor, setActiveColor] = useState("default");
  const [activeFontSize, setActiveFontSize] = useState("3"); // Default to "Normal"
  const [isHoveringSave, setIsHoveringSave] = useState(false);
  // Set initial content from prop on mount/update
  useEffect(() => {
    if (!readOnly && editorRef.current && initialContent) {
      editorRef.current.innerHTML = initialContent;
      setContent(initialContent); // keep state in sync
    }
  }, [initialContent, readOnly]);

  const [formats, setFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    unorderedList: false,
  });

  const updateFormatState = useCallback(() => {
    const selection = document.getSelection();
    let color = "default";

    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const parent = range.startContainer.parentElement;

      if (parent) {
        const computedColor = getComputedStyle(parent).color;
        color = computedColor;
      }
    }

    const fontSize = document.queryCommandValue("fontSize");

    setFormats({
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
      underline: document.queryCommandState("underline"),
      unorderedList: document.queryCommandState("insertUnorderedList"),
    });

    setActiveColor(color);
    setActiveFontSize(fontSize); // ➕ add this line
  }, []);

  // --- Rich Text Commands ---
  const exec = useCallback(
    (command: string, value?: string) => {
      if (readOnly) return;
      editorRef.current?.focus();

      if (command === "foreColor" || command === "hiliteColor") {
        document.execCommand("styleWithCSS", false, "true");
      }

      document.execCommand(command, false, value);
      setContent(editorRef.current?.innerHTML || "");
      updateFormatState();
    },
    [readOnly, updateFormatState]
  );

  // --- Debounced Save ---
  // useEffect(() => {
  //   if (readOnly || !onSave) return;
  //   const timeout = setTimeout(() => {
  //     if (content) {
  //       setSaveStatus("saving");
  //       try {
  //         onSave(content);
  //         setSaveStatus("saved");
  //       } catch {
  //         setSaveStatus("error");
  //       }
  //     }
  //   }, 2000);
  //   return () => clearTimeout(timeout);
  // }, [content]);

  // --- Initial DOM hydration ---
  useEffect(() => {
    if (editorRef.current && initialContent && !readOnly) {
      editorRef.current.innerHTML = initialContent;
    }
  }, [initialContent, readOnly]);

  useEffect(() => {
    if (!hasEditorMounted && editorRef?.current) {
      setHasEditorMounted(true);
    }
  }, [editorRef?.current]);

  useEffect(() => {
    if (readOnly || !editorRef.current) return;

    const editor = editorRef.current;
    const handleCursorChange = () => {
      requestAnimationFrame(updateFormatState); // ensures DOM is fully updated
    };

    // editor.addEventListener("mouseup", handleCursorChange);
    editor.addEventListener("keyup", handleCursorChange);
    editor.addEventListener("mousedown", () => {
      // handle case where you click inside but don’t release yet
      document.addEventListener("mouseup", handleCursorChange, { once: true });
    });

    return () => {
      editor.removeEventListener("mouseup", handleCursorChange);
      editor.removeEventListener("keyup", handleCursorChange);
      editor.removeEventListener("mousedown", () => {
        document.removeEventListener("mouseup", handleCursorChange);
      });
    };
  }, [hasEditorMounted, readOnly]);

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
      className={`px-2 py-1 rounded text-sm transition ${
        active
          ? darkMode
            ? "bg-gray-100 shadow-[var(--box-shadow)]"
            : "bg-black"
          : "hover:bg-gray-300"
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
        setActiveColor(color);
      }}
      className={`
        w-6 h-6 rounded-full transition-transform duration-50 ease-in-out 
         
        ${activeColor === color ? "scale-140" : "hover:scale-115 scale-100"}
      `}
      style={{ backgroundColor: color }}
      title={`Font color: ${color}`}
    />
  );
  return (
    <div
      id="journal-editor"
      className="max-w-2xl mx-auto space-y-6 p-4 shadow-md rounded h-full flex flex-col"
    >
      <div className="flex flex-row justify-between">
        <p className="text-[20px] fit-content">{title}</p>
        <span
          className={`
            bg-white px-2.5 py-px rounded-lg text-sm flex items-center
            ${nodeType ? "" : "bg-white"}
          `}
          style={{
            background: nodeType ? NodeBackgroundColors[nodeType] : "white",
          }}
        >
          {nodeType || "global"}
        </span>
      </div>
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
            value={activeFontSize}
          >
            <option value="1">Small</option>
            <option selected value="3">
              Normal
            </option>
            <option value="5">Large</option>
            <option value="7">Huge</option>
          </select>

          <div className="flex items-center gap-[10px] ml-4">
            <ColorButton
              color={`${darkMode ? "rgb(255, 255, 255)" : "rgb(0, 0, 0)"}`}
            />
            <ColorButton color="rgb(255, 0, 0)" />
            <ColorButton color="rgb(0, 123, 255)" />
            <ColorButton color="rgb(40, 167, 69)" />
            <ColorButton color="rgb(255, 193, 7)" />
          </div>
        </div>
      )}

      {/* Editable Area */}
      <div className="relative overflow-auto h-max-[calc(100vh-238px)]">
        <div
          ref={editorRef}
          contentEditable={!readOnly}
          suppressContentEditableWarning
          className="min-h-[250px] border rounded p-4 focus:outline-none"
          style={{ whiteSpace: "pre-wrap" }}
          onInput={() => {
            const rawHTML = editorRef.current?.innerHTML || "";
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
                span.classList.add("text-default");
              }
            });

            const cleanedHTML = doc.body.innerHTML;
            setContent(cleanedHTML);
          }}
          dangerouslySetInnerHTML={readOnly ? { __html: content } : undefined}
        />
        {!readOnly && content === "" && (
          <div className="absolute top-4 left-4 text-gray-400 pointer-events-none">
            Start writing your journal entry...
          </div>
        )}
      </div>
      {/* {!readOnly && (
        <div className="text-right text-sm text-gray-500">
          {saveStatus === "saving" && "Saving..."}
          {saveStatus === "saved" && "Saved"}
          {saveStatus === "error" && "Error saving"}
        </div>
      )} */}
      {!readOnly && (
        <div className="flex justify-end">
          <button
            id="save-entry"
            onMouseOver={() => setIsHoveringSave(true)}
            onMouseLeave={() => setIsHoveringSave(false)}
            className="px-4 py-2 rounded shadow-[0px_2px_3px_0px_#0a2f57] text-white hover:text-white bg-[#1586fd] hover:bg-[#155aa3] flex gap-[12px] align-center"
            style={{ color: "white" }}
            onClick={() => {
              setSaveStatus("saving");
              const spinTimeout = setTimeout(() => {
                setSaveStatus("saved");
                setTimeout(() => {
                  setSaveStatus("idle");
                }, 1000);
              }, 1000);

              try {
                onSave?.(content);
              } catch {
                clearTimeout(spinTimeout);
                setSaveStatus("error");
              }
            }}
          >
            <span className="flex items-center gap-3">
              {saveStatus === "saving" && (
                <LoaderCircle
                  className="animate-spin"
                  color="white"
                  strokeWidth={2}
                  size={20}
                />
              )}
              {saveStatus === "saved" && (
                <Check color="white" strokeWidth={2} size={20} />
              )}
              {saveStatus === "idle" && isHoveringSave && (
                <SaveAll color="white" strokeWidth={2} size={20} />
              )}
              {saveStatus === "idle" && !isHoveringSave && (
                <Save color="white" strokeWidth={2} size={20} />
              )}
            </span>
            Save Entry
          </button>
        </div>
      )}

      <Utilities />
    </div>
  );
}
