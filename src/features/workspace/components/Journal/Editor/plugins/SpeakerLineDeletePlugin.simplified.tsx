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
  $createParagraphNode,
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
    if (lastText) {
      const size = (lastText as any).getTextContentSize?.() || 0;
      return { node: lastText, offset: size };
    }
    return { node: previousSibling, offset: 0 };
  }

  // Try next sibling
  const nextSibling = lastDeleted.getNextSibling();
  if (nextSibling && nextSibling.isAttached()) {
    // Find first text node in next sibling
    const firstText = findFirstTextNode(nextSibling);
    if (firstText) {
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
    if (firstText) {
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
  if ((element as any).getTextContentSize) {
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
  if ((element as any).getTextContentSize) {
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

      // Simple rule: if decorator is in selection → delete group
      if (!hasDecoratorInSelection(selection)) {
        return false; // Let Lexical handle normal deletion
      }

      // Decorator is in selection → delete entire group(s)
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

        // Collect all speaker lines to delete
        const allNodesToDelete: SpeakerLineNode[] = [];
        for (const groupId of groupIds) {
          const groupNodes = findNodesByGroupId(root, groupId);
          allNodesToDelete.push(...groupNodes);
        }

        // Find safe cursor position BEFORE deletion
        const cursorPosition = findSafeCursorPosition(root, allNodesToDelete);

        // Delete all speaker line groups
        for (const node of allNodesToDelete) {
          if (node.isAttached()) {
            node.remove();
          }
        }

        // Set cursor position if we found one
        if (cursorPosition) {
          const rangeSelection = $createRangeSelection();
          const { node, offset } = cursorPosition;
          
          // Check if node is a text node
          if ((node as any).getTextContentSize) {
            const nodeSize = (node as any).getTextContentSize();
            const safeOffset = Math.min(Math.max(0, offset), nodeSize);
            rangeSelection.anchor.set(node.getKey(), safeOffset, "text");
            rangeSelection.focus.set(node.getKey(), safeOffset, "text");
          } else {
            rangeSelection.anchor.set(node.getKey(), offset, "element");
            rangeSelection.focus.set(node.getKey(), offset, "element");
          }
          $setSelection(rangeSelection);
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

