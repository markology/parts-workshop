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
  $insertNodes,
  $createRangeSelection,
  $setSelection,
  TextNode,
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
  selectedSpeakers?: string[];
  activeSpeaker?: string | null;
  onToggleSpeaker?: (speakerId: string) => void;
  partNodes?: Array<{ id: string; label: string }>;
  allPartNodes?: Array<{ id: string; label: string }>;
  nodeId?: string;
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
}: {
  darkMode: boolean;
  activeColor: string | null;
  onColorChange: (color: string | null) => void;
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
        className="relative w-8 rounded-md transition-all duration-200"
        style={{
          backgroundColor: displayColor,
          border: "none",
          height: "24px",
          verticalAlign: "bottom",
          boxShadow: isOpen ? "0 2px 4px rgba(0, 0, 0, 0.1)" : "none",
        }}
        onMouseEnter={(e) => {
          if (!isOpen) {
            e.currentTarget.style.opacity = "0.9";
          }
        }}
        onMouseLeave={(e) => {
          if (!isOpen) {
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
}) {
  const [editor] = useLexicalComposerContext();
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

  // Get speaker color
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
    
    // Get speaker label and color
    const speakerLabel = partId === "unknown" 
      ? "Unknown" 
      : (allPartNodes?.find(p => p.id === partId)?.label || partNodes?.find(p => p.id === partId)?.label || "Part");
    const speakerColor = getSpeakerColor(partId);
    
    // Insert [part name]: with the speaker's color and bold
    editor.update(() => {
      // Focus the editor if it's not focused
      editor.focus();
      
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        // Clear any existing color formatting first
        $patchStyleText(selection, { color: null });
        
        // Insert the speaker label with color and bold
        const textNode = $createTextNode(`[${speakerLabel}]: `);
        textNode.setStyle(`color: ${speakerColor}`);
        textNode.setFormat("bold");
        selection.insertNodes([textNode]);
        
        // Apply color to future typing (but not bold - only the label is bold)
        $patchStyleText(selection, { color: speakerColor });
      } else {
        // If no selection, try to get one after focusing, or create at end
        const root = $getRoot();
        const rangeSelection = $createRangeSelection();
        const lastChild = root.getLastChild();
        
        if (lastChild && lastChild.getTextContentSize() > 0) {
          // Select the end of the last child
          const textContentSize = lastChild.getTextContentSize();
          rangeSelection.anchor.set(lastChild.getKey(), textContentSize, "text");
          rangeSelection.focus.set(lastChild.getKey(), textContentSize, "text");
        } else if (lastChild) {
          // Last child exists but is empty
          rangeSelection.anchor.set(lastChild.getKey(), 0, "element");
          rangeSelection.focus.set(lastChild.getKey(), 0, "element");
        } else {
          // Empty editor - select root
          rangeSelection.anchor.set(root.getKey(), 0, "element");
          rangeSelection.focus.set(root.getKey(), 0, "element");
        }
        
        // Set the selection
        $setSelection(rangeSelection);
        
        // Insert the speaker label with color and bold
        const textNode = $createTextNode(`[${speakerLabel}]: `);
        textNode.setStyle(`color: ${speakerColor}`);
        textNode.setFormat("bold");
        rangeSelection.insertNodes([textNode]);
        
        // Apply color to future typing
        const newSelection = $getSelection();
        if ($isRangeSelection(newSelection)) {
          $patchStyleText(newSelection, { color: speakerColor });
        }
      }
    });
    
    // Update active color for toolbar indicator
    setActiveColor(speakerColor);
    
    // Switch to the newly added part
    onToggleSpeaker?.(partId);
  }, [addedPartIds, onToggleSpeaker, allPartNodes, partNodes, getSpeakerColor, editor, setActiveColor]);

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

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState, prevEditorState }) => {
      editorState.read(() => {
        const selection = $getSelection();
        const root = $getRoot();

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
            undefined
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

  const theme = useTheme();

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
      onMouseDown={(e) => {
        e.preventDefault();
          formatText("bold");
      }}
      className="rounded-md px-2.5 py-1 text-sm font-medium"
      style={{
        backgroundColor: formats.bold ? theme.accent : 'transparent',
        color: formats.bold ? theme.buttonText : theme.textSecondary,
        boxShadow: formats.bold ? '0 1px 2px rgba(0, 0, 0, 0.1)' : 'none',
        transition: "none !important",
      }}
      onMouseEnter={(e) => {
        if (!formats.bold) {
          e.currentTarget.style.backgroundColor = theme.buttonHover;
          e.currentTarget.style.color = theme.textPrimary;
        }
      }}
      onMouseLeave={(e) => {
        if (!formats.bold) {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.color = theme.textSecondary;
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
          backgroundColor: formats.italic ? theme.accent : 'transparent',
          color: formats.italic ? theme.buttonText : theme.textSecondary,
          boxShadow: formats.italic ? '0 1px 2px rgba(0, 0, 0, 0.1)' : 'none',
          transition: "none !important",
        }}
        onMouseEnter={(e) => {
          if (!formats.italic) {
            e.currentTarget.style.backgroundColor = theme.buttonHover;
            e.currentTarget.style.color = theme.textPrimary;
          }
        }}
        onMouseLeave={(e) => {
          if (!formats.italic) {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = theme.textSecondary;
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
          backgroundColor: formats.underline ? theme.accent : 'transparent',
          color: formats.underline ? theme.buttonText : theme.textSecondary,
          boxShadow: formats.underline ? '0 1px 2px rgba(0, 0, 0, 0.1)' : 'none',
          transition: "none !important",
        }}
        onMouseEnter={(e) => {
          if (!formats.underline) {
            e.currentTarget.style.backgroundColor = theme.buttonHover;
            e.currentTarget.style.color = theme.textPrimary;
          }
        }}
        onMouseLeave={(e) => {
          if (!formats.underline) {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = theme.textSecondary;
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
          backgroundColor: formats.list ? theme.accent : 'transparent',
          color: formats.list ? theme.buttonText : theme.textSecondary,
          boxShadow: formats.list ? '0 1px 2px rgba(0, 0, 0, 0.1)' : 'none',
          transition: "none !important",
        }}
        onMouseEnter={(e) => {
          if (!formats.list) {
            e.currentTarget.style.backgroundColor = theme.buttonHover;
            e.currentTarget.style.color = theme.textPrimary;
          }
        }}
        onMouseLeave={(e) => {
          if (!formats.list) {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = theme.textSecondary;
          }
        }}
        title="Bullet List"
          >
            • List
      </button>

          <div className="h-5 w-px" style={{ backgroundColor: theme.border }} />

      <ColorPicker
        darkMode={darkMode}
        activeColor={activeColor}
        onColorChange={applyColor}
      />

      {allSpeakers.length > 0 && (
        <>
          <div className="h-5 w-px" style={{ backgroundColor: theme.border }} />
          <div className="flex items-center gap-1.5 flex-wrap">
            {allSpeakers.map((speaker) => {
              const isActive = activeSpeaker === speaker.id;
              const speakerColor = getSpeakerColor(speaker.id);

              const handleSpeakerClick = () => {
                // If clicking on an already active speaker, deselect it and remove styles
                if (isActive) {
                  editor.update(() => {
                    // Keep focus in the editor
                    editor.focus();
                    
                    const selection = $getSelection();
                    if ($isRangeSelection(selection)) {
                      // Remove color formatting from current position
                      $patchStyleText(selection, { color: null });
                    }
                  });
                  
                  // Reset active color in toolbar
                  setActiveColor(null);
                  
                  // Toggle speaker off
                  onToggleSpeaker?.(speaker.id);
                  return;
                }
                
                // Insert [part name]: with the speaker's color and bold
                editor.update(() => {
                  // Focus the editor if it's not focused
                  editor.focus();
                  
                  const selection = $getSelection();
                  if ($isRangeSelection(selection)) {
                    // Clear any existing color formatting first
                    $patchStyleText(selection, { color: null });
                    
                    // Insert the speaker label with color and bold
                    const textNode = $createTextNode(`[${speaker.label}]: `);
                    textNode.setStyle(`color: ${speakerColor}`);
                    textNode.setFormat("bold");
                    selection.insertNodes([textNode]);
                    
                    // Apply color to future typing (but not bold - only the label is bold)
                    $patchStyleText(selection, { color: speakerColor });
                  } else {
                    // If no selection, try to get one after focusing, or create at end
                    const root = $getRoot();
                    const rangeSelection = $createRangeSelection();
                    const lastChild = root.getLastChild();
                    
                    if (lastChild && lastChild.getTextContentSize() > 0) {
                      // Select the end of the last child
                      const textContentSize = lastChild.getTextContentSize();
                      rangeSelection.anchor.set(lastChild.getKey(), textContentSize, "text");
                      rangeSelection.focus.set(lastChild.getKey(), textContentSize, "text");
                    } else if (lastChild) {
                      // Last child exists but is empty
                      rangeSelection.anchor.set(lastChild.getKey(), 0, "element");
                      rangeSelection.focus.set(lastChild.getKey(), 0, "element");
                    } else {
                      // Empty editor - select root
                      rangeSelection.anchor.set(root.getKey(), 0, "element");
                      rangeSelection.focus.set(root.getKey(), 0, "element");
                    }
                    
                    // Set the selection
                    $setSelection(rangeSelection);
                    
                    // Insert the speaker label with color and bold
                    const textNode = $createTextNode(`[${speaker.label}]: `);
                    textNode.setStyle(`color: ${speakerColor}`);
                    textNode.setFormat("bold");
                    rangeSelection.insertNodes([textNode]);
                    
                    // Apply color to future typing
                    const newSelection = $getSelection();
                    if ($isRangeSelection(newSelection)) {
                      $patchStyleText(newSelection, { color: speakerColor });
                    }
                  }
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
                        
                        // If the pill was active, remove styles first
                        if (wasActive) {
                          editor.update(() => {
                            // Keep focus in the editor
                            editor.focus();
                            
                            const selection = $getSelection();
                            if ($isRangeSelection(selection)) {
                              // Remove color formatting from current position
                              $patchStyleText(selection, { color: null });
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
             selectedSpeakers={selectedSpeakers}
             activeSpeaker={activeSpeaker}
             onToggleSpeaker={onToggleSpeaker}
             partNodes={partNodes}
             allPartNodes={allPartNodes}
             nodeId={nodeId}
             nodeType={nodeType}
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
