import {
  $getSelection,
  $isRangeSelection,
  LexicalEditor,
  LexicalNode,
} from "lexical";
import {
  INSERT_UNORDERED_LIST_COMMAND,
  $isListItemNode,
  $isListNode,
} from "@lexical/list";
import { $getNodeByKey } from "lexical";
import { getListItemAncestor } from "./utils";
import { getSelectedListItems } from "./selection";
import {
  wrapBlocksInBulletList,
  listItemToParagraphPreserveNested,
  splitListAfterRange,
} from "./listOperations";
// Speaker label functionality moved to backup for future use
// import { $isSpeakerLineNode } from "../../SpeakerLineNode";

/**
 * Main orchestration logic for smart list toggling.
 */

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
// Speaker line detection moved to backup for future use
// /**
//  * Checks if a node or any of its ancestors is a speaker line
//  */
// function isInSpeakerLine(node: LexicalNode | null): boolean {
//   let current: LexicalNode | null = node;
//   while (current) {
//     if ($isSpeakerLineNode(current)) {
//       return true;
//     }
//     current = current.getParent();
//   }
//   return false;
// }

export function smartToggleBulletList(editor: LexicalEditor) {
  editor.update(() => {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) return;

    // Speaker line check moved to backup for future use
    // const anchorNode = selection.anchor.getNode();
    // const focusNode = selection.focus.getNode();
    // const selectedNodes = selection.getNodes();
    // if (
    //   isInSpeakerLine(anchorNode) ||
    //   isInSpeakerLine(focusNode) ||
    //   selectedNodes.some((node) => isInSpeakerLine(node))
    // ) {
    //   return;
    // }

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
