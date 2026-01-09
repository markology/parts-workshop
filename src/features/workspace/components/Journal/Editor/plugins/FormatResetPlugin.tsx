/**
 * Format Reset Plugin
 *
 * Reverts all formatting to default when:
 * - Document becomes empty after deletion
 * - Cursor is at position 0 in full document
 */

"use client";

import { useEffect, useRef } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  $getRoot,
  $createParagraphNode,
  $createTextNode,
  $createRangeSelection,
  $setSelection,
  COMMAND_PRIORITY_LOW,
} from "lexical";
import { $patchStyleText } from "@lexical/selection";
import { KEY_BACKSPACE_COMMAND, KEY_DELETE_COMMAND } from "lexical";

/**
 * Removes all formatting from text nodes
 */
function removeAllFormatting(node: any) {
  if ($isTextNode(node)) {
    // Remove all styles (including color)
    node.setStyle("");
    // Remove all formats (bold, italic, underline)
    if (node.hasFormat("bold")) {
      node.toggleFormat("bold");
    }
    if (node.hasFormat("italic")) {
      node.toggleFormat("italic");
    }
    if (node.hasFormat("underline")) {
      node.toggleFormat("underline");
    }
  }
  // Recursively process children
  if ("getChildren" in node && typeof (node as any).getChildren === "function") {
    const children = (node as any).getChildren();
    for (const child of children) {
      removeAllFormatting(child);
    }
  }
}

/**
 * Checks if document is effectively empty (no content or only empty paragraphs)
 */
function isDocumentEffectivelyEmpty(root: any): boolean {
  const rootChildren = root.getChildren();
  if (rootChildren.length === 0) {
    return true;
  }
  
  // Check if all children are empty paragraphs
  for (const child of rootChildren) {
    const textContent = child.getTextContent?.() || "";
    if (textContent.trim() !== "") {
      return false;
    }
  }
  
  return true;
}

export default function FormatResetPlugin() {
  const [editor] = useLexicalComposerContext();
  const isResettingRef = useRef(false); // Use ref to persist across renders

  useEffect(() => {
    // Use update listener to check after deletions
    const unregisterUpdateListener = editor.registerUpdateListener(
      ({ editorState, dirtyElements }) => {
        // Only check after updates that might have deleted content
        // Skip if we're already resetting to prevent infinite loops
        if (dirtyElements.size === 0 || isResettingRef.current) {
          return;
        }

        editorState.read(() => {
          const root = $getRoot();
          
          // Check if document is effectively empty
          if (isDocumentEffectivelyEmpty(root)) {
            isResettingRef.current = true;
            
            // Use requestAnimationFrame to defer the update and avoid nested updates
            requestAnimationFrame(() => {
              editor.update(() => {
                const rootAfterCheck = $getRoot();
                const rootChildren = rootAfterCheck.getChildren();
                
                // Remove formatting from any remaining nodes
                for (const child of rootChildren) {
                  removeAllFormatting(child);
                }
                
                // If document is completely empty, create a clean paragraph
                if (rootChildren.length === 0) {
                  const paragraph = $createParagraphNode();
                  const textNode = $createTextNode("");
                  paragraph.append(textNode);
                  rootAfterCheck.append(paragraph);

                  // Position cursor
                  const rangeSelection = $createRangeSelection();
                  rangeSelection.anchor.set(textNode.getKey(), 0, "text");
                  rangeSelection.focus.set(textNode.getKey(), 0, "text");
                  $setSelection(rangeSelection);
                } else {
                  // Document has empty paragraphs - ensure they have no formatting
                  // and reset selection formatting
                  const selection = $getSelection();
                  if ($isRangeSelection(selection)) {
                    $patchStyleText(selection, { color: "" });
                  }
                }
              }, { discrete: true }); // Use discrete update to prevent triggering listeners
              
              // Reset flag after a short delay
              setTimeout(() => {
                isResettingRef.current = false;
              }, 10);
            });
          }
        });
      }
    );

    // Also handle cursor at position 0 in first node
    const handleFormatReset = (event: KeyboardEvent | null) => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) {
        return false;
      }

      // Check if cursor is at position 0 in the first node
      const isAtStart = selection.isCollapsed() && selection.anchor.offset === 0;
      if (!isAtStart) {
        return false;
      }

      const root = $getRoot();
      const rootChildren = root.getChildren();
      if (rootChildren.length === 0) {
        return false;
      }

      const anchorNode = selection.anchor.getNode();
      const firstNode = rootChildren[0];
      const topLevelElement = anchorNode.getTopLevelElement();
      
      if (firstNode === topLevelElement) {
        editor.update(() => {
          // Reset selection formatting
          const currentSelection = $getSelection();
          if ($isRangeSelection(currentSelection)) {
            $patchStyleText(currentSelection, { color: "" });
          }
        });
      }

      return false; // Don't prevent default
    };

    const unregisterBackspace = editor.registerCommand(
      KEY_BACKSPACE_COMMAND,
      handleFormatReset,
      COMMAND_PRIORITY_LOW
    );

    const unregisterDelete = editor.registerCommand(
      KEY_DELETE_COMMAND,
      handleFormatReset,
      COMMAND_PRIORITY_LOW
    );

    return () => {
      unregisterUpdateListener();
      unregisterBackspace();
      unregisterDelete();
    };
  }, [editor]);

  return null;
}

