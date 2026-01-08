/**
 * Speaker Line Delete Plugin
 *
 * Simplified deletion handler for speaker lines:
 * - If the speaker label is touched/selected → delete the entire group (all lines with same groupId)
 * - Otherwise → let Lexical handle normal text deletion
 * - No paragraph replacements - either delete text in spans or delete entire lines
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

/**
 * Checks if a text node is the label (bold first child) of a SpeakerLineNode
 */
function isLabelNode(node: LexicalNode): boolean {
  if (!$isTextNode(node) || !node.hasFormat("bold")) {
    return false;
  }
  const parent = node.getParent();
  if (!$isSpeakerLineNode(parent)) {
    return false;
  }
  const children = parent.getChildren();
  return children[0] === node;
}

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
    // Only ElementNodes have getChildren
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
 * Finds the parent element (paragraph or speaker line) containing a node
 */
function findParentElement(node: LexicalNode | null): LexicalNode | null {
  if (!node) return null;
  let current: LexicalNode | null = node;
  while (current) {
    const parent: LexicalNode | null = current.getParent();
    if (!parent) break;
    if (parent.getType() === "paragraph" || $isSpeakerLineNode(parent)) {
      return parent;
    }
    current = parent;
  }
  return null;
}

/**
 * Finds the last text node in an element, or returns null
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
 * Finds the first text node in an element, or returns null
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

/**
 * Checks if an element is empty (no text content)
 */
function isEmptyElement(element: LexicalNode): boolean {
  if ($isTextNode(element)) {
    return element.getTextContent().trim() === "";
  }
  if ("getChildren" in element) {
    const children = (element as any).getChildren();
    if (children.length === 0) return true;
    return children.every((child: LexicalNode) => isEmptyElement(child));
  }
  return true;
}

export default function SpeakerLineDeletePlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const handleDelete = (event: KeyboardEvent | null) => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) {
        return false;
      }

      // Check if the selection touches any speaker label nodes
      const nodes = selection.getNodes();
      const touchedGroupIds = new Set<string | null>();

      for (const node of nodes) {
        if (isLabelNode(node)) {
          const parent = node.getParent();
          if ($isSpeakerLineNode(parent)) {
            touchedGroupIds.add(parent.getGroupId());
          }
        }
      }

      // Also check anchor and focus points for edge cases
      const anchorNode = selection.anchor.getNode();
      const focusNode = selection.focus.getNode();

      if (isLabelNode(anchorNode)) {
        const parent = anchorNode.getParent();
        if ($isSpeakerLineNode(parent)) {
          touchedGroupIds.add(parent.getGroupId());
        }
      }

      if (isLabelNode(focusNode)) {
        const parent = focusNode.getParent();
        if ($isSpeakerLineNode(parent)) {
          touchedGroupIds.add(parent.getGroupId());
        }
      }

      // Check if cursor is at offset 0 of content node (right after label)
      if (selection.isCollapsed()) {
        const anchorNode = selection.anchor.getNode();
        if ($isTextNode(anchorNode)) {
          const parent = anchorNode.getParent();
          if ($isSpeakerLineNode(parent)) {
            const children = parent.getChildren();
            const contentNode = children[1];
            // If we're at offset 0 of the content node, treat it as touching the label
            if (anchorNode === contentNode && selection.anchor.offset === 0) {
              touchedGroupIds.add(parent.getGroupId());
            }
          }
        }
      }

      // If any labels are touched, delete all groups AND all selected content
      if (touchedGroupIds.size > 0) {
        console.log(
          "[DELETE-DEBUG] Labels touched, deleting groups and selected content:",
          {
            touchedGroupIds: Array.from(touchedGroupIds),
            isCollapsed: selection.isCollapsed(),
            isBackward: selection.isBackward(),
          }
        );

        editor.update(() => {
          const root = $getRoot();
          const allNodesToDelete: SpeakerLineNode[] = [];

          // Find all nodes with touched groupIds
          for (const groupId of touchedGroupIds) {
            const nodesWithGroupId = findNodesByGroupId(root, groupId);
            console.log("[DELETE-DEBUG] Found nodes for groupId:", {
              groupId,
              count: nodesWithGroupId.length,
              keys: nodesWithGroupId.map((n) => n.getKey()),
            });
            allNodesToDelete.push(...nodesWithGroupId);
          }

          // Capture anchor and focus positions BEFORE deletion
          const anchorNode = selection.anchor.getNode();
          const anchorParent = findParentElement(anchorNode);
          const anchorParentKey = anchorParent?.getKey() || null;
          const anchorNodeKey = anchorNode.getKey();

          const focusNode = selection.focus.getNode();
          const focusParent = findParentElement(focusNode);
          const focusParentKey = focusParent?.getKey() || null;
          const focusNodeKey = focusNode.getKey();

          const isBackward = selection.isBackward();
          const isForward = !isBackward;

          console.log("[DELETE-DEBUG] Selection info:", {
            anchorNodeKey,
            anchorNodeType: anchorNode.getType(),
            anchorParentKey,
            anchorParentType: anchorParent?.getType(),
            focusNodeKey,
            focusNodeType: focusNode.getType(),
            focusParentKey,
            focusParentType: focusParent?.getType(),
            isBackward,
            isForward,
          });

          // Get all selected nodes and speaker line keys to delete
          const selectedNodes = selection.getNodes();
          const speakerLineKeysToDelete = new Set(
            allNodesToDelete.map((n) => n.getKey())
          );

          // Check if anchor/focus were in speaker lines that will be deleted
          const focusWasInDeletedSpeaker =
            focusParent &&
            $isSpeakerLineNode(focusParent) &&
            speakerLineKeysToDelete.has(focusParent.getKey());

          const anchorWasInDeletedSpeaker =
            anchorParent &&
            $isSpeakerLineNode(anchorParent) &&
            speakerLineKeysToDelete.has(anchorParent.getKey());

          console.log("[DELETE-DEBUG] Speaker line checks:", {
            focusWasInDeletedSpeaker,
            anchorWasInDeletedSpeaker,
            focusParentKey,
            anchorParentKey,
          });

          // Helper to check if a node is inside a speaker line that will be deleted
          function isInSpeakerLineToDelete(node: LexicalNode): boolean {
            let current: LexicalNode | null = node;
            while (current) {
              if (
                $isSpeakerLineNode(current) &&
                speakerLineKeysToDelete.has(current.getKey())
              ) {
                return true;
              }
              current = current.getParent();
            }
            return false;
          }

          // Delete normal text from selected nodes (not in speaker lines to delete)
          // Speaker line content will be deleted when we remove the speaker lines
          for (const node of selectedNodes) {
            if ($isTextNode(node) && !isInSpeakerLineToDelete(node)) {
              const anchorNode = selection.anchor.getNode();
              const focusNode = selection.focus.getNode();
              const anchorOffset = selection.anchor.offset;
              const focusOffset = selection.focus.offset;

              // Calculate the range to delete within this text node
              let startOffset = 0;
              let endOffset = node.getTextContentSize();

              // If this is a single node selection (anchor and focus in same node)
              if (node === anchorNode && node === focusNode) {
                startOffset = Math.min(anchorOffset, focusOffset);
                endOffset = Math.max(anchorOffset, focusOffset);
              } else {
                // Multi-node selection
                // If this node is the anchor node (where selection started)
                if (node === anchorNode) {
                  // For backward deletion: delete from 0 to anchorOffset (highlighted part)
                  // For forward deletion: delete from anchorOffset to end (highlighted part)
                  if (isBackward) {
                    startOffset = 0;
                    endOffset = anchorOffset;
                  } else {
                    startOffset = anchorOffset;
                    endOffset = node.getTextContentSize();
                  }
                }
                // If this node is the focus node (where selection ended)
                else if (node === focusNode) {
                  // For backward deletion: delete from focusOffset to end (highlighted part)
                  // For forward deletion: delete from 0 to focusOffset (highlighted part)
                  if (isBackward) {
                    startOffset = focusOffset;
                    endOffset = node.getTextContentSize();
                  } else {
                    startOffset = 0;
                    endOffset = focusOffset;
                  }
                }
                // If this node is in the middle of the selection, delete all of it
                // (startOffset = 0, endOffset = node.getTextContentSize() already set)
              }

              // Delete the text range
              if (startOffset < endOffset) {
                console.log("[DELETE-DEBUG] Deleting text from node:", {
                  key: node.getKey(),
                  startOffset,
                  endOffset,
                  isAnchor: node === anchorNode,
                  isFocus: node === focusNode,
                  isBackward,
                });
                node.spliceText(startOffset, endOffset - startOffset, "");
              } else if (
                startOffset === 0 &&
                endOffset === node.getTextContentSize()
              ) {
                // Entire node is selected, remove it
                console.log(
                  "[DELETE-DEBUG] Removing entire text node:",
                  node.getKey()
                );
                node.remove();
              }
            }
          }

          // Also handle partial selections at anchor and focus points
          const anchorTextNode = $isTextNode(anchorNode) ? anchorNode : null;
          const focusTextNode = $isTextNode(selection.focus.getNode())
            ? selection.focus.getNode()
            : null;

          // Delete text from anchor if it's not in a speaker line to delete
          if (
            anchorTextNode &&
            $isTextNode(anchorTextNode) &&
            !isInSpeakerLineToDelete(anchorTextNode)
          ) {
            const anchorOffset = selection.anchor.offset;
            const textSize = anchorTextNode.getTextContentSize();

            // Check if we already processed this node in the loop above
            const alreadyProcessed = selectedNodes.includes(anchorTextNode);

            if (!alreadyProcessed) {
              // Partial selection - delete from offset to end (or beginning if backward)
              if (isBackward && anchorOffset > 0) {
                anchorTextNode.spliceText(0, anchorOffset, "");
              } else if (!isBackward && anchorOffset < textSize) {
                anchorTextNode.spliceText(
                  anchorOffset,
                  textSize - anchorOffset,
                  ""
                );
              }
            }
          }

          // Delete text from focus if it's not in a speaker line to delete
          if (
            focusTextNode &&
            $isTextNode(focusTextNode) &&
            !isInSpeakerLineToDelete(focusTextNode)
          ) {
            const focusOffset = selection.focus.offset;
            const textSize = focusTextNode.getTextContentSize();

            // Check if we already processed this node in the loop above
            const alreadyProcessed = selectedNodes.includes(focusTextNode);

            if (!alreadyProcessed) {
              // Partial selection - delete from beginning to offset (or offset to end if backward)
              if (isBackward && focusOffset < textSize) {
                focusTextNode.spliceText(
                  focusOffset,
                  textSize - focusOffset,
                  ""
                );
              } else if (!isBackward && focusOffset > 0) {
                focusTextNode.spliceText(0, focusOffset, "");
              }
            }
          }

          // Capture siblings and position BEFORE deletion
          const firstDeleted = allNodesToDelete[0];
          const lastDeleted = allNodesToDelete[allNodesToDelete.length - 1];
          const previousSibling = firstDeleted.getPreviousSibling();
          const nextSibling = lastDeleted.getNextSibling();

          // Now delete all speaker line groups
          for (const node of allNodesToDelete) {
            if (node.isAttached()) {
              console.log(
                "[DELETE-DEBUG] Deleting speaker line node:",
                node.getKey()
              );
              node.remove();
            }
          }

          // Clean up empty paragraphs that might be left behind
          // Iterate through all root children and remove empty paragraphs
          const rootChildren = root.getChildren();
          const emptyParagraphsToRemove: LexicalNode[] = [];

          for (const child of rootChildren) {
            if (
              child.getType() === "paragraph" &&
              isEmptyElement(child) &&
              child.isAttached()
            ) {
              // Don't remove if it's the only child (editor needs at least one element)
              if (rootChildren.length > 1) {
                emptyParagraphsToRemove.push(child);
              }
            }
          }

          for (const emptyPara of emptyParagraphsToRemove) {
            if (emptyPara.isAttached()) {
              console.log(
                "[DELETE-DEBUG] Removing empty paragraph:",
                emptyPara.getKey()
              );
              emptyPara.remove();
            }
          }

          // Determine cursor position based on deletion direction
          const newSelection = $createRangeSelection();
          let cursorSet = false;

          if (isForward) {
            // Forward deletion: if there's content after, move it to where anchor was
            if (nextSibling && nextSibling.isAttached()) {
              console.log(
                "[DELETE-DEBUG] Forward deletion: moving next sibling to anchor position"
              );

              // If anchor parent still exists and is a paragraph, insert there
              if (
                anchorParent &&
                anchorParent.getType() === "paragraph" &&
                anchorParent.isAttached()
              ) {
                // Move next sibling's content into anchor parent
                if ("getChildren" in nextSibling) {
                  const nextChildren = (nextSibling as any).getChildren();
                  // Get a copy of children array since we'll be modifying it
                  const childrenToMove = [...nextChildren];
                  for (const child of childrenToMove) {
                    (anchorParent as any).append(child);
                  }
                }
                // Remove the now-empty next sibling if it's a paragraph
                if (
                  nextSibling.getType() === "paragraph" &&
                  isEmptyElement(nextSibling)
                ) {
                  nextSibling.remove();
                }
                // Set cursor in anchor parent
                const lastText = findLastTextNode(anchorParent);
                if (lastText && $isTextNode(lastText)) {
                  newSelection.anchor.set(
                    lastText.getKey(),
                    lastText.getTextContentSize(),
                    "text"
                  );
                  newSelection.focus.set(
                    lastText.getKey(),
                    lastText.getTextContentSize(),
                    "text"
                  );
                } else {
                  newSelection.anchor.set(anchorParent.getKey(), 0, "element");
                  newSelection.focus.set(anchorParent.getKey(), 0, "element");
                }
                cursorSet = true;
              } else if (anchorWasInDeletedSpeaker) {
                // Anchor was in a speaker line that was deleted - create paragraph at that position
                console.log(
                  "[DELETE-DEBUG] Forward deletion: anchor was in deleted speaker, creating paragraph at that position"
                );

                // Find where to insert the paragraph (after previous sibling, or at start if no previous)
                let insertAfter: LexicalNode | null = null;
                if (previousSibling && previousSibling.isAttached()) {
                  insertAfter = previousSibling;
                } else if (firstDeleted && firstDeleted.isAttached()) {
                  const prev = firstDeleted.getPreviousSibling();
                  if (prev && prev.isAttached()) {
                    insertAfter = prev;
                  }
                }

                const newParagraph = $createParagraphNode();
                if (insertAfter) {
                  insertAfter.insertAfter(newParagraph);
                } else {
                  if (firstDeleted && firstDeleted.isAttached()) {
                    firstDeleted.insertBefore(newParagraph);
                  } else {
                    root.append(newParagraph);
                  }
                }

                newSelection.anchor.set(newParagraph.getKey(), 0, "element");
                newSelection.focus.set(newParagraph.getKey(), 0, "element");
                cursorSet = true;
              } else {
                // Anchor parent doesn't exist, use next sibling
                const firstText = findFirstTextNode(nextSibling);
                if (firstText && $isTextNode(firstText)) {
                  newSelection.anchor.set(firstText.getKey(), 0, "text");
                  newSelection.focus.set(firstText.getKey(), 0, "text");
                } else {
                  newSelection.anchor.set(nextSibling.getKey(), 0, "element");
                  newSelection.focus.set(nextSibling.getKey(), 0, "element");
                }
                cursorSet = true;
              }
            } else {
              // No content after, try to use anchor parent or previous sibling
              console.log("[DELETE-DEBUG] Forward deletion: no content after");

              // If anchor was in a deleted speaker, create paragraph at that position
              if (anchorWasInDeletedSpeaker) {
                console.log(
                  "[DELETE-DEBUG] Forward deletion: anchor was in deleted speaker, creating paragraph"
                );

                let insertAfter: LexicalNode | null = null;
                if (previousSibling && previousSibling.isAttached()) {
                  insertAfter = previousSibling;
                } else if (firstDeleted && firstDeleted.isAttached()) {
                  const prev = firstDeleted.getPreviousSibling();
                  if (prev && prev.isAttached()) {
                    insertAfter = prev;
                  }
                }

                const newParagraph = $createParagraphNode();
                if (insertAfter) {
                  insertAfter.insertAfter(newParagraph);
                } else {
                  if (firstDeleted && firstDeleted.isAttached()) {
                    firstDeleted.insertBefore(newParagraph);
                  } else {
                    root.append(newParagraph);
                  }
                }

                newSelection.anchor.set(newParagraph.getKey(), 0, "element");
                newSelection.focus.set(newParagraph.getKey(), 0, "element");
                cursorSet = true;
              } else {
                // Try to find anchor parent by key
                let targetParent: LexicalNode | null = null;
                if (anchorParentKey) {
                  try {
                    const node = $getNodeByKey(anchorParentKey);
                    if (node && node.isAttached()) {
                      targetParent = node;
                    }
                  } catch (e) {
                    // Node not found
                  }
                }

                // If anchor parent doesn't exist, use previous sibling
                if (
                  !targetParent &&
                  previousSibling &&
                  previousSibling.isAttached()
                ) {
                  targetParent = previousSibling;
                }

                if (targetParent && targetParent.isAttached()) {
                  // Use the target parent itself, don't create a new paragraph
                  const lastText = findLastTextNode(targetParent);
                  if (lastText && $isTextNode(lastText)) {
                    newSelection.anchor.set(
                      lastText.getKey(),
                      lastText.getTextContentSize(),
                      "text"
                    );
                    newSelection.focus.set(
                      lastText.getKey(),
                      lastText.getTextContentSize(),
                      "text"
                    );
                  } else {
                    newSelection.anchor.set(
                      targetParent.getKey(),
                      0,
                      "element"
                    );
                    newSelection.focus.set(targetParent.getKey(), 0, "element");
                  }
                  cursorSet = true;
                }
                // If no target parent found, let fallback handle it (which won't create paragraph if content exists)
              }
            }
          } else {
            // Backward deletion: position cursor where FOCUS was (selection end)
            // When dragging from bottom to top, focus is at the top where we want to stay
            // For collapsed selection (backspace), anchor and focus are the same, so check both
            const wasInDeletedSpeaker =
              focusWasInDeletedSpeaker ||
              (selection.isCollapsed() && anchorWasInDeletedSpeaker);

            console.log(
              "[DELETE-DEBUG] Backward deletion: positioning at focus location",
              {
                wasInDeletedSpeaker,
                focusWasInDeletedSpeaker,
                anchorWasInDeletedSpeaker,
                isCollapsed: selection.isCollapsed(),
              }
            );

            // First, try to find focus parent by key (it might have been affected by deletion)
            let foundFocusParent: LexicalNode | null = null;
            if (focusParentKey) {
              try {
                const node = $getNodeByKey(focusParentKey);
                if (node && node.isAttached()) {
                  foundFocusParent = node;
                }
              } catch (e) {
                console.log(
                  "[DELETE-DEBUG] Could not find focus parent by key:",
                  focusParentKey
                );
              }
            }

            // Also try to find focus node itself
            let foundFocusNode: LexicalNode | null = null;
            try {
              const node = $getNodeByKey(focusNodeKey);
              if (node && node.isAttached()) {
                foundFocusNode = node;
                // If we found the focus node, get its parent
                if (!foundFocusParent) {
                  foundFocusParent = findParentElement(foundFocusNode);
                }
              }
            } catch (e) {
              console.log(
                "[DELETE-DEBUG] Could not find focus node by key:",
                focusNodeKey
              );
            }

            console.log("[DELETE-DEBUG] Found nodes after deletion:", {
              foundFocusParent: foundFocusParent?.getKey(),
              foundFocusNode: foundFocusNode?.getKey(),
            });

            // Use focus parent if found (and it's not a speaker line that was deleted)
            if (
              foundFocusParent &&
              foundFocusParent.isAttached() &&
              !wasInDeletedSpeaker
            ) {
              // Position at the end of the focus parent (or start if it's empty)
              const lastText = findLastTextNode(foundFocusParent);
              if (lastText && $isTextNode(lastText)) {
                newSelection.anchor.set(
                  lastText.getKey(),
                  lastText.getTextContentSize(),
                  "text"
                );
                newSelection.focus.set(
                  lastText.getKey(),
                  lastText.getTextContentSize(),
                  "text"
                );
              } else {
                newSelection.anchor.set(
                  foundFocusParent.getKey(),
                  0,
                  "element"
                );
                newSelection.focus.set(foundFocusParent.getKey(), 0, "element");
              }
              cursorSet = true;
            } else if (wasInDeletedSpeaker) {
              // Focus (or anchor for collapsed) was in a speaker line that was deleted - create paragraph at that position
              console.log(
                "[DELETE-DEBUG] Backward deletion: focus/anchor was in deleted speaker, creating paragraph at that position"
              );

              // Find where to insert the paragraph (after previous sibling, or at start if no previous)
              let insertAfter: LexicalNode | null = null;
              if (previousSibling && previousSibling.isAttached()) {
                insertAfter = previousSibling;
              } else if (firstDeleted && firstDeleted.isAttached()) {
                // First deleted node still exists (hasn't been removed yet), use its previous sibling
                const prev = firstDeleted.getPreviousSibling();
                if (prev && prev.isAttached()) {
                  insertAfter = prev;
                }
              }

              const newParagraph = $createParagraphNode();
              if (insertAfter) {
                insertAfter.insertAfter(newParagraph);
              } else {
                // No previous sibling, insert at the start (before first deleted if it still exists)
                if (firstDeleted && firstDeleted.isAttached()) {
                  firstDeleted.insertBefore(newParagraph);
                } else {
                  // First deleted is gone, append to root
                  root.append(newParagraph);
                }
              }

              newSelection.anchor.set(newParagraph.getKey(), 0, "element");
              newSelection.focus.set(newParagraph.getKey(), 0, "element");
              cursorSet = true;
            } else if (previousSibling && previousSibling.isAttached()) {
              // Focus parent doesn't exist (was deleted), use previous sibling
              console.log(
                "[DELETE-DEBUG] Backward deletion: using previous sibling"
              );
              const lastText = findLastTextNode(previousSibling);
              if (lastText && $isTextNode(lastText)) {
                newSelection.anchor.set(
                  lastText.getKey(),
                  lastText.getTextContentSize(),
                  "text"
                );
                newSelection.focus.set(
                  lastText.getKey(),
                  lastText.getTextContentSize(),
                  "text"
                );
              } else {
                newSelection.anchor.set(previousSibling.getKey(), 0, "element");
                newSelection.focus.set(previousSibling.getKey(), 0, "element");
              }
              cursorSet = true;
            } else if (nextSibling && nextSibling.isAttached()) {
              // No previous sibling, use next sibling
              console.log(
                "[DELETE-DEBUG] Backward deletion: using next sibling"
              );
              const firstText = findFirstTextNode(nextSibling);
              if (firstText && $isTextNode(firstText)) {
                newSelection.anchor.set(firstText.getKey(), 0, "text");
                newSelection.focus.set(firstText.getKey(), 0, "text");
              } else {
                newSelection.anchor.set(nextSibling.getKey(), 0, "element");
                newSelection.focus.set(nextSibling.getKey(), 0, "element");
              }
              cursorSet = true;
            }
          }

          // Fallback: only create new paragraph if editor is completely empty
          if (!cursorSet) {
            const rootChildren = root.getChildren();
            if (rootChildren.length === 0) {
              // Editor is empty, create a paragraph
              console.log(
                "[DELETE-DEBUG] Fallback: editor empty, creating new paragraph"
              );
              const newParagraph = $createParagraphNode();
              root.append(newParagraph);
              newSelection.anchor.set(newParagraph.getKey(), 0, "element");
              newSelection.focus.set(newParagraph.getKey(), 0, "element");
            } else {
              // Editor has content, use the first available element
              console.log(
                "[DELETE-DEBUG] Fallback: using first available element"
              );
              const firstChild = rootChildren[0];
              const firstText = findFirstTextNode(firstChild);
              if (firstText && $isTextNode(firstText)) {
                newSelection.anchor.set(firstText.getKey(), 0, "text");
                newSelection.focus.set(firstText.getKey(), 0, "text");
              } else {
                newSelection.anchor.set(firstChild.getKey(), 0, "element");
                newSelection.focus.set(firstChild.getKey(), 0, "element");
              }
            }
          }

          $setSelection(newSelection);
          console.log("[DELETE-DEBUG] Selection set");
        });

        if (event) {
          event.preventDefault();
        }
        return true;
      }

      // No labels touched - let Lexical handle normal deletion
      return false;
    };

    // Register command handlers for Backspace and Delete keys
    // Priority 1 ensures this plugin runs before Lexical's default deletion handlers
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
