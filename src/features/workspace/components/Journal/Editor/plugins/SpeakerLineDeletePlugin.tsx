/**
 * Speaker Line Delete Plugin - Simplified Version
 *
 * With decorator nodes, deletion logic is much simpler:
 * - If decorator is in selection → delete entire group
 * - Otherwise → let Lexical handle normal deletion
 * - Minimal cursor fixing (only if clearly needed)
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
  COMMAND_PRIORITY_HIGH,
} from "lexical";
import { SpeakerLineNode, $isSpeakerLineNode } from "../SpeakerLineNode";
import {
  SpeakerLabelDecorator,
  $isSpeakerLabelDecorator,
} from "../SpeakerLabelDecorator";

/**
 * Finds all SpeakerLineNodes with the same groupId
 */
function findNodesByGroupId(
  root: LexicalNode,
  groupId: string | null
): SpeakerLineNode[] {
  const nodes: SpeakerLineNode[] = [];

  function traverse(node: LexicalNode) {
    if ($isSpeakerLineNode(node) && node.getGroupId() === groupId) {
      nodes.push(node);
    }
    if (
      "getChildren" in node &&
      typeof (node as any).getChildren === "function"
    ) {
      const children = (node as any).getChildren();
      for (const child of children) {
        traverse(child);
      }
    }
  }

  traverse(root);
  return nodes;
}

/**
 * Checks if selection includes any decorator nodes
 * With decorator nodes, this is simple: if decorator is in selection, delete group
 */
function hasDecoratorInSelection(selection: any): boolean {
  const nodes = selection.getNodes();
  return nodes.some((node: LexicalNode) => $isSpeakerLabelDecorator(node));
}

/**
 * Finds a safe position for the cursor after deletion
 * Simple fallback: previous sibling → next sibling → new paragraph
 */
function findSafeCursorPosition(
  root: LexicalNode,
  deletedNodes: SpeakerLineNode[]
): { node: LexicalNode; offset: number } | null {
  if (deletedNodes.length === 0) return null;

  const firstDeleted = deletedNodes[0];
  const lastDeleted = deletedNodes[deletedNodes.length - 1];

  // Try previous sibling
  const previousSibling = firstDeleted.getPreviousSibling();
  if (previousSibling && previousSibling.isAttached()) {
    // Find last text node in previous sibling
    const lastText = findLastTextNode(previousSibling);
    if (lastText && $isTextNode(lastText)) {
      const size = lastText.getTextContentSize();
      return { node: lastText, offset: size };
    }
    return { node: previousSibling, offset: 0 };
  }

  // Try next sibling
  const nextSibling = lastDeleted.getNextSibling();
  if (nextSibling && nextSibling.isAttached()) {
    // Find first text node in next sibling
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
    const handleDelete = (event: KeyboardEvent | null) => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) {
        return false; // Let Lexical handle non-range selections
      }

      // Check if decorator is in selection
      const decoratorInSelection = hasDecoratorInSelection(selection);

      // Check if cursor is at the start of a speaker line (right after decorator)
      // This happens when user presses backspace at the very beginning of speaker content
      let shouldDeleteGroup = decoratorInSelection;

      if (!shouldDeleteGroup && selection.isCollapsed()) {
        const anchorNode = selection.anchor.getNode();
        const anchorOffset = selection.anchor.offset;

        // Check if we're at offset 0 in a text node that's the first content node after decorator
        if ($isTextNode(anchorNode) && anchorOffset === 0) {
          const parent = anchorNode.getParent();
          if ($isSpeakerLineNode(parent)) {
            const children = parent.getChildren();
            // Find the decorator (should be first child)
            const decoratorIndex = children.findIndex((child) =>
              $isSpeakerLabelDecorator(child)
            );
            // Check if this text node is the first non-decorator child
            if (decoratorIndex >= 0) {
              const firstContentIndex = decoratorIndex + 1;
              if (firstContentIndex < children.length) {
                const firstContentNode = children[firstContentIndex];
                // If this is the first content node and cursor is at offset 0, delete group
                if (firstContentNode === anchorNode) {
                  shouldDeleteGroup = true;
                }
              }
            }
          }
        }

        // Also check if we're at the start of the speaker line element itself
        if (!shouldDeleteGroup && $isSpeakerLineNode(anchorNode)) {
          const children = anchorNode.getChildren();
          const hasDecorator = children.some((child) =>
            $isSpeakerLabelDecorator(child)
          );
          // If speaker line has decorator and cursor is at element start, delete group
          if (hasDecorator && anchorOffset === 0) {
            shouldDeleteGroup = true;
          }
        }
      }

      if (!shouldDeleteGroup) {
        return false; // Let Lexical handle normal deletion
      }

      // Delete entire group(s) - either decorator is selected or cursor is at start
      editor.update(() => {
        const root = $getRoot();
        const nodes = selection.getNodes();

        // Find all unique groupIds from decorators in selection
        const groupIds = new Set<string | null>();
        for (const node of nodes) {
          if ($isSpeakerLabelDecorator(node)) {
            const parent = node.getParent();
            if ($isSpeakerLineNode(parent)) {
              groupIds.add(parent.getGroupId());
            }
          }
        }

        // If no decorator in selection but we're deleting, find groupId from cursor position
        if (groupIds.size === 0 && selection.isCollapsed()) {
          const anchorNode = selection.anchor.getNode();
          let speakerLine: SpeakerLineNode | null = null;

          if ($isSpeakerLineNode(anchorNode)) {
            speakerLine = anchorNode;
          } else {
            let parent = anchorNode.getParent();
            while (parent) {
              if ($isSpeakerLineNode(parent)) {
                speakerLine = parent;
                break;
              }
              parent = parent.getParent();
            }
          }

          if (speakerLine) {
            groupIds.add(speakerLine.getGroupId());
          }
        }

        // Collect all speaker lines to delete
        const allNodesToDelete: SpeakerLineNode[] = [];
        for (const groupId of groupIds) {
          const groupNodes = findNodesByGroupId(root, groupId);
          allNodesToDelete.push(...groupNodes);
        }

        // Create a new paragraph in place of the first deleted speaker line
        // This keeps the cursor on the same line
        const firstDeletedNode = allNodesToDelete[0];
        let replacementParagraph: ReturnType<
          typeof $createParagraphNode
        > | null = null;

        if (firstDeletedNode && firstDeletedNode.isAttached()) {
          // Create new paragraph to replace the first speaker line
          replacementParagraph = $createParagraphNode();

          // Replace the first speaker line with the new paragraph
          firstDeletedNode.replace(replacementParagraph);
        }

        // Delete remaining speaker line groups (skip the first one as it's already replaced)
        for (let i = 1; i < allNodesToDelete.length; i++) {
          const node = allNodesToDelete[i];
          if (node.isAttached()) {
            node.remove();
          }
        }

        // Position cursor in the new paragraph
        if (replacementParagraph) {
          const rangeSelection = $createRangeSelection();
          // Position at start of paragraph
          rangeSelection.anchor.set(
            replacementParagraph.getKey(),
            0,
            "element"
          );
          rangeSelection.focus.set(replacementParagraph.getKey(), 0, "element");
          $setSelection(rangeSelection);
        } else {
          // Fallback: use safe cursor position if we couldn't create replacement
          const cursorPosition = findSafeCursorPosition(root, allNodesToDelete);
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

      if (event) {
        event.preventDefault();
      }
      return true; // Handled
    };

    const unregisterBackspace = editor.registerCommand(
      KEY_BACKSPACE_COMMAND,
      handleDelete,
      COMMAND_PRIORITY_HIGH
    );

    const unregisterDelete = editor.registerCommand(
      KEY_DELETE_COMMAND,
      handleDelete,
      COMMAND_PRIORITY_HIGH
    );

    return () => {
      unregisterBackspace();
      unregisterDelete();
    };
  }, [editor]);

  return null;
}
