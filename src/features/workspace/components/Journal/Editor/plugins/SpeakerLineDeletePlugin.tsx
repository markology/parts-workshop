/**
 * Speaker Line Delete Plugin
 *
 * Handles backspace/delete behavior when inside a SpeakerLineNode:
 * - If deleting the label or at the start of content, removes the entire SpeakerLineNode
 * - For range selections including speaker labels, deletes all selected content
 *   and removes speaker lines that have labels in the selection
 * - Cursor placement follows normal Lexical deletion rules
 */

"use client";

import { useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  $createParagraphNode,
  $createRangeSelection,
  $setSelection,
  $getRoot,
  $getNodeByKey,
  KEY_BACKSPACE_COMMAND,
  KEY_DELETE_COMMAND,
  LexicalNode,
} from "lexical";
import { SpeakerLineNode, $isSpeakerLineNode } from "../SpeakerLineNode";

export default function SpeakerLineDeletePlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const handleDelete = (event: KeyboardEvent | null) => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) {
        return false;
      }

      // Collapsed selection: check if we're at a position that should delete the entire line
      if (selection.isCollapsed()) {
        const anchorNode = selection.anchor.getNode();
        const offset = selection.anchor.offset;

        if ($isTextNode(anchorNode)) {
          const parent = anchorNode.getParent();
          if ($isSpeakerLineNode(parent)) {
            const children = parent.getChildren();
            const firstChild = children[0];

            // Check if the first child is a label node (has bold format)
            const isLabelNode =
              firstChild &&
              $isTextNode(firstChild) &&
              firstChild.hasFormat("bold");

            if (isLabelNode) {
              const labelNode = firstChild;
              const contentNode = children[1];

              // Delete entire line if we're in the label node OR at the very start of the content node
              if (anchorNode === labelNode) {
                // We're in the label node - delete entire speaker line
                editor.update(() => {
                  // Find a node to place cursor after deletion
                  const previousSibling = parent.getPreviousSibling();
                  const nextSibling = parent.getNextSibling();

                  parent.remove();

                  // Set selection to a valid position
                  const newSelection = $createRangeSelection();
                  if (previousSibling) {
                    newSelection.anchor.set(
                      previousSibling.getKey(),
                      0,
                      "element"
                    );
                    newSelection.focus.set(
                      previousSibling.getKey(),
                      0,
                      "element"
                    );
                  } else if (nextSibling) {
                    newSelection.anchor.set(nextSibling.getKey(), 0, "element");
                    newSelection.focus.set(nextSibling.getKey(), 0, "element");
                  } else {
                    // No siblings, create a new paragraph
                    const root = $getRoot();
                    const newParagraph = $createParagraphNode();
                    root.append(newParagraph);
                    newSelection.anchor.set(
                      newParagraph.getKey(),
                      0,
                      "element"
                    );
                    newSelection.focus.set(newParagraph.getKey(), 0, "element");
                  }
                  $setSelection(newSelection);
                });

                if (event) {
                  event.preventDefault();
                }
                return true;
              }

              // If we're at offset 0 of the content node, delete entire line
              if (
                anchorNode === contentNode &&
                $isTextNode(contentNode) &&
                offset === 0
              ) {
                editor.update(() => {
                  // Find a node to place cursor after deletion
                  const previousSibling = parent.getPreviousSibling();
                  const nextSibling = parent.getNextSibling();

                  parent.remove();

                  // Set selection to a valid position
                  const newSelection = $createRangeSelection();
                  if (previousSibling) {
                    newSelection.anchor.set(
                      previousSibling.getKey(),
                      0,
                      "element"
                    );
                    newSelection.focus.set(
                      previousSibling.getKey(),
                      0,
                      "element"
                    );
                  } else if (nextSibling) {
                    newSelection.anchor.set(nextSibling.getKey(), 0, "element");
                    newSelection.focus.set(nextSibling.getKey(), 0, "element");
                  } else {
                    // No siblings, create a new paragraph
                    const root = $getRoot();
                    const newParagraph = $createParagraphNode();
                    root.append(newParagraph);
                    newSelection.anchor.set(
                      newParagraph.getKey(),
                      0,
                      "element"
                    );
                    newSelection.focus.set(newParagraph.getKey(), 0, "element");
                  }
                  $setSelection(newSelection);
                });

                if (event) {
                  event.preventDefault();
                }
                return true;
              }
            }
          }
        }
      } else {
        console.log("SPEAKER DELETION 1");
        // Range selection: check if selection includes any speaker line labels
        const nodes = selection.getNodes();
        const speakerLinesToDelete = new Set<SpeakerLineNode>();

        // Find all speaker lines that have their labels in the selection
        for (const node of nodes) {
          if ($isTextNode(node)) {
            let currentNode: LexicalNode | null = node;
            while (currentNode) {
              if ($isSpeakerLineNode(currentNode)) {
                const children = currentNode.getChildren();
                const firstChild = children[0];
                // Check if this node is the label (bold) or if selection includes the label
                if (
                  firstChild &&
                  $isTextNode(firstChild) &&
                  firstChild.hasFormat("bold") &&
                  (node === firstChild ||
                    // Check if selection spans into the label
                    selection.anchor.getNode() === firstChild ||
                    selection.focus.getNode() === firstChild)
                ) {
                  speakerLinesToDelete.add(currentNode);
                }
                break;
              }
              currentNode = currentNode.getParent();
            }
          }
        }

        console.log("SPEAKERS TO DELETE", speakerLinesToDelete);

        // Check anchor and focus points for special cases
        const anchorNode = selection.anchor.getNode();
        const focusNode = selection.focus.getNode();

        let anchorSpeakerLine: SpeakerLineNode | null = null;
        let focusSpeakerLine: SpeakerLineNode | null = null;

        let currentNode: LexicalNode | null = anchorNode;
        while (currentNode) {
          if ($isSpeakerLineNode(currentNode)) {
            anchorSpeakerLine = currentNode;
            break;
          }
          currentNode = currentNode.getParent();
        }

        currentNode = focusNode;
        while (currentNode) {
          if ($isSpeakerLineNode(currentNode)) {
            focusSpeakerLine = currentNode;
            break;
          }
          currentNode = currentNode.getParent();
        }

        // If anchor is at start of content in a speaker line, mark for deletion
        if (anchorSpeakerLine) {
          const children = anchorSpeakerLine.getChildren();
          const contentNode = children[1];
          if (
            $isTextNode(anchorNode) &&
            anchorNode === contentNode &&
            selection.anchor.offset === 0
          ) {
            speakerLinesToDelete.add(anchorSpeakerLine);
          }
        }

        // If focus is at start of content in a speaker line, mark for deletion
        if (focusSpeakerLine) {
          const children = focusSpeakerLine.getChildren();
          const contentNode = children[1];
          if (
            $isTextNode(focusNode) &&
            focusNode === contentNode &&
            selection.focus.offset === 0
          ) {
            speakerLinesToDelete.add(focusSpeakerLine);
          }
        }

        // If any speaker lines with labels are in the selection, handle deletion specially
        if (speakerLinesToDelete.size > 0) {
          editor.update(() => {
            // Get the current selection again
            const currentSelection = $getSelection();
            if (!$isRangeSelection(currentSelection)) {
              // If selection is invalid, create a safe one and return
              const root = $getRoot();
              const firstChild = root.getFirstChild();
              if (firstChild) {
                const safeSelection = $createRangeSelection();
                safeSelection.anchor.set(firstChild.getKey(), 0, "element");
                safeSelection.focus.set(firstChild.getKey(), 0, "element");
                $setSelection(safeSelection);
              } else {
                // No children, create a new paragraph
                const newParagraph = $createParagraphNode();
                root.append(newParagraph);
                const safeSelection = $createRangeSelection();
                safeSelection.anchor.set(newParagraph.getKey(), 0, "element");
                safeSelection.focus.set(newParagraph.getKey(), 0, "element");
                $setSelection(safeSelection);
              }
              return;
            }

            // Store original selection boundaries and find safe fallback positions BEFORE any modifications
            const anchorKey = currentSelection.anchor.key;
            const anchorOffset = currentSelection.anchor.offset;
            const focusKey = currentSelection.focus.key;
            const focusOffset = currentSelection.focus.offset;
            const isBackward = currentSelection.isBackward();

            // Find safe fallback positions before deleting anything
            const firstSpeakerLine = Array.from(speakerLinesToDelete)[0];
            const previousSibling = firstSpeakerLine?.getPreviousSibling();
            const nextSibling = firstSpeakerLine?.getNextSibling();
            const previousSiblingKey = previousSibling?.getKey();
            const nextSiblingKey = nextSibling?.getKey();

            // First, delete all normal text in the selection
            const selectedNodes = currentSelection.getNodes();
            const speakerLineKeys = new Set(
              Array.from(speakerLinesToDelete).map((sl) => sl.getKey())
            );

            // Delete text from nodes that are NOT in speaker lines to be deleted
            for (const node of selectedNodes) {
              if ($isTextNode(node)) {
                // Check if this node is in a speaker line that will be deleted
                let currentNode: LexicalNode | null = node;
                let inSpeakerLineToDelete = false;

                while (currentNode) {
                  if ($isSpeakerLineNode(currentNode)) {
                    if (speakerLineKeys.has(currentNode.getKey())) {
                      inSpeakerLineToDelete = true;
                    }
                    break;
                  }
                  currentNode = currentNode.getParent();
                }

                // Only delete text from nodes NOT in speaker lines being deleted
                if (!inSpeakerLineToDelete) {
                  const anchorNode = currentSelection.anchor.getNode();
                  const focusNode = currentSelection.focus.getNode();

                  // Calculate the range to delete within this text node
                  let startOffset = 0;
                  let endOffset = node.getTextContentSize();

                  // If this node is the anchor node, start deletion from anchor offset
                  if (node === anchorNode) {
                    startOffset = isBackward ? 0 : anchorOffset;
                  }

                  // If this node is the focus node, end deletion at focus offset
                  if (node === focusNode) {
                    endOffset = isBackward ? focusOffset : endOffset;
                  }

                  // If this is a single node selection, use both offsets
                  if (node === anchorNode && node === focusNode) {
                    startOffset = Math.min(anchorOffset, focusOffset);
                    endOffset = Math.max(anchorOffset, focusOffset);
                  }

                  // Delete the text range
                  if (startOffset < endOffset) {
                    node.spliceText(startOffset, endOffset - startOffset, "");
                  }
                }
              }
            }

            // Delete speaker lines that have labels in the selection
            for (const speakerLine of speakerLinesToDelete) {
              if (speakerLine.isAttached()) {
                speakerLine.remove();
              }
            }

            // Now find a valid position for the cursor
            // The cursor should be at the start of the deletion (earlier point)
            const cursorKey = isBackward ? focusKey : anchorKey;
            const cursorOffset = isBackward ? focusOffset : anchorOffset;

            const newSelection = $createRangeSelection();
            let selectionSet = false;

            // Try to set selection to the original cursor position
            try {
              const cursorNode = $getNodeByKey(cursorKey);
              if (cursorNode && cursorNode.isAttached()) {
                newSelection.anchor.set(cursorKey, cursorOffset, "text");
                newSelection.focus.set(cursorKey, cursorOffset, "text");
                $setSelection(newSelection);
                selectionSet = true;
              }
            } catch {
              // Node doesn't exist or is invalid, try next fallback
            }

            // If that failed, try previous sibling
            if (!selectionSet && previousSiblingKey) {
              try {
                const prevNode = $getNodeByKey(previousSiblingKey);
                if (prevNode && prevNode.isAttached()) {
                  newSelection.anchor.set(previousSiblingKey, 0, "element");
                  newSelection.focus.set(previousSiblingKey, 0, "element");
                  $setSelection(newSelection);
                  selectionSet = true;
                }
              } catch {
                // Node doesn't exist, try next fallback
              }
            }

            // If that failed, try next sibling
            if (!selectionSet && nextSiblingKey) {
              try {
                const nextNode = $getNodeByKey(nextSiblingKey);
                if (nextNode && nextNode.isAttached()) {
                  newSelection.anchor.set(nextSiblingKey, 0, "element");
                  newSelection.focus.set(nextSiblingKey, 0, "element");
                  $setSelection(newSelection);
                  selectionSet = true;
                }
              } catch {
                // Node doesn't exist, try next fallback
              }
            }

            // If all else fails, find the first available node or create one
            if (!selectionSet) {
              const root = $getRoot();
              const firstChild = root.getFirstChild();
              if (firstChild) {
                try {
                  newSelection.anchor.set(firstChild.getKey(), 0, "element");
                  newSelection.focus.set(firstChild.getKey(), 0, "element");
                  $setSelection(newSelection);
                  selectionSet = true;
                } catch {
                  // Continue to create new paragraph
                }
              }

              if (!selectionSet) {
                // No children, create a new paragraph
                const newParagraph = $createParagraphNode();
                root.append(newParagraph);
                newSelection.anchor.set(newParagraph.getKey(), 0, "element");
                newSelection.focus.set(newParagraph.getKey(), 0, "element");
                $setSelection(newSelection);
              }
            }
          });

          if (event) {
            event.preventDefault();
          }
          return true;
        }
      }

      return false;
    };

    const backspaceUnregister = editor.registerCommand(
      KEY_BACKSPACE_COMMAND,
      handleDelete,
      1 // Priority: higher than default
    );

    const deleteUnregister = editor.registerCommand(
      KEY_DELETE_COMMAND,
      handleDelete,
      1 // Priority: higher than default
    );

    return () => {
      backspaceUnregister();
      deleteUnregister();
    };
  }, [editor]);

  return null;
}
