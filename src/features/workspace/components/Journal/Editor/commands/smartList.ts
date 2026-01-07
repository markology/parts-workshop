import {
  $createListNode,
  $isListItemNode,
  $isListNode,
  INSERT_UNORDERED_LIST_COMMAND,
} from "@lexical/list";
import {
  $createParagraphNode,
  $getNodeByKey,
  $getRoot,
  $getSelection,
  $isRangeSelection,
  createCommand,
  LexicalEditor,
  LexicalNode,
} from "lexical";
import { $createListItemNode } from "@lexical/list";
import { $isElementNode } from "lexical";

/**
 * Public command that can be dispatched from the toolbar to toggle bullet lists.
 * This command implements "smart" list behavior similar to Notion:
 * - If selection is in a list: partially unlist selected items (Notion-style)
 * - If selection is not in a list: convert selected blocks to a bullet list
 */
export const SMART_TOGGLE_BULLET_LIST = createCommand<void>();

/**
 * Finds the nearest ListItem ancestor node by traversing up the parent chain.
 *
 * This is used to determine if a node is inside a list item, regardless of
 * how deeply nested it is within the list item's content.
 *
 * @param node - The node to start searching from (can be null)
 * @returns The ListItemNode ancestor if found, null otherwise
 */
function getListItemAncestor(node: LexicalNode | null): LexicalNode | null {
  let cur: LexicalNode | null = node;
  while (cur) {
    if ($isListItemNode(cur)) return cur;
    cur = cur.getParent();
  }
  return null;
}

/**
 * Finds the nearest block-level node (a direct child of root).
 *
 * Block-level nodes are top-level elements like paragraphs, headings, lists, etc.
 * This function traverses up the parent chain until it reaches a node that is
 * a direct child of the root, or until it reaches the root itself.
 *
 * @param node - The node to start from
 * @returns The nearest block-level node
 */
function getNearestBlock(node: LexicalNode): LexicalNode {
  let cur: LexicalNode | null = node;
  while (cur) {
    const parent = cur.getParent();
    // Stop at root OR if current is a direct child of root
    if (!parent || parent.getType?.() === "root") return cur;
    cur = parent;
  }
  return node;
}

/**
 * Converts a collection of block nodes into a bullet list.
 *
 * This function takes selected blocks (paragraphs, headings, etc.) and wraps
 * them in a bullet list structure. Each block becomes a list item, preserving
 * all inline formatting and nested content.
 *
 * Special handling:
 * - If the first or last block is already a list, delegates to the standard
 *   INSERT_UNORDERED_LIST_COMMAND instead
 * - Deduplicates blocks by key to avoid processing the same block twice
 * - Preserves document order
 *
 * @param blocks - Array of nodes to convert to list items
 * @param editor - The Lexical editor instance
 */
function wrapBlocksInBulletList(blocks: LexicalNode[], editor: LexicalEditor) {
  if (blocks.length === 0) return;

  // If selection starts or ends with a list, use standard list command
  // This handles edge cases where mixing lists and non-lists
  if (
    blocks[0].getType() === "list" ||
    blocks[blocks.length - 1].getType() === "list"
  ) {
    editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
    return;
  }

  // Deduplicate blocks by key and maintain document order
  // Multiple nodes might reference the same block (e.g., text nodes within a paragraph)
  const seen = new Set<string>();
  const uniqueBlocks: LexicalNode[] = [];
  for (const n of blocks) {
    const b = getNearestBlock(n);
    const key = (b as any).getKey?.();
    if (key && !seen.has(key)) {
      seen.add(key);
      uniqueBlocks.push(b);
    }
  }
  if (uniqueBlocks.length === 0) return;

  // Create a new bullet list and insert it before the first block
  const list = $createListNode("bullet");
  uniqueBlocks[0].insertBefore(list);

  // Convert each block into a list item
  for (const block of uniqueBlocks) {
    const li = $createListItemNode();

    // Move the block's children into the list item (preserves inline formatting)
    // This ensures bold, italic, colors, etc. are maintained
    if ($isElementNode(block)) {
      const kids = block.getChildren();
      for (const k of kids) li.append(k);
    } else {
      // If it's not an element (rare at block level), just append it directly
      li.append(block);
    }

    list.append(li);
    block.remove();
  }

  // Cleanup: if list ended up empty, remove it
  if (list.getChildren().length === 0) {
    list.remove();
  }
}

/**
 * Extracts list items from the current selection, with sophisticated filtering
 * to handle edge cases like ghost selections and empty paragraphs.
 *
 * This function handles several complex scenarios:
 * 1. Collapsed selections (caret): returns the list item containing the caret
 * 2. Range selections: extracts all list items that are actually selected
 * 3. Ghost selections: filters out list items where the selection endpoint
 *    is at a boundary but the line isn't visually highlighted
 * 4. Empty paragraphs: trims leading and trailing empty paragraphs from selection
 *
 * @param selection - The current Lexical selection
 * @param editor - The Lexical editor instance
 * @param inList - Whether the selection is already inside a list
 * @returns Array of list item nodes, or block nodes if no list items found
 */
function getSelectedListItems(
  selection: any,
  editor: LexicalEditor,
  inList: boolean
): LexicalNode[] {
  // Collapsed selection (caret): use the anchor list item directly
  if (selection.isCollapsed?.()) {
    const li = getListItemAncestor(selection.anchor.getNode());
    return li ? [li] : [];
  }

  // Range selection: extract nodes and filter intelligently
  const nodes: LexicalNode[] = selection.getNodes();
  const seen = new Set<string>();
  const items: LexicalNode[] = [];

  const isBackward = selection.isBackward();

  // Track list items to filter out due to "ghost caret" scenarios
  // A ghost caret occurs when the selection endpoint is at a text boundary
  // but the line isn't visually highlighted (e.g., anchor at offset 0 or end)
  const liToFilter: (string | undefined)[] = [];

  // Track leading and trailing empty paragraphs to trim them from selection
  let foundFirstNonParagraph = false;
  let firstParagraph = 0; // Count of leading empty paragraphs
  let endingParagraph = 0; // Count of trailing empty paragraphs

  // First pass: filter nodes and identify ghost carets and empty paragraphs
  let filteredNodes = nodes.filter((n) => {
    // Count leading empty paragraphs (before first non-empty content)
    if (n.getType() === "paragraph" && n.getTextContentSize() === 0) {
      if (firstParagraph >= 0 && !foundFirstNonParagraph) {
        firstParagraph++;
        return true; // Keep for now, will slice later
      } else {
        endingParagraph++;
        return true; // Keep for now, will slice later
      }
    }

    // Found non-empty content, reset trailing count
    foundFirstNonParagraph = true;
    endingParagraph = 0;

    // Check if this node is at a selection endpoint (anchor or focus)
    const anchor = selection.anchor;
    const isAnchor = anchor.key === n.getKey();
    const focus = selection.focus;
    const isFocus = focus.key === n.getKey();

    // Detect ghost caret scenarios for text nodes
    // These occur when selection endpoint is at text boundary but line isn't highlighted
    if (n.getType() === "text") {
      const textLength = n.getTextContent().length;

      // Backward selection: anchor at start (offset 0) = ghost caret
      const backwardAnchorGhostCaret =
        isBackward && isAnchor && anchor.offset === 0;
      // Backward selection: focus at end = ghost caret
      const backwardFocusGhostCaret =
        isBackward && isFocus && focus.offset === textLength;
      // Forward selection: focus at start (offset 0) = ghost caret
      const anchorGhostCaret = !isBackward && isFocus && focus.offset === 0;
      // Forward selection: anchor at end = ghost caret
      const focusGhostCaret =
        !isBackward && isAnchor && anchor.offset === textLength;

      // If ghost caret detected, mark the containing list item for filtering
      if (backwardAnchorGhostCaret || anchorGhostCaret) {
        liToFilter.push(getListItemAncestor(anchor.getNode())?.getKey());
        return false; // Exclude this node
      }
      if (backwardFocusGhostCaret || focusGhostCaret) {
        liToFilter.push(getListItemAncestor(focus.getNode())?.getKey());
        return false; // Exclude this node
      }
    }

    return true;
  });

  // Special case: if selection contains no empty paragraphs and we're not in a list,
  // just use the standard list command (handles edge cases better)
  if (firstParagraph === 0 && endingParagraph === 0 && !inList) {
    editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
    return [];
  }

  // Second pass: filter out list items with ghost carets
  filteredNodes = filteredNodes.filter((n) => !liToFilter.includes(n.getKey()));

  // Third pass: trim leading and trailing empty paragraphs
  // This ensures we don't include empty paragraphs at the edges of selection
  const end = Math.max(firstParagraph, filteredNodes.length - endingParagraph);
  filteredNodes = filteredNodes.slice(firstParagraph, end);

  // Final pass: extract list items from remaining nodes
  for (const n of filteredNodes) {
    const li = getListItemAncestor(n);
    if (!li) continue;

    const key = (li as any).getKey();
    if (!seen.has(key)) {
      seen.add(key);
      items.push(li);
    }
  }

  // Return list items if found, otherwise return the filtered block nodes
  // (this allows wrapBlocksInBulletList to handle non-list selections)
  return items.length ? items : filteredNodes;
}

/**
 * Converts a ListItemNode to a ParagraphNode while preserving nested lists.
 *
 * This implements Notion-style unlisting behavior:
 * - All non-list children (text, formatting, etc.) become content of the paragraph
 * - Nested ListNode children are preserved and inserted AFTER the paragraph
 *
 * This ensures that when you unlist an item, any nested lists within it remain
 * as separate lists below the new paragraph, rather than being lost or flattened.
 *
 * @param listItem - The list item node to convert
 * @returns The new paragraph node that replaced the list item
 */
function listItemToParagraphPreserveNested(listItem: any) {
  const paragraph = $createParagraphNode();

  const children = listItem.getChildren?.() ?? [];
  const nestedLists: LexicalNode[] = [];

  // Separate list children from non-list children
  for (const child of children) {
    if ($isListNode(child)) {
      // Save nested lists to insert after paragraph
      nestedLists.push(child);
    } else {
      // Move non-list children into the paragraph (preserves formatting)
      paragraph.append(child); // moves node
    }
  }

  // Replace the list item with the paragraph
  listItem.replace(paragraph);

  // Insert nested lists after the paragraph (Notion-style behavior)
  for (const nl of nestedLists) {
    paragraph.insertAfter(nl);
  }

  return paragraph;
}

/**
 * Splits a list at a given index, moving items after the index into a new list.
 *
 * When unlisting a range of items from the middle of a list, we need to preserve
 * the items that come after the unlisted range. This function creates a new list
 * containing those items and inserts it after the original list.
 *
 * Example: If list has items [A, B, C, D, E] and we unlist [C, D]:
 * - Original list becomes [A, B]
 * - New list [E] is inserted after original list
 *
 * This avoids clone() instability by creating a fresh list node rather than
 * cloning the original.
 *
 * @param listNode - The list node to split
 * @param endIndex - The index of the last item to keep in the original list
 * @returns The new list node containing items after endIndex, or null if no items to move
 */
function splitListAfterRange(listNode: any, endIndex: number) {
  const items: LexicalNode[] = listNode.getChildren();
  const afterItems = items.slice(endIndex + 1);

  // If no items to move, nothing to do
  if (afterItems.length === 0) return null;

  // Create a new list of the same type (bullet/ordered)
  const listType = listNode.getListType?.() ?? "bullet";
  const newList = $createListNode(listType);

  // Move items to the new list
  for (const li of afterItems) {
    newList.append(li); // moves nodes from original list
  }

  // Insert the new list after the original list
  const parent = listNode.getParent?.();
  if (!parent) {
    // If list has no parent, append to root
    $getRoot().append(newList);
    return newList;
  }

  listNode.insertAfter(newList);
  return newList;
}

/**
 * Implements Notion-style partial unlisting of selected list items.
 *
 * This function handles the complex case where only some items in a list are
 * selected for unlisting. It:
 * 1. Extracts the selected list items (or blocks if not in a list)
 * 2. If no list items found but blocks exist, wraps them in a list
 * 3. Groups selected items by their parent list
 * 4. For each list, finds contiguous ranges of selected items
 * 5. Unlists each range while preserving items before and after
 * 6. Cleans up empty lists
 *
 * The key insight is that we process ranges bottom-to-top to avoid index
 * shifting issues when modifying the list structure.
 *
 * @param editor - The Lexical editor instance
 * @param inList - Whether the selection is already inside a list
 */
function smartUnlistSelectionInsideUpdate(
  editor: LexicalEditor,
  inList: boolean
) {
  const selection = $getSelection();
  if (!$isRangeSelection(selection)) return;

  // Extract selected items (list items or blocks)
  const selectedItems = getSelectedListItems(selection, editor, inList);

  // If no items selected, use standard list command
  if (selectedItems.length === 0) {
    editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
    return;
  }

  // If we got nodes but they are NOT list items, wrap them into a list
  // This handles the case where user selects regular paragraphs and wants to list them
  const hasAnyListItem = selectedItems.some((n) => $isListItemNode(n));
  if (!hasAnyListItem) {
    wrapBlocksInBulletList(selectedItems, editor);
    return;
  }

  // Group selected items by their parent ListNode
  // This handles selections that span multiple lists
  const groups = new Map<string, LexicalNode[]>();
  for (const li of selectedItems) {
    const parent = (li as any).getParent?.();
    if (!parent || !$isListNode(parent)) continue;

    const key = (parent as any).getKey();
    const arr = groups.get(key) ?? [];
    arr.push(li);
    groups.set(key, arr);
  }

  // Process each list separately
  for (const [, group] of groups) {
    const listNode: any = (group[0] as any).getParent?.();
    if (!listNode || !$isListNode(listNode)) continue;

    const allItems: LexicalNode[] = listNode.getChildren();
    const selectedKeys = new Set(group.map((n: any) => n.getKey?.()));

    // Find indices of selected items within the list
    const indices = allItems
      .map((it, idx) => (selectedKeys.has((it as any).getKey?.()) ? idx : -1))
      .filter((idx) => idx !== -1)
      .sort((a, b) => a - b);

    if (indices.length === 0) continue;

    // Break selected indices into contiguous ranges
    // Example: [1, 2, 3, 5, 6] becomes [[1, 3], [5, 6]]
    const ranges: Array<[number, number]> = [];
    let start = indices[0];
    let prev = indices[0];

    for (let i = 1; i < indices.length; i++) {
      const cur = indices[i];
      if (cur === prev + 1) {
        // Contiguous, extend the range
        prev = cur;
      } else {
        // Gap found, save current range and start new one
        ranges.push([start, prev]);
        start = cur;
        prev = cur;
      }
    }
    ranges.push([start, prev]);

    // Process ranges bottom-to-top so indices don't shift as we modify the list
    ranges.sort((a, b) => b[0] - a[0]);

    for (const [startIndex, endIndex] of ranges) {
      // Capture keys BEFORE split (split mutates children, so we need keys)
      const childrenBeforeSplit = listNode.getChildren();
      const toConvertKeys: string[] = [];

      // Collect keys of items to convert (in reverse order for processing)
      for (let i = endIndex; i >= startIndex; i--) {
        const li: any = childrenBeforeSplit[i];
        if (li && $isListItemNode(li)) {
          toConvertKeys.push(li.getKey());
        }
      }

      // Split list so items after the range stay in a list
      // This preserves the list structure for items we're not unlisting
      splitListAfterRange(listNode, endIndex);

      // Convert captured items to paragraphs (reacquire by key since structure changed)
      for (const key of toConvertKeys) {
        const li: any = $getNodeByKey(key);
        if (li && $isListItemNode(li)) {
          listItemToParagraphPreserveNested(li);
        }
      }

      // Cleanup: remove empty list if all items were unlisted
      if (listNode.getChildren().length === 0) {
        listNode.remove();
      }
    }
  }
}

/**
 * Public entry point for smart bullet list toggling.
 *
 * This function implements intelligent list behavior:
 * - If selection is in a list: performs Notion-style partial unlisting
 *   (only unlists selected items, preserves others)
 * - If selection is not in a list: converts selected blocks to a bullet list
 *
 * The function determines if we're in a list by checking if either the anchor
 * or focus point is inside a list item. It also handles the edge case where
 * selection spans multiple lists.
 *
 * @param editor - The Lexical editor instance
 */
export function smartToggleBulletList(editor: LexicalEditor) {
  editor.update(() => {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) return;

    // Determine if selection is inside a list by checking anchor and focus points
    // Traverse upwards from each point to find list item ancestors
    const anchorLi = getListItemAncestor(selection.anchor.getNode());
    const focusLi = getListItemAncestor(selection.focus.getNode());
    let inList = !!anchorLi || !!focusLi;

    // Special case: selection spans multiple lists
    // If anchor and focus are in different lists, we're definitely "in a list"
    if (anchorLi && focusLi) {
      if (anchorLi.getParent()?.getKey() !== focusLi.getParent()?.getKey()) {
        inList = true;
      }
    }

    // Delegate to the main unlisting logic
    smartUnlistSelectionInsideUpdate(editor, inList);
  });
}
