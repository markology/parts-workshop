/**
 * Toolbar Plugin for Journal Editor
 *
 * Provides a rich text formatting toolbar with:
 * - Text formatting: Bold, Italic, Underline
 * - Bullet list toggle (smart Notion-style behavior)
 * - Text color picker with preset colors
 *
 * The toolbar automatically syncs its state with the editor selection,
 * showing which formats are active in the current selection.
 */

"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useTheme } from "@/features/workspace/hooks/useTheme";
import { SquareUserRound, Plus, ChevronDown, X, User } from "lucide-react";
import { ImpressionType } from "@/features/workspace/types/Impressions";
import {
  EditorState,
  LexicalEditor,
  LexicalNode,
  TextNode,
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  SELECTION_CHANGE_COMMAND,
  COMMAND_PRIORITY_LOW,
  IS_BOLD,
  IS_ITALIC,
  IS_UNDERLINE,
} from "lexical";
import {
  $patchStyleText,
  $getSelectionStyleValueForProperty,
} from "@lexical/selection";
import { mergeRegister } from "@lexical/utils";
import { $isListNode } from "@lexical/list";
import { SMART_TOGGLE_BULLET_LIST } from "../commands/smartList";
import {
  $getRoot,
  $createTextNode,
  $createParagraphNode,
  $createRangeSelection,
  $setSelection,
} from "lexical";
import {
  SpeakerLineNode,
  $createSpeakerLineNode,
  $isSpeakerLineNode,
} from "../SpeakerLineNode";

/* ============================================================================
 * Color Picker Component
 * ============================================================================ */

/**
 * Special marker for theme-aware default color.
 * When selected, uses CSS variable var(--theme-text) which adapts to light/dark theme.
 */
const THEME_DEFAULT_COLOR = "theme-default";
const THEME_DEFAULT_CSS_VAR = "var(--theme-text)";

/**
 * Preset color options for the text color picker.
 * First option is theme-aware default (black in light mode, white in dark mode).
 * Includes various accent colors.
 */
const PRESET_COLORS = [
  THEME_DEFAULT_COLOR, // Theme-aware default
  "#EF4444", // Red
  "#3B82F6", // Blue
  "#10B981", // Green
  "#F59E0B", // Orange
  "#8B5CF6", // Purple
  "#EC4899", // Pink
];

/**
 * Color Picker Component
 *
 * A dropdown color picker that displays preset colors and allows resetting
 * to the default theme color. The picker automatically closes when clicking
 * outside of it.
 *
 * @param activeColor - Currently selected color (null = default theme color)
 * @param onColorChange - Callback when a color is selected
 * @param disabled - Whether the picker is disabled
 */
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

  // Close picker when clicking outside
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

  /**
   * Determines if a color is dark (needs white text for contrast).
   * Uses relative luminance formula: 0.299*R + 0.587*G + 0.114*B
   *
   * @param color - Hex color string (e.g., "#FF0000")
   * @returns true if color is dark (luminance < 0.5)
   */
  const isDarkColor = (color: string | null): boolean => {
    if (!color) return true;
    const hex = color.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance < 0.5;
  };

  // Helper to get computed value of --theme-text CSS variable
  const getThemeTextColor = (): string => {
    if (typeof window !== "undefined") {
      const root = document.documentElement;
      const computed = getComputedStyle(root)
        .getPropertyValue("--theme-text")
        .trim();
      // CSS variables return with spaces, so clean it up
      // If it's "black" or "white", return the hex equivalent for comparison
      if (computed === "black") return "#000000";
      if (computed === "white") return "#ffffff";
      return computed || theme.textPrimary;
    }
    return theme.textPrimary;
  };

  // Determine display color and text contrast
  // If activeColor is theme-default CSS var, null, or the THEME_DEFAULT_COLOR marker, use computed theme text color
  const themeTextColor = getThemeTextColor();
  const resolvedColor =
    activeColor === THEME_DEFAULT_COLOR ||
    activeColor === THEME_DEFAULT_CSS_VAR ||
    activeColor === null
      ? themeTextColor
      : activeColor;
  const displayColor = resolvedColor || themeTextColor;
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
              {PRESET_COLORS.map((color) => {
                // For theme-default, use current theme.textPrimary color
                // For theme-default option, use computed CSS variable value for display
                const themeTextColorForDisplay =
                  typeof window !== "undefined"
                    ? (() => {
                        const root = document.documentElement;
                        const computed = getComputedStyle(root)
                          .getPropertyValue("--theme-text")
                          .trim();
                        if (computed === "black") return "#000000";
                        if (computed === "white") return "#ffffff";
                        return computed || theme.textPrimary;
                      })()
                    : theme.textPrimary;
                const displayColorValue =
                  color === THEME_DEFAULT_COLOR
                    ? themeTextColorForDisplay
                    : color;

                // Check if this option is active
                const isActive =
                  activeColor === color ||
                  (color === THEME_DEFAULT_COLOR &&
                    (activeColor === null ||
                      activeColor === THEME_DEFAULT_CSS_VAR ||
                      activeColor === themeTextColorForDisplay));

                return (
                  <button
                    key={color}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      // Convert theme-default string to CSS variable when storing
                      onColorChange(
                        color === THEME_DEFAULT_COLOR
                          ? THEME_DEFAULT_CSS_VAR
                          : color
                      );
                      setIsOpen(false);
                    }}
                    className={`relative h-8 w-8 rounded-full border transition-all duration-150 ${
                      isActive
                        ? "scale-105 shadow-sm"
                        : "hover:scale-105 hover:shadow-sm"
                    }`}
                    style={{
                      backgroundColor: displayColorValue,
                      borderColor: isActive
                        ? "var(--theme-accent)"
                        : "var(--theme-border)",
                    }}
                    title={
                      color === THEME_DEFAULT_COLOR
                        ? "Default (adapts to theme)"
                        : color
                    }
                  />
                );
              })}
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

/* ============================================================================
 * Formatting Helpers
 * ============================================================================ */

/**
 * Supported text format types.
 */
type Format = "bold" | "italic" | "underline";

/**
 * Mapping of format types to their Lexical format flags.
 */
const FORMAT_FLAG: Record<Format, number> = {
  bold: IS_BOLD,
  italic: IS_ITALIC,
  underline: IS_UNDERLINE,
};

/**
 * Adds a format flag to a text node using bitwise OR.
 *
 * @param node - The text node to format
 * @param format - The format type to add
 */
function addFormat(node: TextNode, format: Format) {
  const flag = FORMAT_FLAG[format];
  node.setFormat(node.getFormat() | flag);
}

/**
 * Removes a format flag from a text node using bitwise AND with NOT.
 *
 * @param node - The text node to unformat
 * @param format - The format type to remove
 */
function removeFormat(node: TextNode, format: Format) {
  const flag = FORMAT_FLAG[format];
  node.setFormat(node.getFormat() & ~flag);
}

/**
 * Splits partially-selected boundary text nodes so formatting applies ONLY
 * to the highlighted characters (not outside the selection).
 *
 * This is crucial for proper formatting behavior. When a user selects part
 * of a text node, we need to split it at the selection boundaries so that
 * formatting only affects the selected portion.
 *
 * Example: If "Hello World" is selected from "Hello World!", we split to:
 * - "Hello World" (selected, will be formatted)
 * - "!" (not selected, won't be formatted)
 *
 * @param selection - The current Lexical selection
 * @returns Array of text nodes that are fully within the selection
 */
function getSelectedTextNodes(selection: any): TextNode[] {
  const isBackward = selection.isBackward();
  const startPoint = isBackward ? selection.focus : selection.anchor;
  const endPoint = isBackward ? selection.anchor : selection.focus;

  const startNode = startPoint.getNode();
  const endNode = endPoint.getNode();

  const sizeOf = (n: TextNode) => n.getTextContentSize();

  // Split text nodes at selection boundaries
  if ($isTextNode(startNode) && $isTextNode(endNode)) {
    if (startNode === endNode) {
      // Selection is within a single text node
      const a = Math.min(startPoint.offset, endPoint.offset);
      const b = Math.max(startPoint.offset, endPoint.offset);
      // Only split if selection doesn't cover the entire node
      if (a !== 0 || b !== sizeOf(startNode)) {
        startNode.splitText(a, b);
      }
    } else {
      // Selection spans multiple text nodes
      // Split at start boundary if needed
      const startOffset = startPoint.offset;
      if (startOffset !== 0 && startOffset !== sizeOf(startNode)) {
        startNode.splitText(startOffset);
      }

      // Split at end boundary if needed
      const endOffset = endPoint.offset;
      if (endOffset !== 0 && endOffset !== sizeOf(endNode)) {
        endNode.splitText(endOffset);
      }
    }
  }

  // Return all text nodes that are fully within the selection
  return selection.getNodes().filter($isTextNode) as TextNode[];
}

/**
 * Toggles a format uniformly across the selection.
 *
 * This implements "smart" formatting behavior:
 * - For collapsed selection (caret): uses Lexical's built-in toggle
 * - For range selection: implements uniform toggle logic:
 *   - If ALL selected text has the format → remove it from all
 *   - If ANY selected text lacks the format → add it to all
 *
 * This ensures consistent formatting across mixed selections (e.g., if some
 * text is bold and some isn't, clicking bold will make ALL selected text bold).
 *
 * @param editor - The Lexical editor instance
 * @param format - The format type to toggle
 */
function toggleFormatUniform(editor: LexicalEditor, format: Format) {
  editor.update(() => {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) return;

    // Collapsed selection (caret): Lexical's built-in toggle works correctly
    if (selection.isCollapsed()) {
      selection.formatText(format);
      return;
    }

    // Range selection: implement uniform toggle logic
    const textNodes = getSelectedTextNodes(selection);
    if (textNodes.length === 0) return;

    // Check if all selected text nodes have the format
    const allHave = textNodes.every((n) => n.hasFormat(format));

    if (allHave) {
      // All have format → remove from all
      textNodes.forEach((n) => removeFormat(n, format));
    } else {
      // Some lack format → add to all that don't have it
      textNodes.forEach((n) => {
        if (!n.hasFormat(format)) addFormat(n, format);
      });
    }
  });
}

/* ============================================================================
 * Main Toolbar Plugin
 * ============================================================================ */

/**
 * Toolbar Plugin
 *
 * Provides formatting controls for the editor. The toolbar automatically
 * syncs its state with the current selection, showing which formats are
 * active. It listens to both selection changes and editor updates to stay
 * in sync.
 *
 * Features:
 * - Bold, Italic, Underline formatting (with uniform toggle behavior)
 * - Smart bullet list toggle (Notion-style)
 * - Text color picker
 */
interface ToolbarPluginProps {
  partNodes?: Array<{ id: string; label: string }>;
  allPartNodes?: Array<{ id: string; label: string }>;
  selectedSpeakers?: string[];
  activeSpeaker?: string | null;
  onToggleSpeaker?: (speakerId: string) => void;
  nodeId?: string;
  nodeType?: ImpressionType | "part" | "tension" | "interaction";
}

/**
 * Generates a consistent color for a speaker based on their ID.
 * Uses golden angle distribution for visually distinct colors.
 */
function getSpeakerColor(
  speakerId: string,
  theme: ReturnType<typeof useTheme>,
  partNodes?: Array<{ id: string; label: string }>,
  allPartNodes?: Array<{ id: string; label: string }>
): string {
  if (speakerId === "self") {
    return theme.info; // Blue for self
  }
  if (speakerId === "unknown") {
    return theme.textMuted; // Muted color for unknown
  }
  // Generate color for parts - use allPartNodes for consistent color across all parts
  const allParts = allPartNodes || partNodes || [];
  const partIndex = allParts.findIndex((p) => p.id === speakerId);
  if (partIndex >= 0) {
    // Use golden angle for color distribution to ensure different colors
    // Use 58% lightness as a middle ground that works for both themes
    const hue = (partIndex * 137.508) % 360;
    return `hsl(${hue}, 65%, 58%)`;
  }
  // Fallback color if part not found
  return theme.error || "rgb(239, 68, 68)";
}

export default function ToolbarPlugin({
  partNodes = [],
  allPartNodes,
  selectedSpeakers = [],
  activeSpeaker,
  onToggleSpeaker,
  nodeId,
  nodeType,
}: ToolbarPluginProps = {}) {
  const [editor] = useLexicalComposerContext();
  const theme = useTheme();

  // Track which formats are active in the current selection
  const [formats, setFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    list: false,
  });

  // Manage active color state internally
  const [activeColor, setActiveColor] = useState<string | null>(
    theme.textPrimary
  );
  const [showAddPartDropdown, setShowAddPartDropdown] = useState(false);
  const [addedPartIds, setAddedPartIds] = useState<string[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get default speakers based on journal node type:
  // - Impression (emotion, thought, sensation, behavior, other): Only Self
  // - Part: The part itself + Self
  // - Tension/Interaction: Self + all parts involved in the relationship
  const defaultSpeakers = useMemo(() => {
    const speakers = [
      { id: "self", label: "Self", isSelf: true, isUnknown: false },
    ];

    // For part nodes, add the part itself
    if (nodeType === "part" && nodeId && partNodes) {
      const targetPart = partNodes.find((p) => p.id === nodeId);
      if (targetPart) {
        speakers.push({
          id: targetPart.id,
          label: targetPart.label,
          isSelf: false,
          isUnknown: false,
        });
      }
      return speakers;
    }

    // For tension/interaction, add all parts from partNodes (these are the parts involved in the relationship)
    if ((nodeType === "tension" || nodeType === "interaction") && partNodes) {
      partNodes.forEach((part) => {
        if (!speakers.find((s) => s.id === part.id)) {
          speakers.push({
            id: part.id,
            label: part.label,
            isSelf: false,
            isUnknown: false,
          });
        }
      });
      return speakers;
    }

    // For impression types (emotion, thought, sensation, behavior, other) or undefined, only Self is relevant
    return speakers;
  }, [partNodes, nodeId, nodeType]);

  // Get added parts as speaker objects (for rendering as pills in toolbar)
  const addedSpeakers = useMemo(() => {
    return addedPartIds
      .map((partId) => {
        if (partId === "unknown") {
          return {
            id: "unknown",
            label: "Unknown",
            isSelf: false,
            isUnknown: true,
          };
        }
        const part = allPartNodes?.find((p) => p.id === partId);
        return part
          ? {
              id: part.id,
              label: part.label,
              isSelf: false,
              isUnknown: false,
            }
          : null;
      })
      .filter(
        (
          p
        ): p is {
          id: string;
          label: string;
          isSelf: boolean;
          isUnknown: boolean;
        } => p !== null
      );
  }, [addedPartIds, allPartNodes]);

  // Get parts available in dropdown (only parts NOT already added or in defaults)
  const availablePartsToAdd = useMemo(() => {
    const defaultPartIds = new Set(defaultSpeakers.map((s) => s.id));
    const allShownIds = new Set([
      ...Array.from(defaultPartIds),
      ...addedPartIds,
    ]);

    // Get parts from allPartNodes that are not already shown
    const otherParts = (allPartNodes || [])
      .filter((p) => !allShownIds.has(p.id))
      .map((p) => ({
        id: p.id,
        label: p.label,
        isUnknown: false,
      }));

    // Always include Unknown in dropdown if not already added
    const unknownAvailable = !addedPartIds.includes("unknown");

    return [
      ...otherParts, // Other available parts
      ...(unknownAvailable
        ? [{ id: "unknown", label: "Unknown", isUnknown: true }]
        : []),
    ];
  }, [allPartNodes, defaultSpeakers, addedPartIds]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowAddPartDropdown(false);
      }
    };

    if (showAddPartDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showAddPartDropdown]);

  const handleAddPart = useCallback((partId: string) => {
    setAddedPartIds((prev) => [...prev, partId]);
    setShowAddPartDropdown(false);
  }, []);

  const handleSpeakerClick = useCallback(
    (speaker: {
      id: string;
      label: string;
      isSelf: boolean;
      isUnknown: boolean;
    }) => {
      const isActive = activeSpeaker === speaker.id;
      const speakerColor = getSpeakerColor(
        speaker.id,
        theme,
        partNodes,
        allPartNodes
      );

      // If clicking the active speaker, deselect it
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
              const rangeSelection = $createRangeSelection();
              rangeSelection.anchor.set(newParagraph.getKey(), 0, "element");
              rangeSelection.focus.set(newParagraph.getKey(), 0, "element");
              $setSelection(rangeSelection);
            } else {
              const parent = anchorNode.getParent();
              if (parent && parent !== root) {
                parent.insertAfter(newParagraph);
              } else {
                root.append(newParagraph);
              }
              const rangeSelection = $createRangeSelection();
              rangeSelection.anchor.set(newParagraph.getKey(), 0, "element");
              rangeSelection.focus.set(newParagraph.getKey(), 0, "element");
              $setSelection(rangeSelection);
            }
          } else {
            root.append(newParagraph);
            const rangeSelection = $createRangeSelection();
            rangeSelection.anchor.set(newParagraph.getKey(), 0, "element");
            rangeSelection.focus.set(newParagraph.getKey(), 0, "element");
            $setSelection(rangeSelection);
          }
        });

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

        // Create and insert the speaker label with bold
        const labelText = $createTextNode(`${speaker.label}: `);
        labelText.setFormat("bold");
        speakerLine.append(labelText);

        // Insert an empty non-bold text node after the label for future typing
        const contentText = $createTextNode("");
        contentText.setStyle(`color: ${speakerColor}`);
        speakerLine.append(contentText);

        // Insert the speaker line after current selection or at end
        const firstChild = root.getFirstChild();
        const isEmptyEditor =
          !firstChild ||
          (firstChild.getType() === "paragraph" &&
            firstChild.getTextContent().trim() === "");

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

        // Set selection to the empty content text node
        const rangeSelection = $createRangeSelection();
        rangeSelection.anchor.set(contentText.getKey(), 0, "text");
        rangeSelection.focus.set(contentText.getKey(), 0, "text");
        $setSelection(rangeSelection);

        // Apply color to future typing
        $patchStyleText(rangeSelection, { color: speakerColor });
      });

      // Toggle speaker in parent state
      onToggleSpeaker?.(speaker.id);
    },
    [editor, activeSpeaker, onToggleSpeaker, theme, partNodes, allPartNodes]
  );

  /**
   * Reads the current editor state and updates toolbar button states.
   *
   * This function:
   * 1. Checks if selection is in a list (for list button state)
   * 2. Checks text formatting (bold, italic, underline)
   * 3. For range selections, only shows format as active if ALL text has it
   * 4. Reads the current text color from selection styles
   *
   * @param editorState - The current editor state to read from
   */
  const readToolbarState = useCallback(
    (editorState: EditorState) => {
      editorState.read(() => {
        const selection = $getSelection();

        // No range selection: clear all format indicators
        if (!$isRangeSelection(selection)) {
          setFormats({
            bold: false,
            italic: false,
            underline: false,
            list: false,
          });
          return;
        }

        // Check if selection is inside a list
        // Traverse up from anchor node to find list node
        let inList = false;
        let node: LexicalNode | null = selection.anchor.getNode();
        while (node) {
          if ($isListNode(node)) {
            inList = true;
            break;
          }
          node = node.getParent();
        }

        // Check text formatting
        // Start with selection-level format check
        let bold = selection.hasFormat("bold");
        let italic = selection.hasFormat("italic");
        let underline = selection.hasFormat("underline");

        // For range selections, only show format as active if ALL text nodes have it
        // This provides better UX: button is only "pressed" when entire selection is formatted
        if (!selection.isCollapsed()) {
          const textNodes = selection
            .getNodes()
            .filter($isTextNode) as TextNode[];
          if (textNodes.length > 0) {
            // Require ALL text nodes to have the format for button to be active
            bold = textNodes.every((n) => n.hasFormat("bold"));
            italic = textNodes.every((n) => n.hasFormat("italic"));
            underline = textNodes.every((n) => n.hasFormat("underline"));
          }
        }

        setFormats({ bold, italic, underline, list: inList });

        // Read text color from selection styles
        // This shows the color of the selected text (or null if mixed/no color)
        const selectionStyleColor = $getSelectionStyleValueForProperty(
          selection,
          "color",
          undefined
        );

        // Helper to get computed value of --theme-text CSS variable for comparison
        const getThemeTextColorValue = (): string => {
          if (typeof window !== "undefined") {
            const root = document.documentElement;
            const computed = getComputedStyle(root)
              .getPropertyValue("--theme-text")
              .trim();
            if (computed === "black") return "#000000";
            if (computed === "white") return "#ffffff";
            return computed || theme.textPrimary;
          }
          return theme.textPrimary;
        };

        const themeTextColorValue = getThemeTextColorValue();

        // If color is the CSS variable, matches current theme text color, or is null/undefined,
        // treat it as theme-default. Store as CSS var so it adapts to theme changes.
        let normalizedColor: string | null = null;
        if (selectionStyleColor === THEME_DEFAULT_CSS_VAR) {
          // Already using CSS variable - store as-is
          normalizedColor = THEME_DEFAULT_CSS_VAR;
        } else if (
          selectionStyleColor === themeTextColorValue ||
          selectionStyleColor === null ||
          selectionStyleColor === undefined
        ) {
          // Matches current theme text color or is null/undefined - treat as default
          // Store as CSS var so it adapts to theme changes
          normalizedColor = THEME_DEFAULT_CSS_VAR;
        } else {
          // Specific color value - store as-is
          normalizedColor = selectionStyleColor;
        }
        setActiveColor(normalizedColor);
      });
    },
    [theme]
  );

  // Keep toolbar synced with editor state
  // Listens to both selection changes and editor updates
  useEffect(() => {
    const sync = () => readToolbarState(editor.getEditorState());

    // Initial sync on mount
    sync();

    // Register listeners for selection changes and editor updates
    return mergeRegister(
      // Listen to selection changes (cursor moves, selection changes)
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          sync();
          return false; // Don't prevent other handlers
        },
        COMMAND_PRIORITY_LOW
      ),
      // Listen to editor updates (content changes, formatting changes)
      editor.registerUpdateListener(({ editorState }) => {
        readToolbarState(editorState);
      })
    );
  }, [editor, readToolbarState]);

  /**
   * Applies a text color to the current selection.
   *
   * @param color - Color to apply (null = reset to theme default)
   */
  const applyColor = (color: string | null) => {
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;

      // Apply color: use CSS variable for default, otherwise use the provided color
      const colorToApply =
        color === null || color === THEME_DEFAULT_CSS_VAR
          ? THEME_DEFAULT_CSS_VAR
          : color;
      const styles = { color: colorToApply };
      $patchStyleText(selection, styles);
    });

    // Update indicator immediately (listeners will also update it)
    // Normalize null to CSS var for consistency
    setActiveColor(
      color === null || color === THEME_DEFAULT_CSS_VAR
        ? THEME_DEFAULT_CSS_VAR
        : color
    );
  };

  /**
   * Returns style object for toolbar buttons based on active state.
   *
   * Active buttons have a background color and shadow to indicate they're pressed.
   * Inactive buttons are transparent with secondary text color.
   *
   * @param isActive - Whether the button represents an active format
   * @returns Style object for the button
   */
  const activeButtonStyle = (isActive: boolean) => {
    if (!isActive) {
      return {
        backgroundColor: "transparent",
        color: "var(--theme-text-secondary)",
        boxShadow: "none",
        // border: "1px solid transparent",
      } as const;
    }

    return {
      backgroundColor: "var(--theme-workspace)",
      color: "var(--theme-text-primary)",
      boxShadow: "0 1px 2px rgba(0, 0, 0, 0.08)",
    } as const;
  };

  // Return the toolbar JSX (plugins can return JSX)
  return (
    <div className="sticky top-0 z-10 flex flex-wrap items-center gap-3 rounded-xl border px-4 py-3 shadow-sm backdrop-blur border-[var(--theme-border)] bg-[var(--theme-elevated)]">
      {/* Bold Button */}
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault(); // Prevent editor from losing focus
          toggleFormatUniform(editor, "bold");
        }}
        className="rounded-md px-2.5 py-1 text-sm font-medium"
        style={{
          ...activeButtonStyle(formats.bold),
          transition: "none !important", // Disable transitions for instant feedback
        }}
        title="Bold"
      >
        <span className="font-semibold">B</span>
      </button>

      {/* Italic Button */}
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

      {/* Underline Button */}
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

      {/* Bullet List Button */}
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          // Dispatch smart list toggle command (handled by SmartListPlugin)
          editor.dispatchCommand(SMART_TOGGLE_BULLET_LIST, undefined);
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

      {/* Visual Separator */}
      <div className="h-5 w-px bg-[var(--theme-border)]" />

      {/* Color Picker */}
      <ColorPicker
        activeColor={activeColor}
        onColorChange={applyColor}
        disabled={false}
      />

      {/* Speaker Pills - only show default speakers (Self + relevant parts) */}
      {defaultSpeakers.length > 0 && (
        <>
          {/* Visual Separator */}
          <div className="h-5 w-px bg-[var(--theme-border)]" />

          {/* Speaker Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Non-Self default speakers (relevant parts) */}
            {defaultSpeakers
              .filter((s) => !s.isSelf)
              .map((speaker) => {
                const isActive = activeSpeaker === speaker.id;
                const speakerColor = getSpeakerColor(
                  speaker.id,
                  theme,
                  partNodes,
                  allPartNodes
                );

                return (
                  <button
                    key={speaker.id}
                    type="button"
                    onClick={() => handleSpeakerClick(speaker)}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium ${
                      isActive ? "" : "hover:scale-102"
                    }`}
                    style={{
                      backgroundColor: isActive
                        ? speakerColor
                        : "var(--theme-surface)",
                      color: isActive ? "white" : "var(--theme-text-secondary)",
                      borderColor: isActive
                        ? speakerColor
                        : "var(--theme-border)",
                      boxShadow: isActive
                        ? `0 4px 12px ${speakerColor}40`
                        : "0 1px 3px rgba(0, 0, 0, 0.1)",
                      transition: "none !important",
                    }}
                    title={`Switch to ${speaker.label}`}
                  >
                    <SquareUserRound size={12} />
                    {speaker.label}
                  </button>
                );
              })}

            {/* Self pill */}
            {defaultSpeakers
              .filter((s) => s.isSelf)
              .map((speaker) => {
                const isActive = activeSpeaker === speaker.id;
                const speakerColor = getSpeakerColor(
                  speaker.id,
                  theme,
                  partNodes,
                  allPartNodes
                );

                return (
                  <button
                    key={speaker.id}
                    type="button"
                    onClick={() => handleSpeakerClick(speaker)}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium ${
                      isActive ? "scale-105" : "hover:scale-102"
                    }`}
                    style={{
                      backgroundColor: isActive
                        ? speakerColor
                        : "var(--theme-surface)",
                      color: isActive ? "white" : "var(--theme-text-secondary)",
                      borderColor: isActive
                        ? speakerColor
                        : "var(--theme-border)",
                      boxShadow: isActive
                        ? `0 4px 12px ${speakerColor}40`
                        : "0 1px 3px rgba(0, 0, 0, 0.1)",
                      transition: "none !important",
                    }}
                    title={`Switch to ${speaker.label}`}
                  >
                    <User size={12} />
                    {speaker.label}
                  </button>
                );
              })}

            {/* Added parts (from dropdown) - shown as pills with X button */}
            {addedSpeakers.map((speaker) => {
              const isActive = activeSpeaker === speaker.id;
              const speakerColor = getSpeakerColor(
                speaker.id,
                theme,
                partNodes,
                allPartNodes
              );

              return (
                <button
                  key={speaker.id}
                  type="button"
                  onClick={() => handleSpeakerClick(speaker)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium ${
                    isActive ? "scale-105" : "hover:scale-102"
                  }`}
                  style={{
                    backgroundColor: isActive
                      ? speakerColor
                      : "var(--theme-surface)",
                    color: isActive ? "white" : "var(--theme-text-secondary)",
                    borderColor: isActive
                      ? speakerColor
                      : "var(--theme-border)",
                    boxShadow: isActive
                      ? `0 4px 12px ${speakerColor}40`
                      : "0 1px 3px rgba(0, 0, 0, 0.1)",
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
                  <X
                    size={10}
                    className="ml-0.5 opacity-70 hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      setAddedPartIds((prev) =>
                        prev.filter((id) => id !== speaker.id)
                      );
                      // If this was the active speaker, deselect it
                      if (isActive) {
                        onToggleSpeaker?.(speaker.id);
                      }
                    }}
                  />
                </button>
              );
            })}

            {/* More dropdown - rightmost */}
            {availablePartsToAdd.length > 0 && (
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setShowAddPartDropdown(!showAddPartDropdown)}
                  className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium hover:scale-102 border-[var(--theme-border)] bg-[var(--theme-surface)] text-[var(--theme-text-secondary)]"
                  style={{
                    transition: "none !important",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor =
                      "var(--theme-button-hover)";
                    e.currentTarget.style.color = "var(--theme-text-primary)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor =
                      "var(--theme-surface)";
                    e.currentTarget.style.color = "var(--theme-text-secondary)";
                  }}
                  title="More speakers"
                >
                  <Plus size={12} />
                  <span>More</span>
                  <ChevronDown
                    size={10}
                    className={showAddPartDropdown ? "rotate-180" : ""}
                  />
                </button>

                {showAddPartDropdown && (
                  <div className="absolute top-full left-0 mt-2 z-50 min-w-[200px] rounded-lg border shadow-lg overflow-hidden border-[var(--theme-border)] bg-[var(--theme-card)]">
                    <div className="max-h-60 overflow-y-auto">
                      {availablePartsToAdd.map((part) => {
                        const partId = part.isUnknown ? "unknown" : part.id;
                        const speaker = {
                          id: partId,
                          label: part.label,
                          isSelf: false,
                          isUnknown: part.isUnknown,
                        };

                        return (
                          <button
                            key={part.id || (part.isUnknown ? "unknown" : "")}
                            type="button"
                            onClick={() => {
                              // Add to toolbar and use the speaker
                              handleAddPart(partId);
                              handleSpeakerClick(speaker);
                              setShowAddPartDropdown(false);
                            }}
                            className="w-full text-left px-3 py-2 text-xs font-medium text-[var(--theme-text-primary)]"
                            style={{
                              transition: "none !important",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor =
                                "var(--theme-button-hover)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor =
                                "transparent";
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
                        );
                      })}
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
