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
  ElementNode,
} from "lexical";
import { SpeakerLineNode, $isSpeakerLineNode } from "../SpeakerLineNode";

/**
 * SpeakerLineDeletePlugin - Handles deletion behavior for speaker lines in the journal editor.
 *
 * This plugin intercepts Backspace and Delete key presses to provide custom deletion behavior
 * when working with SpeakerLineNodes. It handles two main scenarios:
 *
 * 1. Collapsed Selection (cursor position): When the cursor is in a speaker line's label
 *    or at the start of its content, deleting removes the entire speaker line.
 *
 * 2. Range Selection (highlighted text): When text is selected that includes speaker line
 *    labels, it deletes all selected content and removes entire speaker lines that have
 *    their labels in the selection. This provides a clean deletion experience where
 *    selecting a speaker pill and its content removes the whole line.
 *
 * The plugin also handles cleanup of empty paragraphs and ensures the cursor is positioned
 * correctly after deletion operations.
 */
export default function SpeakerLineDeletePlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    /**
     * Main deletion handler for Backspace and Delete keys.
     *
     * This function is registered as a command handler with high priority (1) to intercept
     * deletion operations before Lexical's default handlers run.
     *
     * @param event - The keyboard event (can be null for programmatic deletions)
     * @returns true if the deletion was handled (prevents default behavior), false otherwise
     */
    // const handleDelete = (event: KeyboardEvent | null) => {
    //   const selection = $getSelection();
    //   if (!$isRangeSelection(selection)) {
    //     return false;
    //   }

    //   // ============================================================================
    //   // Scenario 1: Collapsed Selection (Cursor Position)
    //   // ============================================================================
    //   // When the cursor is at a specific position (not selecting text), we check if
    //   // it's in a position that should trigger deletion of the entire speaker line.
    //   // This happens when:
    //   // - Cursor is in the label node (bold text like "Self: " or "Part Name: ")
    //   // - Cursor is at offset 0 of the content node (right after the label)
    //   if (selection.isCollapsed()) {
    //     const anchorNode = selection.anchor.getNode();
    //     const offset = selection.anchor.offset;

    //     // Only handle deletions when the cursor is in a text node
    //     if ($isTextNode(anchorNode)) {
    //       const parent = anchorNode.getParent();

    //       // Check if we're inside a SpeakerLineNode
    //       if ($isSpeakerLineNode(parent)) {
    //         const children = parent.getChildren();
    //         const firstChild = children[0];

    //         // Check if the first child is a label node (has bold format)
    //         // Speaker lines have this structure:
    //         // - First child: Label text node (bold, e.g., "Self: " or "Part Name: ")
    //         // - Second child: Content text node (regular text with speaker color)
    //         const isLabelNode =
    //           firstChild &&
    //           $isTextNode(firstChild) &&
    //           firstChild.hasFormat("bold");

    //         if (isLabelNode) {
    //           const labelNode = firstChild;
    //           const contentNode = children[1];

    //           // ========================================================================
    //           // Case 1A: Cursor is in the label node
    //           // ========================================================================
    //           // When the user is typing in or deleting from the label (bold text),
    //           // we delete the entire speaker line. This prevents partial label editing
    //           // and maintains the integrity of speaker lines.
    //           if (anchorNode === labelNode) {
    //             // We're in the label node - delete entire speaker line
    //             editor.update(() => {
    //               // Find a node to place cursor after deletion
    //               const previousSibling = parent.getPreviousSibling();
    //               const nextSibling = parent.getNextSibling();

    //               parent.remove();

    //               // Set selection to a valid position
    //               const newSelection = $createRangeSelection();
    //               if (previousSibling) {
    //                 newSelection.anchor.set(
    //                   previousSibling.getKey(),
    //                   0,
    //                   "element"
    //                 );
    //                 newSelection.focus.set(
    //                   previousSibling.getKey(),
    //                   0,
    //                   "element"
    //                 );
    //               } else if (nextSibling) {
    //                 newSelection.anchor.set(nextSibling.getKey(), 0, "element");
    //                 newSelection.focus.set(nextSibling.getKey(), 0, "element");
    //               } else {
    //                 // No siblings, create a new paragraph
    //                 const root = $getRoot();
    //                 const newParagraph = $createParagraphNode();
    //                 root.append(newParagraph);
    //                 newSelection.anchor.set(
    //                   newParagraph.getKey(),
    //                   0,
    //                   "element"
    //                 );
    //                 newSelection.focus.set(newParagraph.getKey(), 0, "element");
    //               }
    //               $setSelection(newSelection);
    //             });

    //             if (event) {
    //               event.preventDefault();
    //             }
    //             return true;
    //           }

    //           // ========================================================================
    //           // Case 1B: Cursor is at offset 0 of the content node
    //           // ========================================================================
    //           // When the cursor is at the very start of the content (right after the label),
    //           // backspace should delete the entire speaker line. This provides intuitive
    //           // behavior where deleting at the start of content removes the speaker line.
    //           if (
    //             anchorNode === contentNode &&
    //             $isTextNode(contentNode) &&
    //             offset === 0
    //           ) {
    //             editor.update(() => {
    //               // Find a node to place cursor after deletion
    //               const previousSibling = parent.getPreviousSibling();
    //               const nextSibling = parent.getNextSibling();

    //               parent.remove();

    //               // Set selection to a valid position
    //               const newSelection = $createRangeSelection();
    //               if (previousSibling) {
    //                 newSelection.anchor.set(
    //                   previousSibling.getKey(),
    //                   0,
    //                   "element"
    //                 );
    //                 newSelection.focus.set(
    //                   previousSibling.getKey(),
    //                   0,
    //                   "element"
    //                 );
    //               } else if (nextSibling) {
    //                 newSelection.anchor.set(nextSibling.getKey(), 0, "element");
    //                 newSelection.focus.set(nextSibling.getKey(), 0, "element");
    //               } else {
    //                 // No siblings, create a new paragraph
    //                 const root = $getRoot();
    //                 const newParagraph = $createParagraphNode();
    //                 root.append(newParagraph);
    //                 newSelection.anchor.set(
    //                   newParagraph.getKey(),
    //                   0,
    //                   "element"
    //                 );
    //                 newSelection.focus.set(newParagraph.getKey(), 0, "element");
    //               }
    //               $setSelection(newSelection);
    //             });

    //             if (event) {
    //               event.preventDefault();
    //             }
    //             return true;
    //           }
    //         }
    //       }
    //     }
    //   } else {
    //     // ============================================================================
    //     // Scenario 2: Range Selection (Highlighted Text)
    //     // ============================================================================
    //     // When the user has selected text (highlighted a range), we need to check if
    //     // the selection includes any speaker line labels. If it does, we delete the
    //     // entire speaker lines that have labels in the selection, plus any other
    //     // selected text.

    //     // Step 1: Find all speaker lines that have their labels in the selection
    //     const nodes = selection.getNodes();
    //     const speakerLinesToDelete = new Set<SpeakerLineNode>();

    //     // Iterate through all nodes in the selection to find speaker lines
    //     for (const node of nodes) {
    //       if ($isTextNode(node)) {
    //         // Traverse up the node tree to find if this text node is inside a speaker line
    //         let currentNode: LexicalNode | null = node;
    //         while (currentNode) {
    //           if ($isSpeakerLineNode(currentNode)) {
    //             const children = currentNode.getChildren();
    //             const firstChild = children[0];

    //             // Check if this node is the label (bold) or if selection spans into the label
    //             // A speaker line should be deleted if:
    //             // - The selected node IS the label node itself
    //             // - The selection's anchor or focus points are in the label node
    //             if (
    //               firstChild &&
    //               $isTextNode(firstChild) &&
    //               firstChild.hasFormat("bold") &&
    //               (node === firstChild ||
    //                 // Check if selection spans into the label
    //                 selection.anchor.getNode() === firstChild ||
    //                 selection.focus.getNode() === firstChild)
    //             ) {
    //               speakerLinesToDelete.add(currentNode);
    //             }
    //             break;
    //           }
    //           currentNode = currentNode.getParent();
    //         }
    //       }
    //     }

    //     // Step 2: Check anchor and focus points for edge cases
    //     // Sometimes the selection endpoints are at boundaries that should trigger
    //     // speaker line deletion even if the label node itself isn't in the selection.
    //     const anchorNode = selection.anchor.getNode();
    //     const focusNode = selection.focus.getNode();

    //     // Find which speaker lines (if any) contain the anchor and focus points
    //     let anchorSpeakerLine: SpeakerLineNode | null = null;
    //     let focusSpeakerLine: SpeakerLineNode | null = null;

    //     // Traverse up from anchor node to find its speaker line parent
    //     let currentNode: LexicalNode | null = anchorNode;
    //     while (currentNode) {
    //       if ($isSpeakerLineNode(currentNode)) {
    //         anchorSpeakerLine = currentNode;
    //         break;
    //       }
    //       currentNode = currentNode.getParent();
    //     }

    //     // Traverse up from focus node to find its speaker line parent
    //     currentNode = focusNode;
    //     while (currentNode) {
    //       if ($isSpeakerLineNode(currentNode)) {
    //         focusSpeakerLine = currentNode;
    //         break;
    //       }
    //       currentNode = currentNode.getParent();
    //     }

    //     // Step 3: Check if anchor is at the start of content in a speaker line
    //     // If the cursor is at offset 0 of the content node (right after the label),
    //     // this should also trigger deletion of the speaker line.
    //     if (anchorSpeakerLine) {
    //       const children = anchorSpeakerLine.getChildren();
    //       const contentNode = children[1];
    //       if (
    //         $isTextNode(anchorNode) &&
    //         anchorNode === contentNode &&
    //         selection.anchor.offset === 0
    //       ) {
    //         speakerLinesToDelete.add(anchorSpeakerLine);
    //       }
    //     }

    //     // Step 4: Check if focus is at the start of content in a speaker line
    //     // Same logic for the focus point (end of selection)
    //     if (focusSpeakerLine) {
    //       const children = focusSpeakerLine.getChildren();
    //       const contentNode = children[1];
    //       if (
    //         $isTextNode(focusNode) &&
    //         focusNode === contentNode &&
    //         selection.focus.offset === 0
    //       ) {
    //         speakerLinesToDelete.add(focusSpeakerLine);
    //       }
    //     }

    //     // Step 5: If any speaker lines with labels are in the selection, handle deletion specially
    //     // This is the main deletion logic for range selections that include speaker lines
    //     if (speakerLinesToDelete.size > 0) {
    //       editor.update(() => {
    //         // Get the current selection again (it may have changed)
    //         const currentSelection = $getSelection();
    //         if (!$isRangeSelection(currentSelection)) {
    //           // If selection is invalid, create a safe one and return early
    //           // This prevents errors if the selection was somehow corrupted
    //           const root = $getRoot();
    //           const firstChild = root.getFirstChild();
    //           if (firstChild) {
    //             const safeSelection = $createRangeSelection();
    //             safeSelection.anchor.set(firstChild.getKey(), 0, "element");
    //             safeSelection.focus.set(firstChild.getKey(), 0, "element");
    //             $setSelection(safeSelection);
    //           } else {
    //             // No children, create a new paragraph
    //             const newParagraph = $createParagraphNode();
    //             root.append(newParagraph);
    //             const safeSelection = $createRangeSelection();
    //             safeSelection.anchor.set(newParagraph.getKey(), 0, "element");
    //             safeSelection.focus.set(newParagraph.getKey(), 0, "element");
    //             $setSelection(safeSelection);
    //           }
    //           return;
    //         }

    //         // ========================================================================
    //         // Phase 1: Store Original Selection State (BEFORE any modifications)
    //         // ========================================================================
    //         // We need to capture the original selection state before we start deleting,
    //         // because after deletions, the nodes and offsets may no longer be valid.
    //         // We'll use this information to help position the cursor after deletion.
    //         const anchorKey = currentSelection.anchor.key;
    //         const anchorOffset = currentSelection.anchor.offset;
    //         const focusKey = currentSelection.focus.key;
    //         const focusOffset = currentSelection.focus.offset;
    //         const isBackward = currentSelection.isBackward();

    //         // Find safe fallback positions BEFORE deleting anything
    //         // These are nodes that we know will still exist after deletion, so we can
    //         // use them to position the cursor if the original position becomes invalid.
    //         const firstSpeakerLine = Array.from(speakerLinesToDelete)[0];
    //         const previousSibling = firstSpeakerLine?.getPreviousSibling();
    //         const nextSibling = firstSpeakerLine?.getNextSibling();
    //         const previousSiblingKey = previousSibling?.getKey();
    //         const nextSiblingKey = nextSibling?.getKey();

    //         // ========================================================================
    //         // Phase 2: Delete Text from Non-Speaker-Line Nodes
    //         // ========================================================================
    //         // First, we delete text from regular paragraphs and other nodes that are
    //         // NOT in speaker lines. We skip text in speaker lines because we'll delete
    //         // the entire speaker lines in the next phase.
    //         const selectedNodes = currentSelection.getNodes();
    //         const speakerLineKeys = new Set(
    //           Array.from(speakerLinesToDelete).map((sl) => sl.getKey())
    //         );

    //         // Iterate through all selected nodes and delete text from non-speaker-line nodes
    //         for (const node of selectedNodes) {
    //           if ($isTextNode(node)) {
    //             // Check if this text node is inside a speaker line that will be deleted
    //             let currentNode: LexicalNode | null = node;
    //             let inSpeakerLineToDelete = false;

    //             // Traverse up the tree to find if this node is in a speaker line to delete
    //             while (currentNode) {
    //               if ($isSpeakerLineNode(currentNode)) {
    //                 if (speakerLineKeys.has(currentNode.getKey())) {
    //                   inSpeakerLineToDelete = true;
    //                 }
    //                 break;
    //               }
    //               currentNode = currentNode.getParent();
    //             }

    //             // Only delete text from nodes NOT in speaker lines being deleted
    //             // (Speaker line content will be deleted when we remove the speaker lines)
    //             if (!inSpeakerLineToDelete) {
    //               const anchorNode = currentSelection.anchor.getNode();
    //               const focusNode = currentSelection.focus.getNode();

    //               // Calculate the range to delete within this text node
    //               // Default: delete the entire node's text
    //               let startOffset = 0;
    //               let endOffset = node.getTextContentSize();

    //               // If this node is the anchor node, start deletion from anchor offset
    //               // Handle backward selections (selection was made right-to-left)
    //               if (node === anchorNode) {
    //                 startOffset = isBackward ? 0 : anchorOffset;
    //               }

    //               // If this node is the focus node, end deletion at focus offset
    //               if (node === focusNode) {
    //                 endOffset = isBackward ? focusOffset : endOffset;
    //               }

    //               // If this is a single node selection (anchor and focus in same node),
    //               // use both offsets to determine the range
    //               if (node === anchorNode && node === focusNode) {
    //                 startOffset = Math.min(anchorOffset, focusOffset);
    //                 endOffset = Math.max(anchorOffset, focusOffset);
    //               }

    //               // Delete the text range using spliceText
    //               if (startOffset < endOffset) {
    //                 node.spliceText(startOffset, endOffset - startOffset, "");
    //               }
    //             }
    //           }
    //         }

    //         // ========================================================================
    //         // Phase 3: Delete Entire Speaker Lines
    //         // ========================================================================
    //         // Now we remove the entire speaker lines that had their labels in the selection.
    //         // This removes both the label and all content in those speaker lines.
    //         for (const speakerLine of speakerLinesToDelete) {
    //           if (speakerLine.isAttached()) {
    //             speakerLine.remove();
    //           }
    //         }

    //         // ========================================================================
    //         // Phase 4: Clean Up Empty Paragraphs
    //         // ========================================================================
    //         // After deleting text, some paragraphs may now be empty. We clean these up
    //         // to keep the editor tidy, but we're careful to:
    //         // 1. Keep at least one paragraph if removing all would empty the editor
    //         // 2. Not remove the paragraph that contains where we want to place the cursor
    //         const root = $getRoot();
    //         const allChildren = root.getChildren();
    //         const emptyParagraphsToRemove: ElementNode[] = [];

    //         // Find all empty paragraphs (excluding speaker lines)
    //         for (const child of allChildren) {
    //           // Check if this is a paragraph (not a speaker line) that's now empty
    //           if (
    //             child.getType() === "paragraph" &&
    //             !$isSpeakerLineNode(child)
    //           ) {
    //             const textContent = child.getTextContent().trim();
    //             if (textContent === "") {
    //               emptyParagraphsToRemove.push(child as ElementNode);
    //             }
    //           }
    //         }

    //         // Identify which paragraph contains our cursor target (if it still exists)
    //         // We want to preserve this paragraph even if it's empty, so we have a place
    //         // to position the cursor.
    //         const cursorKey = isBackward ? focusKey : anchorKey;
    //         let cursorParagraph: ElementNode | null = null;

    //         // Try to find the paragraph containing the cursor target node
    //         try {
    //           const cursorNode = $getNodeByKey(cursorKey);
    //           if (cursorNode) {
    //             let parent = cursorNode.getParent();
    //             while (parent) {
    //               if (parent.getType() === "paragraph") {
    //                 cursorParagraph = parent as ElementNode;
    //                 break;
    //               }
    //               parent = parent.getParent();
    //             }
    //           }
    //         } catch {
    //           // Cursor node doesn't exist (was deleted), that's okay
    //         }

    //         // Filter out the cursor paragraph from removal list
    //         // We keep it even if empty so we have a valid cursor position
    //         const paragraphsToRemove = emptyParagraphsToRemove.filter(
    //           (p) => p !== cursorParagraph
    //         );

    //         // Safety check: If removing all these would leave the editor empty,
    //         // keep at least one empty paragraph
    //         const remainingAfterRemoval =
    //           allChildren.length -
    //           paragraphsToRemove.length -
    //           speakerLinesToDelete.size;
    //         if (remainingAfterRemoval <= 0 && paragraphsToRemove.length > 0) {
    //           // Keep the last one to prevent empty editor
    //           paragraphsToRemove.pop();
    //         }

    //         // Remove the empty paragraphs
    //         for (const emptyPara of paragraphsToRemove) {
    //           if (emptyPara.isAttached()) {
    //             emptyPara.remove();
    //           }
    //         }

    //         // ========================================================================
    //         // Phase 5: Position Cursor After Deletion
    //         // ========================================================================
    //         // IMPORTANT: After all deletions, the original cursor position (anchorKey/focusKey)
    //         // may no longer be valid because:
    //         // - The node may have been deleted
    //         // - The node may still exist but with different text (invalid offset)
    //         //
    //         // Strategy: Find a safe position BEFORE the deletion point (previousSibling)
    //         // and position the cursor at the end of any text in that node. This provides
    //         // intuitive behavior where the cursor appears after the remaining content.
    //         const newSelection = $createRangeSelection();
    //         let selectionSet = false;

    //         // Priority 1: Use the previous sibling (node before the first deleted speaker line)
    //         // This is the safest position because we captured it before any deletions
    //         if (previousSiblingKey) {
    //           try {
    //             const prevNode = $getNodeByKey(previousSiblingKey);
    //             if (prevNode && prevNode.isAttached()) {
    //               // Try to find the end of this node (last text node)
    //               // We want to position the cursor at the end of any existing text,
    //               // not at the start of the element
    //               let lastTextNode: LexicalNode | null = null;

    //               // Check if this node has children (it's an ElementNode)
    //               if (
    //                 "getChildren" in prevNode &&
    //                 typeof prevNode.getChildren === "function"
    //               ) {
    //                 const children = (prevNode as any).getChildren();

    //                 // Find the last text node in this element (search backwards)
    //                 for (let i = children.length - 1; i >= 0; i--) {
    //                   if ($isTextNode(children[i])) {
    //                     lastTextNode = children[i];
    //                     break;
    //                   }
    //                 }
    //               }

    //               if (lastTextNode && $isTextNode(lastTextNode)) {
    //                 // Position at the end of the last text node
    //                 // This places the cursor after any remaining text in the previous node
    //                 const textSize = lastTextNode.getTextContentSize();
    //                 newSelection.anchor.set(
    //                   lastTextNode.getKey(),
    //                   textSize,
    //                   "text"
    //                 );
    //                 newSelection.focus.set(
    //                   lastTextNode.getKey(),
    //                   textSize,
    //                   "text"
    //                 );
    //               } else {
    //                 // No text node found, use element selection at offset 0
    //                 newSelection.anchor.set(previousSiblingKey, 0, "element");
    //                 newSelection.focus.set(previousSiblingKey, 0, "element");
    //               }
    //               $setSelection(newSelection);
    //               selectionSet = true;
    //             }
    //           } catch {
    //             // Node doesn't exist or is invalid, try next fallback
    //           }
    //         }

    //         // Priority 2: If previous sibling doesn't work, try next sibling
    //         // (the node after the deleted section)
    //         if (!selectionSet && nextSiblingKey) {
    //           try {
    //             const nextNode = $getNodeByKey(nextSiblingKey);
    //             if (nextNode && nextNode.isAttached()) {
    //               newSelection.anchor.set(nextSiblingKey, 0, "element");
    //               newSelection.focus.set(nextSiblingKey, 0, "element");
    //               $setSelection(newSelection);
    //               selectionSet = true;
    //             }
    //           } catch {
    //             // Node doesn't exist, try next fallback
    //           }
    //         }

    //         // Priority 3: If all else fails, find the first available node or create one
    //         // This is a last resort to ensure we always have a valid cursor position
    //         if (!selectionSet) {
    //           const root = $getRoot();
    //           const firstChild = root.getFirstChild();
    //           if (firstChild) {
    //             try {
    //               newSelection.anchor.set(firstChild.getKey(), 0, "element");
    //               newSelection.focus.set(firstChild.getKey(), 0, "element");
    //               $setSelection(newSelection);
    //               selectionSet = true;
    //             } catch {
    //               // Continue to create new paragraph
    //             }
    //           }

    //           if (!selectionSet) {
    //             // No children at all, create a new empty paragraph
    //             const newParagraph = $createParagraphNode();
    //             root.append(newParagraph);
    //             newSelection.anchor.set(newParagraph.getKey(), 0, "element");
    //             newSelection.focus.set(newParagraph.getKey(), 0, "element");
    //             $setSelection(newSelection);
    //           }
    //         }
    //       });

    //       if (event) {
    //         event.preventDefault();
    //       }
    //       return true;
    //     }
    //   }

    //   return false;
    // };

    // Register command handlers for Backspace and Delete keys
    // Priority 1 ensures this plugin runs before Lexical's default deletion handlers

    const handleDelete = () => {};
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

    // Cleanup: unregister command handlers when component unmounts
    return () => {
      backspaceUnregister();
      deleteUnregister();
    };
  }, [editor]);

  return null;
}
