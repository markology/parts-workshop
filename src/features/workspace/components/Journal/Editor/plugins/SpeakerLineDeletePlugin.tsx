/**
 * Speaker Line Delete Plugin - Simplified Version
 *
 * Simplified deletion logic:
 * - Only check anchor and focus points to determine if special rules apply
 * - If anchor OR focus is on a decorator or at start of speaker line → delete entire speaker line
 * - If selection is midway in text → let Lexical handle normal deletion
 * - When deleting speaker line, also delete any selected normal text
 *
 * Note: We no longer search for groups since Enter exits the speaker (doesn't create new speaker lines).
 * Each speaker line is standalone.
 */

"use client";

import { useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  $createParagraphNode,
  $createTextNode,
  $createRangeSelection,
  $setSelection,
  $getRoot,
  KEY_BACKSPACE_COMMAND,
  KEY_DELETE_COMMAND,
  LexicalNode,
  RangeSelection,
  COMMAND_PRIORITY_HIGH,
  SELECTION_CHANGE_COMMAND,
} from "lexical";
import { SpeakerLineNode, $isSpeakerLineNode } from "../SpeakerLineNode";
import {
  SpeakerLabelDecorator,
  $isSpeakerLabelDecorator,
} from "../SpeakerLabelDecorator";

/**
 * Checks if a point (anchor or focus) is on a decorator or at the start of a speaker line
 * Returns the speaker line if found, null otherwise
 */
function isAtSpeakerLineStart(
  node: LexicalNode,
  offset: number
): SpeakerLineNode | null {
  // Check if the node itself is a decorator
  if ($isSpeakerLabelDecorator(node)) {
    const parent = node.getParent();
    if ($isSpeakerLineNode(parent)) {
      return parent;
    }
  }

  // Check if we're at offset 0 in a text node that's the first content after decorator
  if ($isTextNode(node) && offset === 0) {
    const parent = node.getParent();
    if ($isSpeakerLineNode(parent)) {
      const children = parent.getChildren();
      const decoratorIndex = children.findIndex((child) =>
        $isSpeakerLabelDecorator(child)
      );
      if (decoratorIndex >= 0) {
        const firstContentIndex = decoratorIndex + 1;
        if (firstContentIndex < children.length) {
          const firstContentNode = children[firstContentIndex];
          if (firstContentNode === node) {
            return parent;
          }
        }
      }
    }
  }

  // Check if we're at the start of the speaker line element itself
  if ($isSpeakerLineNode(node) && offset === 0) {
    const children = node.getChildren();
    const hasDecorator = children.some((child) =>
      $isSpeakerLabelDecorator(child)
    );
    if (hasDecorator) {
      return node;
    }
  }

  // Check if we're inside a speaker line but not at the start
  // Walk up to find speaker line
  let current: LexicalNode | null = node;
  while (current) {
    if ($isSpeakerLineNode(current)) {
      // Only return if we're at the start (offset 0)
      // If we're midway, return null to let Lexical handle it
      if (offset === 0) {
        return current;
      }
      return null; // Midway in speaker line, let Lexical handle it
    }
    current = current.getParent();
  }

  return null;
}

/**
 * Finds a safe position for the cursor after deleting a speaker line
 * Simple: previous sibling → next sibling → new paragraph if empty
 */
function findSafeCursorPosition(
  root: LexicalNode,
  deletedSpeakerLine: SpeakerLineNode
): { node: LexicalNode; offset: number } | null {
  // Try previous sibling
  const previousSibling = deletedSpeakerLine.getPreviousSibling();
  if (previousSibling && previousSibling.isAttached()) {
    const lastText = findLastTextNode(previousSibling);
    if (lastText && $isTextNode(lastText)) {
      const size = lastText.getTextContentSize();
      return { node: lastText, offset: size };
    }
    return { node: previousSibling, offset: 0 };
  }

  // Try next sibling
  const nextSibling = deletedSpeakerLine.getNextSibling();
  if (nextSibling && nextSibling.isAttached()) {
    const firstText = findFirstTextNode(nextSibling);
    if (firstText && $isTextNode(firstText)) {
      return { node: firstText, offset: 0 };
    }
    return { node: nextSibling, offset: 0 };
  }

  // Fallback: create new paragraph if editor is empty
  const rootChildren = (root as any).getChildren?.() || [];
  if (rootChildren.length === 0) {
    const newPara = $createParagraphNode();
    (root as any).append?.(newPara);
    return { node: newPara, offset: 0 };
  }

  // Last resort: first remaining node
  const firstRemaining = rootChildren[0];
  if (firstRemaining) {
    const firstText = findFirstTextNode(firstRemaining);
    if (firstText && $isTextNode(firstText)) {
      return { node: firstText, offset: 0 };
    }
    return { node: firstRemaining, offset: 0 };
  }

  return null;
}

/**
 * Helper to find last text node in an element
 */
function findLastTextNode(element: LexicalNode): LexicalNode | null {
  if ($isTextNode(element)) {
    return element;
  }
  if ("getChildren" in element) {
    const children = (element as any).getChildren();
    for (let i = children.length - 1; i >= 0; i--) {
      const textNode = findLastTextNode(children[i]);
      if (textNode) return textNode;
    }
  }
  return null;
}

/**
 * Helper to find first text node in an element
 */
function findFirstTextNode(element: LexicalNode): LexicalNode | null {
  if ($isTextNode(element)) {
    return element;
  }
  if ("getChildren" in element) {
    const children = (element as any).getChildren();
    for (let i = 0; i < children.length; i++) {
      const textNode = findFirstTextNode(children[i]);
      if (textNode) return textNode;
    }
  }
  return null;
}

export default function SpeakerLineDeletePlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const handleBackspace = (event: KeyboardEvent | null) => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) {
        return false; // Let Lexical handle non-range selections
      }

      // Only handle speaker line deletion for collapsed selection (normal cursor, not highlighted text)
      if (!selection.isCollapsed()) {
        return false; // Let Lexical handle highlighted text deletion
      }

      // Check anchor and focus points to see if we're at the start of a speaker line
      const anchorNode = selection.anchor.getNode();
      const anchorOffset = selection.anchor.offset;
      const focusNode = selection.focus.getNode();
      const focusOffset = selection.focus.offset;

      // Check if anchor or focus is at the start of a speaker line (decorator or right after it)
      const anchorSpeakerLine = isAtSpeakerLineStart(anchorNode, anchorOffset);
      const focusSpeakerLine = isAtSpeakerLineStart(focusNode, focusOffset);

      // Also check if any selected nodes are decorators (but NOT if they're just inside speaker lines)
      const selectedNodes = selection.getNodes();
      const speakerLinesFromDecorators = new Set<SpeakerLineNode>();
      
      for (const node of selectedNodes) {
        // Only check if node is a decorator itself - don't check if it's just inside a speaker line
        if ($isSpeakerLabelDecorator(node)) {
          const parent = node.getParent();
          if ($isSpeakerLineNode(parent)) {
            speakerLinesFromDecorators.add(parent);
          }
        }
      }

      // Collect unique speaker lines to delete
      // Only delete if we're at the start (decorator or right after it) OR if decorator is selected
      const speakerLinesToDelete = new Set<SpeakerLineNode>();
      if (anchorSpeakerLine) {
        speakerLinesToDelete.add(anchorSpeakerLine);
      }
      if (focusSpeakerLine) {
        speakerLinesToDelete.add(focusSpeakerLine);
      }
      // Add any speaker lines where the decorator itself is selected
      speakerLinesFromDecorators.forEach(line => speakerLinesToDelete.add(line));

      // If no speaker line at anchor/focus, let Lexical handle normal deletion
      if (speakerLinesToDelete.size === 0) {
        return false; // Let Lexical handle normal deletion (it will clean up empty paragraphs)
      }

      // We have speaker lines to delete - handle them
      editor.update(() => {
        const root = $getRoot();
        const speakerLinesArray = Array.from(speakerLinesToDelete);
        const firstSpeakerLine = speakerLinesArray[0];

        // Helper to check if a node is inside a speaker line we're deleting
        const isInSpeakerLineToDelete = (node: LexicalNode): boolean => {
          let current: LexicalNode | null = node;
          while (current) {
            if (
              $isSpeakerLineNode(current) &&
              speakerLinesToDelete.has(current)
            ) {
              return true;
            }
            current = current.getParent();
          }
          return false;
        };

        // Delete all selected nodes that are NOT in speaker lines we're deleting
        // This handles mixed selections (normal text + speaker lines)
        const selectedNodes = selection.getNodes();
        const nodesToDelete: LexicalNode[] = [];

        for (const node of selectedNodes) {
          // Skip decorators (will be deleted with speaker line)
          if ($isSpeakerLabelDecorator(node)) {
            continue;
          }

          // Skip nodes inside speaker lines we're deleting
          if (isInSpeakerLineToDelete(node)) {
            continue;
          }

          // This is normal text/element that should be deleted
          nodesToDelete.push(node);
        }

        // Delete the normal text/elements
        for (const node of nodesToDelete) {
          if (node.isAttached()) {
            // For text nodes, check if we need partial deletion
            if ($isTextNode(node)) {
              const nodeSize = node.getTextContentSize();
              const isAnchor = node === anchorNode;
              const isFocus = node === focusNode;
              const isBackward = selection.isBackward();

              if (isAnchor && isFocus) {
                // Selection is within this single node
                const startOffset = Math.min(anchorOffset, focusOffset);
                const endOffset = Math.max(anchorOffset, focusOffset);
                if (startOffset < endOffset) {
                  node.spliceText(
                    startOffset,
                    endOffset - startOffset,
                    "",
                    true
                  );
                }
              } else if (isAnchor) {
                // This is where selection started
                if (isBackward) {
                  if (anchorOffset > 0) {
                    node.spliceText(0, anchorOffset, "", true);
                  }
                } else {
                  if (anchorOffset < nodeSize) {
                    node.spliceText(
                      anchorOffset,
                      nodeSize - anchorOffset,
                      "",
                      true
                    );
                  }
                }
              } else if (isFocus) {
                // This is where selection ended
                if (isBackward) {
                  if (focusOffset < nodeSize) {
                    node.spliceText(
                      focusOffset,
                      nodeSize - focusOffset,
                      "",
                      true
                    );
                  }
                } else {
                  if (focusOffset > 0) {
                    node.spliceText(0, focusOffset, "", true);
                  }
                }
              } else {
                // Fully selected, remove entire node
                node.remove();
              }
            } else {
              // Element node, remove it
              node.remove();
            }
          }
        }

        // Now delete the speaker lines
        // Replace first speaker line with a clean paragraph (no styles, no data attributes)
        let replacementParagraph: ReturnType<
          typeof $createParagraphNode
        > | null = null;

        if (firstSpeakerLine && firstSpeakerLine.isAttached()) {
          // Create a completely clean paragraph with no styles or attributes
          replacementParagraph = $createParagraphNode();
          
          // Copy any text content from the speaker line (excluding the decorator)
          const children = firstSpeakerLine.getChildren();
          for (const child of children) {
            if (!$isSpeakerLabelDecorator(child) && $isTextNode(child)) {
              const textContent = child.getTextContent();
              if (textContent.trim() !== "") {
                // Create a new text node without any styles
                const cleanTextNode = $createTextNode(textContent);
                replacementParagraph.append(cleanTextNode);
              }
            }
            // Skip decorators and other node types (like line breaks)
          }
          
          // Ensure paragraph has at least an empty text node for cursor positioning
          if (replacementParagraph.getTextContent().trim() === "") {
            const emptyText = $createTextNode("");
            replacementParagraph.append(emptyText);
          }
          
          // Use replace to completely replace the speaker line with the clean paragraph
          // This ensures the speaker line node and all its attributes are removed
          firstSpeakerLine.replace(replacementParagraph);
        }

        // Delete remaining speaker lines
        for (let i = 1; i < speakerLinesArray.length; i++) {
          const node = speakerLinesArray[i];
          if (node.isAttached()) {
            node.remove();
          }
        }

        // Position cursor in the clean paragraph
        if (replacementParagraph) {
          // Find the first text node in the paragraph to position cursor
          const firstTextNode = replacementParagraph.getFirstChild();
          if ($isTextNode(firstTextNode)) {
            const rangeSelection = $createRangeSelection();
            const textContent = firstTextNode.getTextContent();
            const offset = textContent.length; // Position at end of text
            rangeSelection.anchor.set(firstTextNode.getKey(), offset, "text");
            rangeSelection.focus.set(firstTextNode.getKey(), offset, "text");
            $setSelection(rangeSelection);
          } else {
            // Fallback: position at element level
            const rangeSelection = $createRangeSelection();
            rangeSelection.anchor.set(
              replacementParagraph.getKey(),
              0,
              "element"
            );
            rangeSelection.focus.set(replacementParagraph.getKey(), 0, "element");
            $setSelection(rangeSelection);
          }
        } else {
          // Fallback: use safe cursor position
          const cursorPosition = findSafeCursorPosition(root, firstSpeakerLine);
          if (cursorPosition) {
            const rangeSelection = $createRangeSelection();
            const { node, offset } = cursorPosition;

            if ($isTextNode(node)) {
              const nodeSize = node.getTextContentSize();
              const safeOffset = Math.min(Math.max(0, offset), nodeSize);
              rangeSelection.anchor.set(node.getKey(), safeOffset, "text");
              rangeSelection.focus.set(node.getKey(), safeOffset, "text");
            } else {
              rangeSelection.anchor.set(node.getKey(), offset, "element");
              rangeSelection.focus.set(node.getKey(), offset, "element");
            }
            $setSelection(rangeSelection);
          }
        }
      });

      // Note: $setSelection already triggers SELECTION_CHANGE_COMMAND automatically,
      // so ToolbarPlugin will automatically re-read state and reset active speaker
      // No need to manually dispatch it

      if (event) {
        event.preventDefault();
      }
      return true; // Handled
    };

    const unregisterBackspace = editor.registerCommand(
      KEY_BACKSPACE_COMMAND,
      handleBackspace,
      COMMAND_PRIORITY_HIGH
    );

    // DELETE key should use normal Lexical behavior (don't handle speaker line deletion)
    // No need to register DELETE command - let Lexical handle it normally

    return () => {
      unregisterBackspace();
    };
  }, [editor]);

  return null;
}
