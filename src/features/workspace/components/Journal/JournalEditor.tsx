"use client";

import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { ImpressionType } from "@/features/workspace/types/Impressions";
import { useThemeContext } from "@/state/context/ThemeContext";
import { useTheme } from "@/features/workspace/hooks/useTheme";
import { NodeBackgroundColors } from "../../constants/Nodes";
import { SquareUserRound, Plus, ChevronDown, X } from "lucide-react";

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
  $createTextNode,
  $createParagraphNode,
  $insertNodes,
  $createRangeSelection,
  $setSelection,
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
  $handleListInsertParagraph,
  $isListItemNode,
  $isListNode,
} from "@lexical/list";
import { INSERT_PARAGRAPH_COMMAND, KEY_ENTER_COMMAND, KEY_BACKSPACE_COMMAND, KEY_DELETE_COMMAND } from "lexical";
import {
  SpeakerLineNode,
  $createSpeakerLineNode,
  $isSpeakerLineNode,
} from "./SpeakerLineNode";

interface JournalEditorProps {
  content: string;
  onContentChange: (html: string) => void;
  readOnly?: boolean;
  nodeType?: ImpressionType | "part" | "tension" | "interaction";
  selectedSpeakers?: string[];
  activeSpeaker?: string | null;
  onToggleSpeaker?: (speakerId: string) => void;
  partNodes?: Array<{ id: string; label: string }>;
  allPartNodes?: Array<{ id: string; label: string }>;
  nodeId?: string;
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
            editor.update(() => {
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
              // Use HTML parsing to ensure proper structure
              root.clear();
              const parser = new DOMParser();
              const dom = parser.parseFromString("<p></p>", "text/html");
              const nodes = $generateNodesFromDOM(editor, dom);
              root.append(...nodes);
              
              // Set selection to the new paragraph and clear any formatting
              const firstChild = root.getFirstChild();
              if (firstChild) {
                const rangeSelection = $createRangeSelection();
                rangeSelection.anchor.set(firstChild.getKey(), 0, "element");
                rangeSelection.focus.set(firstChild.getKey(), 0, "element");
                $setSelection(rangeSelection);
                
                // Clear all formatting from the selection (color, bold, italic, underline)
                const newSelection = $getSelection();
                if ($isRangeSelection(newSelection)) {
                  // Remove color formatting
                  $patchStyleText(newSelection, { color: null });
                  // Remove text formats
                  if (newSelection.hasFormat("bold")) {
                    newSelection.formatText("bold");
                  }
                  if (newSelection.hasFormat("italic")) {
                    newSelection.formatText("italic");
                  }
                  if (newSelection.hasFormat("underline")) {
                    newSelection.formatText("underline");
                  }
                }
              }
            }, { discrete: true });
            
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

function SpeakerLineEnterPlugin({ 
  getSpeakerColor 
}: { 
  getSpeakerColor: (speakerId: string) => string;
}) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const enterUnregister = editor.registerCommand(
      KEY_ENTER_COMMAND,
      (event: KeyboardEvent | null) => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
          return false;
        }

        const anchorNode = selection.anchor.getNode();
        let currentNode: LexicalNode | null = anchorNode;
        let speakerLine: SpeakerLineNode | null = null;

        // Walk up to find SpeakerLineNode
        while (currentNode) {
          if ($isSpeakerLineNode(currentNode)) {
            speakerLine = currentNode;
            break;
          }
          currentNode = currentNode.getParent();
        }

        if (speakerLine) {
          const speakerId = speakerLine.getSpeakerId();
          if (speakerId) {
            // Create new SpeakerLineNode with same speaker and apply color
            editor.update(() => {
              const newSpeakerLine = $createSpeakerLineNode(speakerId);
              speakerLine.insertAfter(newSpeakerLine);
              
              // Move selection to new line
              const rangeSelection = $createRangeSelection();
              rangeSelection.anchor.set(newSpeakerLine.getKey(), 0, "element");
              rangeSelection.focus.set(newSpeakerLine.getKey(), 0, "element");
              $setSelection(rangeSelection);
              
              // Apply speaker color to future typing
              const speakerColor = getSpeakerColor(speakerId);
              $patchStyleText(rangeSelection, { color: speakerColor });
            });
            
            if (event) {
              event.preventDefault();
            }
            return true;
          }
        }

        return false;
      },
      1 // Priority: higher than default
    );

    // Handle backspace/delete to remove entire SpeakerLineNode when trying to delete the label
    const backspaceUnregister = editor.registerCommand(
      KEY_BACKSPACE_COMMAND,
      (event: KeyboardEvent | null) => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) {
          return false;
        }

        // If selection includes the label or we're at the start of content, delete entire SpeakerLineNode
        if (selection.isCollapsed()) {
          const anchorNode = selection.anchor.getNode();
          const offset = selection.anchor.offset;
          
          if ($isTextNode(anchorNode)) {
            const parent = anchorNode.getParent();
            if ($isSpeakerLineNode(parent)) {
              const children = parent.getChildren();
              const firstChild = children[0];
              
              // Check if the first child is actually a label node (has bold format)
              const isLabelNode = firstChild && $isTextNode(firstChild) && firstChild.hasFormat("bold");
              
              if (isLabelNode) {
                // There is a label node - check if we're in it or at the start of the content node
                const labelNode = firstChild;
                const contentNode = children[1];
                
                // Only delete entire line if we're in the label node OR at the very start of the content node
                if (anchorNode === labelNode) {
                  // We're in the label node itself - delete entire line
                  editor.update(() => {
                    const newParagraph = $createParagraphNode();
                    parent.replace(newParagraph);
                    const rangeSelection = $createRangeSelection();
                    rangeSelection.anchor.set(newParagraph.getKey(), 0, "element");
                    rangeSelection.focus.set(newParagraph.getKey(), 0, "element");
                    $setSelection(rangeSelection);
                  });
                  
                  if (event) {
                    event.preventDefault();
                  }
                  return true;
                }
                
                // If we're at offset 0 of the content node (right after label), delete entire line
                if (anchorNode === contentNode && offset === 0) {
                  editor.update(() => {
                    const newParagraph = $createParagraphNode();
                    parent.replace(newParagraph);
                    const rangeSelection = $createRangeSelection();
                    rangeSelection.anchor.set(newParagraph.getKey(), 0, "element");
                    rangeSelection.focus.set(newParagraph.getKey(), 0, "element");
                    $setSelection(rangeSelection);
                  });
                  
                  if (event) {
                    event.preventDefault();
                  }
                  return true;
                }
              }
              // If there's no label node, don't intercept backspace - let it work normally
            }
          }
        } else {
          // Selection is not collapsed - check if it includes the label
          const anchorNode = selection.anchor.getNode();
          const focusNode = selection.focus.getNode();
          let anchorParent = anchorNode.getParent();
          let focusParent = focusNode.getParent();
          
          // Check if selection spans a SpeakerLineNode's label
          if ($isSpeakerLineNode(anchorParent) || $isSpeakerLineNode(focusParent)) {
            const speakerLine = $isSpeakerLineNode(anchorParent) ? anchorParent : focusParent;
            if (speakerLine) {
              const children = speakerLine.getChildren();
              const firstChild = children[0];
              
              // Check if the first child is actually a label node (has bold format)
              const isLabelNode = firstChild && $isTextNode(firstChild) && firstChild.hasFormat("bold");
              
              if (isLabelNode) {
                const labelNode = firstChild;
                
                // If selection includes the label, delete entire SpeakerLineNode
                if (anchorNode === labelNode || focusNode === labelNode ||
                    (anchorParent === speakerLine && anchorNode === labelNode) ||
                    (focusParent === speakerLine && focusNode === labelNode)) {
                  editor.update(() => {
                    const newParagraph = $createParagraphNode();
                    speakerLine.replace(newParagraph);
                    const rangeSelection = $createRangeSelection();
                    rangeSelection.anchor.set(newParagraph.getKey(), 0, "element");
                    rangeSelection.focus.set(newParagraph.getKey(), 0, "element");
                    $setSelection(rangeSelection);
                  });
                  
                  if (event) {
                    event.preventDefault();
                  }
                  return true;
                }
              }
            }
          }
        }

        return false;
      },
      1 // Priority: higher than default
    );

    const deleteUnregister = editor.registerCommand(
      KEY_DELETE_COMMAND,
      (event: KeyboardEvent | null) => {
        // Similar logic for delete key
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) {
          return false;
        }
        
        if (selection.isCollapsed()) {
          const anchorNode = selection.anchor.getNode();
          if ($isTextNode(anchorNode)) {
            const parent = anchorNode.getParent();
            if ($isSpeakerLineNode(parent)) {
              const children = parent.getChildren();
              const firstChild = children[0];
              
              // Check if the first child is actually a label node (has bold format)
              const isLabelNode = firstChild && $isTextNode(firstChild) && firstChild.hasFormat("bold");
              
              // If we're in the label node, delete entire SpeakerLineNode
              if (isLabelNode && anchorNode === firstChild) {
                editor.update(() => {
                  const newParagraph = $createParagraphNode();
                  parent.replace(newParagraph);
                  const rangeSelection = $createRangeSelection();
                  rangeSelection.anchor.set(newParagraph.getKey(), 0, "element");
                  rangeSelection.focus.set(newParagraph.getKey(), 0, "element");
                  $setSelection(rangeSelection);
                });
                
                if (event) {
                  event.preventDefault();
                }
                return true;
              }
              // If there's no label node, don't intercept delete - let it work normally
            }
          }
        }

        return false;
      },
      1 // Priority: higher than default
    );

    // Prevent cursor from being placed inside the label - move it to content node instead
    const updateUnregister = editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection) && selection.isCollapsed()) {
          const anchorNode = selection.anchor.getNode();
          if ($isTextNode(anchorNode)) {
            const parent = anchorNode.getParent();
            if ($isSpeakerLineNode(parent)) {
              const children = parent.getChildren();
              const firstChild = children[0];
              const contentNode = children[1];
              
              // Check if the first child is actually a label node (has bold format)
              const isLabelNode = firstChild && $isTextNode(firstChild) && firstChild.hasFormat("bold");
              
              // If cursor is in the label node, move it to the content node
              if (isLabelNode && anchorNode === firstChild && contentNode) {
                editor.update(() => {
                  const rangeSelection = $createRangeSelection();
                  rangeSelection.anchor.set(contentNode.getKey(), 0, "text");
                  rangeSelection.focus.set(contentNode.getKey(), 0, "text");
                  $setSelection(rangeSelection);
                });
              }
            }
          }
        }
      });
    });

    return () => {
      enterUnregister();
      backspaceUnregister();
      deleteUnregister();
      updateUnregister();
    };
  }, [editor, getSpeakerColor]);

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
    editor.update(() => {
      const parser = new DOMParser();
      const dom = parser.parseFromString(content || "<p></p>", "text/html");
      const nodes = $generateNodesFromDOM(editor, dom);
      const root = $getRoot();
      root.clear();
      root.append(...nodes);
    }, { discrete: true });
    
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
  darkMode,
  activeColor,
  onColorChange,
  disabled,
}: {
  darkMode: boolean;
  activeColor: string | null;
  onColorChange: (color: string | null) => void;
  disabled?: boolean;
}) {
  const theme = useTheme();
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

  const displayColor = activeColor || "#000000";
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
        title={disabled ? "Formatting locked while speaker is active" : "Text Color"}
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

      {isOpen && !disabled && (
        <div
          className="absolute top-full left-0 mt-2 z-50 rounded-xl border shadow-2xl backdrop-blur-sm p-3 min-w-[190px]"
          style={{
            borderColor: theme.border,
            backgroundColor: theme.modal,
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
                      ? "scale-105 shadow-sm"
                      : "hover:scale-105 hover:shadow-sm"
                  }`}
                  style={{
                    backgroundColor: color,
                    borderColor: activeColor === color ? theme.accent : theme.border,
                  }}
                  onMouseEnter={(e) => {
                    if (activeColor !== color) {
                      e.currentTarget.style.borderColor = theme.accent;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeColor !== color) {
                      e.currentTarget.style.borderColor = theme.border;
                    }
                  }}
                  title={color}
                />
              ))}
            </div>

            <div className="pt-2 border-t" style={{ borderColor: theme.border }}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleColorSelect(null);
                }}
                className="w-full rounded-md px-2.5 py-1.5 text-sm font-medium transition"
                style={{
                  color: theme.textPrimary,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = theme.buttonHover;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
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
  darkMode,
  activeColor,
  setActiveColor,
  selectedSpeakers,
  activeSpeaker,
  onToggleSpeaker,
  partNodes,
  allPartNodes,
  nodeId,
  nodeType,
  getSpeakerColor,
}: {
  darkMode: boolean;
  activeColor: string | null;
  setActiveColor: (color: string | null) => void;
  selectedSpeakers?: string[];
  activeSpeaker?: string | null;
  onToggleSpeaker?: (speakerId: string) => void;
  partNodes?: Array<{ id: string; label: string }>;
  allPartNodes?: Array<{ id: string; label: string }>;
  nodeId?: string;
  nodeType?: ImpressionType | "part" | "tension" | "interaction";
  getSpeakerColor: (speakerId: string) => string;
}) {
  const [editor] = useLexicalComposerContext();
  const DEBUG_JOURNAL_EDITOR =
    typeof window !== "undefined" &&
    (window.localStorage?.getItem("journalEditorDebug") === "1" ||
      new URLSearchParams(window.location.search).get("journalEditorDebug") ===
        "1");
  const debugLog = useCallback(
    (message: string, data?: Record<string, unknown>) => {
      if (!DEBUG_JOURNAL_EDITOR) return;
      // Use console.log (not console.debug) so it's visible in default DevTools filters.
      // eslint-disable-next-line no-console
      console.log(`[JournalEditor][Toolbar] ${message}`, data ?? {});
    },
    [DEBUG_JOURNAL_EDITOR]
  );

  useEffect(() => {
    if (!DEBUG_JOURNAL_EDITOR) return;
    // eslint-disable-next-line no-console
    console.log("[JournalEditor][Toolbar] debug enabled", {
      viaLocalStorage:
        typeof window !== "undefined" &&
        window.localStorage?.getItem("journalEditorDebug") === "1",
      viaQueryParam:
        typeof window !== "undefined" &&
        new URLSearchParams(window.location.search).get("journalEditorDebug") ===
          "1",
    });
  }, [DEBUG_JOURNAL_EDITOR]);
  const [formats, setFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    list: false,
  });
  const [showAddPartDropdown, setShowAddPartDropdown] = useState(false);
  const [addedPartIds, setAddedPartIds] = useState<string[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get default speakers (Self + relevant parts)
  // Unknown stays in dropdown, not in defaults
  // For impressions, only "self" is shown by default, all parts go in dropdown
  const defaultSpeakers = useMemo(() => {
    const speakers = [
      { id: "self", label: "Self", isSelf: true, isUnknown: false },
    ];
    
    // For impressions, only show "self" by default - all parts go in dropdown
    const isImpression = nodeType && ["emotion", "thought", "sensation", "behavior", "other", "default"].includes(nodeType);
    if (isImpression) {
      return speakers; // Only return self for impressions
    }
    
    // Add target part if journal is about a part
    if (nodeType === "part" && nodeId && partNodes) {
      const targetPart = partNodes.find(p => p.id === nodeId);
      if (targetPart) {
        speakers.push({ id: targetPart.id, label: targetPart.label, isSelf: false, isUnknown: false });
      }
    }
    
    // For tension/interaction, parts are already filtered in partNodes prop
    // Add all relevant parts from partNodes (these are already filtered to be relevant)
    if (partNodes && nodeType !== "part") {
      // For tension/interaction, add all parts in partNodes
      partNodes.forEach((part) => {
        if (!speakers.find(s => s.id === part.id)) {
          speakers.push({ id: part.id, label: part.label, isSelf: false, isUnknown: false });
        }
      });
    }
    
    return speakers;
  }, [partNodes, nodeId, nodeType]);

  // Get all available speakers (default + added parts)
  const allSpeakers = useMemo(() => {
    const speakerMap = new Map<string, { id: string; label: string; isSelf: boolean; isUnknown: boolean }>();
    
    // Add default speakers
    defaultSpeakers.forEach((s) => speakerMap.set(s.id, s));
    
    // Add parts that were added from dropdown
    // Need to look in allPartNodes, not just partNodes, since added parts might not be in partNodes
    addedPartIds.forEach((partId) => {
      if (!speakerMap.has(partId)) {
        if (partId === "unknown") {
          speakerMap.set("unknown", { id: "unknown", label: "Unknown", isSelf: false, isUnknown: true });
        } else {
          // Look in allPartNodes first, then partNodes as fallback
          const part = allPartNodes?.find(p => p.id === partId) || partNodes?.find(p => p.id === partId);
          if (part) {
            speakerMap.set(part.id, { id: part.id, label: part.label, isSelf: false, isUnknown: false });
          }
        }
      }
    });
    
    return Array.from(speakerMap.values());
  }, [defaultSpeakers, addedPartIds, partNodes, allPartNodes]);

  // Get parts available to add (not already in defaults or added)
  // Unknown is always in the dropdown, not in defaults
  // For impressions, include all parts from partNodes in the dropdown
  const availablePartsToAdd = useMemo(() => {
    const isImpression = nodeType && ["emotion", "thought", "sensation", "behavior", "other", "default"].includes(nodeType);
    const defaultPartIds = new Set(defaultSpeakers.map(s => s.id));
    const currentPartIds = new Set(partNodes?.map(p => p.id) || []);
    const allShownIds = new Set([...Array.from(defaultPartIds), ...addedPartIds]);
    
    // For impressions, include parts from partNodes in the dropdown (they're not in defaults)
    const impressionParts = isImpression && partNodes
      ? partNodes
          .filter(p => !allShownIds.has(p.id))
          .map(p => ({ 
            id: p.id, 
            label: p.label, 
            isUnknown: false 
          }))
      : [];
    
    // Get parts from allPartNodes that are not already shown
    // For impressions, don't filter out currentPartIds since we want them in dropdown
    const otherParts = (allPartNodes || [])
      .filter(p => !allShownIds.has(p.id) && (!isImpression && !currentPartIds.has(p.id)))
      .map(p => ({ 
        id: p.id, 
        label: p.label, 
        isUnknown: false 
      }));
    
    // Always include Unknown in dropdown (not in defaults)
    const unknownAvailable = !addedPartIds.includes("unknown");
    
    return [
      ...impressionParts,
      ...otherParts,
      ...(unknownAvailable ? [{ id: "unknown", label: "Unknown", isUnknown: true }] : []),
    ];
  }, [partNodes, allPartNodes, defaultSpeakers, addedPartIds, nodeType]);


  // Add part from dropdown (including Unknown)
  const handleAddPart = useCallback((partId: string) => {
    if (partId === "unknown") {
      // Unknown is special - add it to addedPartIds
      if (!addedPartIds.includes("unknown")) {
        setAddedPartIds(prev => [...prev, "unknown"]);
      }
    } else {
      // Regular part
      if (!addedPartIds.includes(partId)) {
        setAddedPartIds(prev => [...prev, partId]);
      }
    }
    setShowAddPartDropdown(false);
    // Just add to available speakers - don't activate or insert text
  }, [addedPartIds]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowAddPartDropdown(false);
      }
    };
    
    if (showAddPartDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showAddPartDropdown]);

  // Helper function to update formatting state from editor state
  const updateFormattingFromEditorState = useCallback((editorState: EditorState) => {
    editorState.read(() => {
      const selection = $getSelection();

      if ($isRangeSelection(selection)) {
        const anchorNode = selection.anchor.getNode();
        const focusNode = selection.focus.getNode();
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

        // IMPORTANT:
        // Lexical can keep a "current selection style" (used for future typing) even when the caret
        // moves through differently-styled text via Backspace/Delete. To make the toolbar reflect
        // what the caret is *actually inside*, we try to read the style from the underlying TextNode.
        let effectiveColor: string | null = null;
        let effectiveColorSource: "textNode" | "neighborTextNode" | "selectionStyle" | "none" =
          "none";

        const readColorFromStyleString = (style: string | null | undefined) => {
          if (!style) return null;
          // Lexical stores inline styles as a CSS string, e.g. "color: rgb(239, 68, 68); font-weight: 700;"
          // We'll extract the color value if present.
          const match = style.match(/(?:^|;)\s*color\s*:\s*([^;]+)\s*(?:;|$)/i);
          return match?.[1]?.trim() ?? null;
        };

        if (selection.isCollapsed()) {
          // Try the node the caret is in.
          if ($isTextNode(anchorNode)) {
            const fromNode = readColorFromStyleString(anchorNode.getStyle());
            if (fromNode) {
              effectiveColor = fromNode;
              effectiveColorSource = "textNode";
            }
          }

          // If caret is at an element boundary, the anchor node might not be the node that visually
          // "owns" the caret. As a fallback, check nearest text neighbors.
          if (!effectiveColor) {
            const tryNeighbor = (node: unknown) => {
              if ($isTextNode(node as any)) {
                return readColorFromStyleString((node as TextNode).getStyle());
              }
              return null;
            };

            const prev = (anchorNode as any)?.getPreviousSibling?.();
            const next = (anchorNode as any)?.getNextSibling?.();
            const fromPrev = tryNeighbor(prev);
            const fromNext = tryNeighbor(next);
            if (fromPrev) {
              effectiveColor = fromPrev;
              effectiveColorSource = "neighborTextNode";
            } else if (fromNext) {
              effectiveColor = fromNext;
              effectiveColorSource = "neighborTextNode";
            }
          }
        }

        if (!effectiveColor) {
          effectiveColor = selectionStyleColor ?? null;
          effectiveColorSource = selectionStyleColor ? "selectionStyle" : "none";
        }

        // Compute effective formats. Similar to color, Lexical can keep a "future typing"
        // format on the selection when the caret moves via deletion. Prefer the TextNode's
        // real format when the selection is collapsed.
        let effectiveBold = selection.hasFormat("bold");
        let effectiveItalic = selection.hasFormat("italic");
        let effectiveUnderline = selection.hasFormat("underline");
        let effectiveFormatSource:
          | "textNode"
          | "neighborTextNode"
          | "selection"
          | "none" = "selection";

        if (selection.isCollapsed()) {
          const readFormatsFromNode = (node: unknown) => {
            if (!$isTextNode(node as any)) return null;
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
            effectiveFormatSource = "textNode";
          } else {
            const prev = (anchorNode as any)?.getPreviousSibling?.();
            const next = (anchorNode as any)?.getNextSibling?.();
            const fromPrev = readFormatsFromNode(prev);
            const fromNext = readFormatsFromNode(next);
            if (fromPrev) {
              effectiveBold = fromPrev.bold;
              effectiveItalic = fromPrev.italic;
              effectiveUnderline = fromPrev.underline;
              effectiveFormatSource = "neighborTextNode";
            } else if (fromNext) {
              effectiveBold = fromNext.bold;
              effectiveItalic = fromNext.italic;
              effectiveUnderline = fromNext.underline;
              effectiveFormatSource = "neighborTextNode";
            } else {
              effectiveFormatSource = "selection";
            }
          }
        }

        debugLog("selection read", {
          isCollapsed: selection.isCollapsed(),
          anchorKey: selection.anchor.key,
          anchorOffset: selection.anchor.offset,
          anchorType: selection.anchor.type,
          anchorNodeType: (anchorNode as any)?.getType?.(),
          anchorNodeKey: (anchorNode as any)?.getKey?.(),
          anchorNodeStyle: $isTextNode(anchorNode) ? anchorNode.getStyle() : null,
          focusKey: selection.focus.key,
          focusOffset: selection.focus.offset,
          focusType: selection.focus.type,
          focusNodeType: (focusNode as any)?.getType?.(),
          focusNodeKey: (focusNode as any)?.getKey?.(),
          focusNodeStyle: $isTextNode(focusNode) ? focusNode.getStyle() : null,
          formats: {
            bold: effectiveBold,
            italic: effectiveItalic,
            underline: effectiveUnderline,
          },
          effectiveFormatSource,
          inList,
          selectionStyleColor: selectionStyleColor ?? null,
          effectiveColor,
          effectiveColorSource,
          activeColorBefore: activeColor,
        });

        setFormats({
          bold: effectiveBold,
          italic: effectiveItalic,
          underline: effectiveUnderline,
          list: inList,
        });

        // 👉 Use effective color (prefer the text node the caret is actually inside)
        setActiveColor(effectiveColor || null);

        // Detect which SpeakerLineNode the caret is inside for active speaker tracking
        let currentNode: LexicalNode | null = anchorNode;
        let speakerLine: SpeakerLineNode | null = null;
        while (currentNode) {
          if ($isSpeakerLineNode(currentNode)) {
            speakerLine = currentNode;
            break;
          }
          currentNode = currentNode.getParent();
        }
        
        const detectedSpeakerId = speakerLine?.getSpeakerId() || null;
        // Update active speaker based on detected SpeakerLineNode
        // Note: onToggleSpeaker toggles, so we need to be careful:
        // - If we detect a speaker that's different from active, toggle the new one (turns it on)
        // - If we detect no speaker but one is active, toggle the active one (turns it off)
        if (detectedSpeakerId !== activeSpeaker) {
          if (detectedSpeakerId) {
            // We're entering a new speaker line - toggle it on
            // If activeSpeaker is set, toggleSpeaker will turn it off and turn detectedSpeakerId on
            // But since toggleSpeaker is a toggle, we need to ensure the right behavior
            // For now, just call it - if activeSpeaker !== detectedSpeakerId, this will switch
            onToggleSpeaker?.(detectedSpeakerId);
          } else if (activeSpeaker) {
            // We're leaving a speaker line - toggle off the current active speaker
            onToggleSpeaker?.(activeSpeaker);
          }
        }
      } else {
        debugLog("no range selection", { activeColorBefore: activeColor });
        // No selection: reset formats; leave color alone (color picker controls it)
        setFormats({
          bold: false,
          italic: false,
          underline: false,
          list: false,
        });
      }
    });
  }, [debugLog, setActiveColor, activeColor, onToggleSpeaker, activeSpeaker]);

  // Helper function to update formatting from current editor state (for keyboard events)
  const updateFormattingFromSelection = useCallback(() => {
    const editorState = editor.getEditorState();
    updateFormattingFromEditorState(editorState);
  }, [editor, updateFormattingFromEditorState]);

  // Listen for editor state updates
  useEffect(() => {
    return editor.registerUpdateListener(({ editorState, prevEditorState }) => {
      debugLog("registerUpdateListener fired", {});
      // Schedule formatting update after the current update cycle completes
      // This is especially important for backspace/delete operations where
      // the selection might update in a separate cycle
      setTimeout(() => {
        debugLog("registerUpdateListener tick", {});
        // Read from the latest editor state, not the one passed to the listener
        // This ensures we get the most up-to-date selection
        const latestState = editor.getEditorState();
        updateFormattingFromEditorState(latestState);
      }, 0);
    });
  }, [editor, updateFormattingFromEditorState]);

  // Also listen for keyboard events as a backup, especially for backspace/delete
  // This ensures formatting updates even if the update listener doesn't fire immediately
  useEffect(() => {
    const editorElement = editor.getRootElement();
    if (!editorElement) return;

    const handleKeyUp = (event: KeyboardEvent) => {
      // Handle backspace and delete
      if (event.key === 'Backspace' || event.key === 'Delete') {
        debugLog("keyup", { key: event.key });
        // Use requestAnimationFrame + setTimeout to ensure Lexical has fully processed
        // First frame: DOM updates
        requestAnimationFrame(() => {
          // Second frame: Lexical state updates
          requestAnimationFrame(() => {
            // Then read the state after a small delay
            setTimeout(() => {
              debugLog("keyup tick", { key: event.key });
              updateFormattingFromSelection();
            }, 5);
          });
        });
      }
    };

    editorElement.addEventListener('keyup', handleKeyUp);
    
    return () => {
      editorElement.removeEventListener('keyup', handleKeyUp);
    };
  }, [editor, updateFormattingFromSelection, debugLog]);


  const formatText = (format: "bold" | "italic" | "underline") => {
    // Lock formatting when a speaker is active
    if (activeSpeaker) {
      return;
    }
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        selection.formatText(format);
      }
      });
    };

  const toggleList = () => {
    // Lock formatting when a speaker is active
    if (activeSpeaker) {
      return;
    }
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
    // Lock formatting when a speaker is active
    if (activeSpeaker) {
      return;
    }
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

  const theme = useTheme();
  const activeButtonStyle = (isActive: boolean) => {
    if (!isActive) {
      return {
        backgroundColor: "transparent",
        color: theme.textSecondary,
        boxShadow: "none",
        border: "1px solid transparent",
      } as const;
    }

    // Light theme: white active background (instead of accent fill)
    if (!darkMode) {
      return {
        backgroundColor: "white",
        color: theme.textPrimary,
        boxShadow: "0 1px 2px rgba(0, 0, 0, 0.08)",
        border: `1px solid ${theme.border}`,
      } as const;
    }

    // Dark theme: keep accent fill
    return {
      backgroundColor: theme.accent,
      color: theme.buttonText,
      boxShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
      border: "1px solid transparent",
    } as const;
  };

  return (
    <div
      className="sticky top-0 z-10 flex flex-wrap items-center gap-3 rounded-xl border px-4 py-3 shadow-sm backdrop-blur"
      style={{
        borderColor: theme.border,
        backgroundColor: theme.elevated,
      }}
    >
    <button
      type="button"
      disabled={!!activeSpeaker}
      onMouseDown={(e) => {
        e.preventDefault();
        if (!activeSpeaker) {
          formatText("bold");
        }
      }}
      className="rounded-md px-2.5 py-1 text-sm font-medium"
      style={{
        ...activeButtonStyle(formats.bold),
        transition: "none !important",
        opacity: activeSpeaker ? 0.5 : 1,
        cursor: activeSpeaker ? "not-allowed" : "pointer",
      }}
      onMouseEnter={(e) => {
        if (!activeSpeaker && !formats.bold) {
          e.currentTarget.style.backgroundColor = theme.buttonHover;
          e.currentTarget.style.color = theme.textPrimary;
        }
      }}
      onMouseLeave={(e) => {
        if (!activeSpeaker && !formats.bold) {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.color = theme.textSecondary;
        }
      }}
        title={activeSpeaker ? "Formatting locked while speaker is active" : "Bold"}
    >
        <span className="font-semibold">B</span>
    </button>

    <button
        type="button"
      disabled={!!activeSpeaker}
      onMouseDown={(e) => {
        e.preventDefault();
        if (!activeSpeaker) {
          formatText("italic");
        }
      }}
        className="rounded-md px-2.5 py-1 text-sm font-medium"
        style={{
          ...activeButtonStyle(formats.italic),
          transition: "none !important",
          opacity: activeSpeaker ? 0.5 : 1,
          cursor: activeSpeaker ? "not-allowed" : "pointer",
        }}
        onMouseEnter={(e) => {
          if (!activeSpeaker && !formats.italic) {
            e.currentTarget.style.backgroundColor = theme.buttonHover;
            e.currentTarget.style.color = theme.textPrimary;
          }
        }}
        onMouseLeave={(e) => {
          if (!activeSpeaker && !formats.italic) {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = theme.textSecondary;
          }
        }}
        title={activeSpeaker ? "Formatting locked while speaker is active" : "Italic"}
      >
        <span className="italic">I</span>
      </button>

      <button
        type="button"
        disabled={!!activeSpeaker}
        onMouseDown={(e) => {
          e.preventDefault();
          if (!activeSpeaker) {
            formatText("underline");
          }
        }}
        className="rounded-md px-2.5 py-1 text-sm font-medium"
        style={{
          ...activeButtonStyle(formats.underline),
          transition: "none !important",
          opacity: activeSpeaker ? 0.5 : 1,
          cursor: activeSpeaker ? "not-allowed" : "pointer",
        }}
        onMouseEnter={(e) => {
          if (!activeSpeaker && !formats.underline) {
            e.currentTarget.style.backgroundColor = theme.buttonHover;
            e.currentTarget.style.color = theme.textPrimary;
          }
        }}
        onMouseLeave={(e) => {
          if (!activeSpeaker && !formats.underline) {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = theme.textSecondary;
          }
        }}
        title={activeSpeaker ? "Formatting locked while speaker is active" : "Underline"}
          >
            <span className="underline underline-offset-2">U</span>
      </button>

      <button
        type="button"
        disabled={!!activeSpeaker}
        onMouseDown={(e) => {
          e.preventDefault();
          if (!activeSpeaker) {
            toggleList();
          }
        }}
        className="rounded-md px-2.5 py-1 text-sm font-medium"
        style={{
          ...activeButtonStyle(formats.list),
          transition: "none !important",
          opacity: activeSpeaker ? 0.5 : 1,
          cursor: activeSpeaker ? "not-allowed" : "pointer",
        }}
        onMouseEnter={(e) => {
          if (!activeSpeaker && !formats.list) {
            e.currentTarget.style.backgroundColor = theme.buttonHover;
            e.currentTarget.style.color = theme.textPrimary;
          }
        }}
        onMouseLeave={(e) => {
          if (!activeSpeaker && !formats.list) {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = theme.textSecondary;
          }
        }}
        title={activeSpeaker ? "Formatting locked while speaker is active" : "Bullet List"}
          >
            • List
      </button>

          <div className="h-5 w-px" style={{ backgroundColor: theme.border }} />

      <ColorPicker
        darkMode={darkMode}
        activeColor={activeColor}
        onColorChange={applyColor}
        disabled={!!activeSpeaker}
      />

      {allSpeakers.length > 0 && (
        <>
          <div className="h-5 w-px" style={{ backgroundColor: theme.border }} />
          <div className="flex items-center gap-1.5 flex-wrap">
            {allSpeakers.map((speaker) => {
              const isActive = activeSpeaker === speaker.id;
              const speakerColor = getSpeakerColor(speaker.id);

              const handleSpeakerClick = () => {
                // If clicking on an already active speaker, deselect it and go to new normal line
                if (isActive) {
                  editor.update(() => {
                    editor.focus();
                    
                    const root = $getRoot();
                    const selection = $getSelection();
                    
                    // Create a new regular paragraph (not a SpeakerLineNode)
                    const newParagraph = $createParagraphNode();
                    
                    // Insert after current selection
                    if ($isRangeSelection(selection)) {
                      const anchorNode = selection.anchor.getNode();
                      let currentNode: LexicalNode | null = anchorNode;
                      let speakerLine: SpeakerLineNode | null = null;
                      
                      // Find the SpeakerLineNode we're in
                      while (currentNode) {
                        if ($isSpeakerLineNode(currentNode)) {
                          speakerLine = currentNode;
                          break;
                        }
                        currentNode = currentNode.getParent();
                      }
                      
                      if (speakerLine) {
                        speakerLine.insertAfter(newParagraph);
                      } else {
                        const parent = anchorNode.getParent();
                        if (parent) {
                          parent.insertAfter(newParagraph);
                        } else {
                          root.append(newParagraph);
                        }
                      }
                    } else {
                      root.append(newParagraph);
                    }
                    
                    // Set selection to new paragraph and clear all formatting
                    const rangeSelection = $createRangeSelection();
                    rangeSelection.anchor.set(newParagraph.getKey(), 0, "element");
                    rangeSelection.focus.set(newParagraph.getKey(), 0, "element");
                    $setSelection(rangeSelection);
                    
                    // Clear all formatting - clear color style and remove text formats from selection
                    $patchStyleText(rangeSelection, { color: null });
                    // Toggle off formats if they're active in the selection style
                    // We need to get the selection again after setting it to check formats
                    const currentSelection = $getSelection();
                    if ($isRangeSelection(currentSelection)) {
                      if (currentSelection.hasFormat("bold")) currentSelection.formatText("bold");
                      if (currentSelection.hasFormat("italic")) currentSelection.formatText("italic");
                      if (currentSelection.hasFormat("underline")) currentSelection.formatText("underline");
                    }
                  });
                  
                  // Reset active color in toolbar
                  setActiveColor(null);
                  
                  // Toggle speaker off
                  onToggleSpeaker?.(speaker.id);
                  return;
                }
                
                // Create a SpeakerLineNode with the speaker's label and color
                editor.update(() => {
                  editor.focus();
                  
                  const root = $getRoot();
                  const selection = $getSelection();
                  
                  // Create new SpeakerLineNode
                  const speakerLine = $createSpeakerLineNode(speaker.id);
                  
                  // Create and insert the speaker label with color and bold
                  // Create and insert the speaker label with bold
                  // Note: CSS will style the <strong> tag wrapper with pill styling
                  const labelText = $createTextNode(`${speaker.label}: `);
                  // Don't set color on the label - CSS handles the pill styling
                  labelText.setFormat("bold");
                  speakerLine.append(labelText);
                  
                  // Insert an empty non-bold text node after the label for future typing
                  // This ensures the cursor is in a non-bold node so typed content won't be bold
                  const contentText = $createTextNode("");
                  contentText.setStyle(`color: ${speakerColor}`);
                  // Don't set bold format on contentText - it should be normal weight
                  speakerLine.append(contentText);
                  
                  // Insert the speaker line after current selection or at end
                  // If root is empty or only has an empty paragraph, replace it with the speaker line
                  const firstChild = root.getFirstChild();
                  const isEmptyEditor = !firstChild || 
                    (firstChild.getType() === "paragraph" && firstChild.getTextContent().trim() === "");
                  
                  if (isEmptyEditor) {
                    // Replace empty root/paragraph with speaker line
                    if (firstChild) {
                      firstChild.replace(speakerLine);
                    } else {
                      root.append(speakerLine);
                    }
                  } else if ($isRangeSelection(selection)) {
                    const anchorNode = selection.anchor.getNode();
                    const parent = anchorNode.getParent();
                    if (parent && parent !== root) {
                      parent.insertAfter(speakerLine);
                    } else {
                      root.append(speakerLine);
                    }
                  } else {
                    root.append(speakerLine);
                  }
                  
                  // Set selection to the empty content text node (at offset 0)
                  const rangeSelection = $createRangeSelection();
                  rangeSelection.anchor.set(contentText.getKey(), 0, "text");
                  rangeSelection.focus.set(contentText.getKey(), 0, "text");
                  $setSelection(rangeSelection);
                  
                  // Apply color to future typing (already set on contentText, but ensure selection style matches)
                  $patchStyleText(rangeSelection, { color: speakerColor });
                });
                
                // Update active color for toolbar indicator
                setActiveColor(speakerColor);
                
                // Toggle speaker in parent state
                onToggleSpeaker?.(speaker.id);
              };

              return (
                <button
                  key={speaker.id}
                  type="button"
                  onClick={handleSpeakerClick}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium ${
                    isActive ? "ring-2 ring-offset-2 scale-105" : "hover:scale-102"
                  }`}
                  style={{
                    backgroundColor: isActive ? speakerColor : theme.surface,
                    color: isActive ? "white" : theme.textSecondary,
                    borderColor: isActive ? speakerColor : theme.border,
                    boxShadow: isActive ? `0 4px 12px ${speakerColor}40` : "0 1px 3px rgba(0, 0, 0, 0.1)",
                    transition: "none !important",
                  }}
                  title={`Switch to ${speaker.label}`}
                >
                  {speaker.isUnknown ? (
                    <span className="text-sm font-bold">?</span>
                  ) : (
                    <SquareUserRound size={12} />
                  )}
                  {speaker.label}
                  {addedPartIds.includes(speaker.id) && !speaker.isSelf && (
                    <X
                      size={10}
                      className="ml-0.5 opacity-70 hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        const wasActive = activeSpeaker === speaker.id;
                        
                        // If the pill was active, deselect it (same behavior as clicking active speaker)
                        if (wasActive) {
                          editor.update(() => {
                            editor.focus();
                            
                            const root = $getRoot();
                            const selection = $getSelection();
                            
                            // Create a new regular paragraph (not a SpeakerLineNode)
                            const newParagraph = $createParagraphNode();
                            
                            // Insert after current selection
                            if ($isRangeSelection(selection)) {
                              const anchorNode = selection.anchor.getNode();
                              let currentNode: LexicalNode | null = anchorNode;
                              let speakerLine: SpeakerLineNode | null = null;
                              
                              // Find the SpeakerLineNode we're in
                              while (currentNode) {
                                if ($isSpeakerLineNode(currentNode)) {
                                  speakerLine = currentNode;
                                  break;
                                }
                                currentNode = currentNode.getParent();
                              }
                              
                              if (speakerLine) {
                                speakerLine.insertAfter(newParagraph);
                              } else {
                                const parent = anchorNode.getParent();
                                if (parent) {
                                  parent.insertAfter(newParagraph);
                                } else {
                                  root.append(newParagraph);
                                }
                              }
                            } else {
                              root.append(newParagraph);
                            }
                            
                            // Set selection to new paragraph and clear all formatting
                            const rangeSelection = $createRangeSelection();
                            rangeSelection.anchor.set(newParagraph.getKey(), 0, "element");
                            rangeSelection.focus.set(newParagraph.getKey(), 0, "element");
                            $setSelection(rangeSelection);
                            
                            // Clear all formatting - clear color style and remove text formats from selection
                            $patchStyleText(rangeSelection, { color: null });
                            // Toggle off formats if they're active in the selection style
                            const currentSelection = $getSelection();
                            if ($isRangeSelection(currentSelection)) {
                              if (currentSelection.hasFormat("bold")) currentSelection.formatText("bold");
                              if (currentSelection.hasFormat("italic")) currentSelection.formatText("italic");
                              if (currentSelection.hasFormat("underline")) currentSelection.formatText("underline");
                            }
                          });
                          
                          // Reset active color in toolbar
                          setActiveColor(null);
                          
                          // Deselect the speaker
                          onToggleSpeaker?.(speaker.id);
                        }
                        
                        // Remove the part from the toolbar
                        setAddedPartIds(prev => prev.filter(id => id !== speaker.id));
                      }}
                    />
                  )}
                </button>
              );
            })}
            
            {/* Add Part Dropdown */}
            {availablePartsToAdd.length > 0 && (
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setShowAddPartDropdown(!showAddPartDropdown)}
                  className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium hover:scale-102"
                  style={{
                    borderColor: theme.border,
                    backgroundColor: theme.surface,
                    color: theme.textSecondary,
                    transition: "none !important",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = theme.buttonHover;
                    e.currentTarget.style.color = theme.textPrimary;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = theme.surface;
                    e.currentTarget.style.color = theme.textSecondary;
                  }}
                  title="Add another part"
                >
                  <Plus size={12} />
                  <span>Add Part</span>
                  <ChevronDown size={10} className={showAddPartDropdown ? "rotate-180" : ""} />
                </button>
                
                {showAddPartDropdown && (
                  <div className="absolute top-full left-0 mt-2 z-50 min-w-[200px] rounded-lg border shadow-lg overflow-hidden" style={{ borderColor: theme.border, backgroundColor: theme.card }}>
                    <div className="max-h-60 overflow-y-auto">
                      {availablePartsToAdd.map((part) => (
                        <button
                          key={part.id || (part.isUnknown ? "unknown" : "")}
                          type="button"
                          onClick={() => handleAddPart(part.isUnknown ? "unknown" : part.id)}
                          className="w-full text-left px-3 py-2 text-xs font-medium"
                          style={{
                            color: theme.textPrimary,
                            transition: "none !important",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = theme.buttonHover;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
          <div className="flex items-center gap-2">
                            <div className="w-3.5 flex items-center justify-center">
                              {part.isUnknown ? (
                                <span className="text-sm font-bold">?</span>
                              ) : (
                                <SquareUserRound size={14} />
                              )}
                            </div>
                            <span>{part.label}</span>
                          </div>
                        </button>
                      ))}
          </div>
        </div>
      )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function JournalEditor({
  content,
  onContentChange,
  readOnly = false,
  nodeType,
  selectedSpeakers,
  activeSpeaker,
  onToggleSpeaker,
  partNodes,
  allPartNodes,
  nodeId,
}: JournalEditorProps) {
  const { darkMode } = useThemeContext();
  const theme = useTheme();
  const [activeColor, setActiveColor] = useState<string | null>(null);

  const accentColor = useMemo(() => {
    return (
      (nodeType && NodeBackgroundColors[nodeType]) ||
      NodeBackgroundColors.default
    );
  }, [nodeType]);

  // Get speaker color - shared between Toolbar and plugins
  const getSpeakerColor = useCallback((speakerId: string): string => {
    if (speakerId === "self") {
      return darkMode ? "rgb(59, 130, 246)" : "rgb(37, 99, 235)"; // Peaceful blue - always blue
    }
    if (speakerId === "unknown") {
      return darkMode ? "rgb(107, 114, 128)" : "rgb(156, 163, 175)"; // Grey
    }
    // Generate color for parts - use allPartNodes for consistent color across all parts
    const allParts = allPartNodes || partNodes || [];
    const partIndex = allParts.findIndex((p) => p.id === speakerId);
    if (partIndex >= 0) {
      // Use golden angle for color distribution to ensure different colors
      const hue = (partIndex * 137.508) % 360;
      return `hsl(${hue}, 65%, ${darkMode ? "55%" : "60%"})`;
    }
    // Fallback color if part not found
    return darkMode ? "rgb(239, 68, 68)" : "rgb(220, 38, 38)"; // Red fallback
  }, [darkMode, partNodes, allPartNodes]);

  const initialConfig = {
    namespace: "JournalEditor",
    theme: lexicalTheme,
    nodes: [ListNode, ListItemNode, SpeakerLineNode],
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
             selectedSpeakers={selectedSpeakers}
             activeSpeaker={activeSpeaker}
             onToggleSpeaker={onToggleSpeaker}
             partNodes={partNodes}
             allPartNodes={allPartNodes}
             nodeId={nodeId}
             nodeType={nodeType}
             getSpeakerColor={getSpeakerColor}
           />
         )}
        <div
          className="relative flex-1 overflow-hidden rounded-2xl border shadow-inner flex"
          style={{
            borderColor: theme.border,
            backgroundColor: theme.surface,
            boxShadow: darkMode ? 'none' : `0 0 0 1.5px ${accentColor}20`,
          }}
        >
          <div className="flex-1 relative overflow-hidden">
            <style dangerouslySetInnerHTML={{__html: `
              /* Style only the speaker label (first bold child) within speaker lines */
              /* Target the first strong tag which is always the speaker label */
              p[data-speaker-id] > strong:first-child {
                display: inline-block;
                width: auto;
                text-align: right;
                background: white;
                color: black;
                border-radius: 20px;
                padding: 2px 6px;
                font-size: 12px;
                margin-right: 10px;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
              }
            `}} />
            <div className="h-full relative overflow-y-auto">
              <RichTextPlugin
                contentEditable={
                  <ContentEditable
                    className="prose prose-slate w-full min-w-full max-w-none py-5 text-base leading-relaxed focus:outline-none focus-visible:ring-0 dark:prose-invert"
                    style={{
                      whiteSpace: "pre-wrap",
                      caretColor: accentColor,
                      minHeight: "100%",
                      paddingLeft: "24px",
                      paddingRight: "24px",
                      color: theme.textPrimary,
                    }}
                  />
                }
                placeholder={
          <div className="pointer-events-none absolute left-6 top-5 text-sm" style={{ color: theme.textMuted }}>
            {PLACEHOLDER_TEXT}
          </div>
                }
                ErrorBoundary={({ children }) => <>{children}</>}
              />
              <HistoryPlugin />
              <ListPlugin />
              {!readOnly && <SpeakerLineEnterPlugin getSpeakerColor={getSpeakerColor} />}
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
