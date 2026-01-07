import {
  $createListNode,
  $isListItemNode,
  $isListNode,
  INSERT_UNORDERED_LIST_COMMAND,
} from "@lexical/list";
// features/editor/commands/smartList.ts

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
 * Public command your toolbar should dispatch.
 */
export const SMART_TOGGLE_BULLET_LIST = createCommand<void>();

/** Find nearest ListItem ancestor for any node. */
// this works by just going upwards until you find a list item node or run out of parent nodes
function getListItemAncestor(node: LexicalNode | null): LexicalNode | null {
  let cur: LexicalNode | null = node;
  while (cur) {
    if ($isListItemNode(cur)) return cur;
    cur = cur.getParent();
  }
  return null;
}

function getNearestBlock(node: LexicalNode): LexicalNode {
  let cur: LexicalNode | null = node;
  while (cur) {
    const parent = cur.getParent();
    // Stop at root OR if current is a direct child of root.
    if (!parent || parent.getType?.() === "root") return cur;
    cur = parent;
  }
  return node;
}

function wrapBlocksInBulletList(blocks: LexicalNode[]) {
  if (blocks.length === 0) return;

  // Dedup blocks by key and keep doc order
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

  // Create the list and insert it before the first block
  const list = $createListNode("bullet");
  uniqueBlocks[0].insertBefore(list);

  for (const block of uniqueBlocks) {
    // Skip empty paragraphs if any slipped through (extra safety)
    if (
      block.getType() === "paragraph" &&
      (block as any).getTextContentSize?.() === 0
    ) {
      continue;
    }

    const li = $createListItemNode();

    // Move the block's children into the list item (preserves inline formatting)
    if ($isElementNode(block)) {
      const kids = block.getChildren();
      for (const k of kids) li.append(k);
    } else {
      // If it’s not an element (rare at block level), just append it
      li.append(block);
    }

    list.append(li);
    block.remove();
  }

  // If list ended up empty, remove it
  if (list.getChildren().length === 0) {
    list.remove();
  }
}

function getSelectedListItems(selection: any, editor, inList): LexicalNode[] {
  // Collapsed selection (caret): use the anchor list item directly
  if (selection.isCollapsed?.()) {
    const li = getListItemAncestor(selection.anchor.getNode());
    return li ? [li] : [];
  }

  // Range selection: lift nodes to list item ancestors
  const nodes: LexicalNode[] = selection.getNodes();
  const seen = new Set<string>();
  const items: LexicalNode[] = [];

  console.log(
    "mark a getSelectedListItems",
    nodes,
    selection.anchor,
    selection.focus
  );

  const isBackward = selection.isBackward();

  // makes sure that the list focus or anchor isnt in an item that isn't visually highlighted

  const liToFilter: (string | undefined)[] = [];
  let foundFirstNonParagraph = false;
  let firstParagraph = 0;
  let endingParagraph = 0;
  let filteredNodes = nodes.filter((n) => {
    if (n.getType() === "paragraph" && n.getTextContentSize() === 0) {
      if (firstParagraph >= 0 && !foundFirstNonParagraph) {
        firstParagraph++;
        return true;
      } else {
        endingParagraph++;
        return true;
      }
    }

    foundFirstNonParagraph = true;
    endingParagraph = 0;

    const anchor = selection.anchor;
    const isAnchor = anchor.key === n.getKey();
    const focus = selection.focus;
    const isFocus = focus.key === n.getKey();

    if (n.getType() === "text") {
      const textLength = n.getTextContent().length;
      const backwardAnchorGhostCaret =
        isBackward && isAnchor && anchor.offset === 0;
      const backwardFocusGhostCaret =
        isBackward && isFocus && focus.offset === textLength;
      const anchorGhostCaret = !isBackward && isFocus && focus.offset === 0;
      const focusGhostCaret =
        !isBackward && isAnchor && anchor.offset === textLength;

      if (backwardAnchorGhostCaret || anchorGhostCaret) {
        liToFilter.push(getListItemAncestor(anchor.getNode())?.getKey());
        return false;
      }
      if (backwardFocusGhostCaret || focusGhostCaret) {
        liToFilter.push(getListItemAncestor(focus.getNode())?.getKey());
        return false;
      }
    }

    return true;
  });

  if (firstParagraph === 0 && endingParagraph === 0 && !inList) {
    console.log("DISPATCHING COMMAND");
    editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
    return [];
  }
  console.log("mark PARAGRAPHS", firstParagraph, endingParagraph);
  console.log("mark filtering before li and paras", { filteredNodes });

  filteredNodes = filteredNodes.filter((n) => !liToFilter.includes(n.getKey()));
  console.log("mark filtering after lis", { filteredNodes });
  // filteredNodes = filteredNodes.slice(firstParagraph, filteredNodes.length);
  const end = Math.max(firstParagraph, filteredNodes.length - endingParagraph);
  filteredNodes = filteredNodes.slice(firstParagraph, end);
  // filteredNodes = filteredNodes.slice(0, -endingParagraph);

  console.log("mark filtering after paras", { filteredNodes });
  for (const n of filteredNodes) {
    const li = getListItemAncestor(n);
    if (!li) continue;

    const key = (li as any).getKey();
    if (!seen.has(key)) {
      seen.add(key);
      items.push(li);
    }
  }

  return items.length ? items : filteredNodes;
}

/**
 * Convert a ListItemNode -> ParagraphNode while preserving nested lists Notion-style.
 * - Non-list children become content of the paragraph
 * - Nested ListNode children are inserted AFTER the paragraph
 */
function listItemToParagraphPreserveNested(listItem: any) {
  const paragraph = $createParagraphNode();

  const children = listItem.getChildren?.() ?? [];
  const nestedLists: LexicalNode[] = [];

  for (const child of children) {
    if ($isListNode(child)) {
      nestedLists.push(child);
    } else {
      paragraph.append(child); // moves node
    }
  }

  listItem.replace(paragraph);

  for (const nl of nestedLists) {
    paragraph.insertAfter(nl);
  }

  return paragraph;
}

/**
 * Split a list so items AFTER endIndex move into a new list inserted AFTER the original.
 * Avoids clone() instability by creating a fresh list node.
 */
function splitListAfterRange(listNode: any, endIndex: number) {
  const items: LexicalNode[] = listNode.getChildren();
  const afterItems = items.slice(endIndex + 1);

  if (afterItems.length === 0) return null;

  const listType = listNode.getListType?.() ?? "bullet";
  const newList = $createListNode(listType);

  for (const li of afterItems) {
    newList.append(li); // moves
  }

  const parent = listNode.getParent?.();
  if (!parent) {
    $getRoot().append(newList);
    return newList;
  }

  listNode.insertAfter(newList);
  return newList;
}

/**
 * Notion-style unlist:
 * - Only unlists the selected list items
 * - Splits list into before/after lists as needed
 * - Cleans up empty lists
 */
function smartUnlistSelectionInsideUpdate(editor: LexicalEditor, inList) {
  const selection = $getSelection();
  if (!$isRangeSelection(selection)) return;

  // checks to see if its just a caret selection and then grabs the parent list item

  const selectedItems = getSelectedListItems(selection, editor, inList);
  console.log("mark a selectedItems", selectedItems);

  if (selectedItems.length === 0) {
    editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
    return;
  }

  // NEW: if we got nodes but they are NOT list items, wrap them into a list
  const hasAnyListItem = selectedItems.some((n) => $isListItemNode(n));
  if (!hasAnyListItem) {
    wrapBlocksInBulletList(selectedItems);
    return;
  }

  // Group selected items by their parent ListNode
  const groups = new Map<string, LexicalNode[]>();
  for (const li of selectedItems) {
    const parent = (li as any).getParent?.();
    if (!parent || !$isListNode(parent)) continue;

    const key = (parent as any).getKey();
    const arr = groups.get(key) ?? [];
    arr.push(li);
    groups.set(key, arr);
  }

  for (const [, group] of groups) {
    const listNode: any = (group[0] as any).getParent?.();
    if (!listNode || !$isListNode(listNode)) continue;

    const allItems: LexicalNode[] = listNode.getChildren();
    const selectedKeys = new Set(group.map((n: any) => n.getKey?.()));

    const indices = allItems
      .map((it, idx) => (selectedKeys.has((it as any).getKey?.()) ? idx : -1))
      .filter((idx) => idx !== -1)
      .sort((a, b) => a - b);

    if (indices.length === 0) continue;

    // Break into contiguous ranges of list items
    const ranges: Array<[number, number]> = [];
    let start = indices[0];
    let prev = indices[0];

    for (let i = 1; i < indices.length; i++) {
      const cur = indices[i];
      if (cur === prev + 1) {
        prev = cur;
      } else {
        ranges.push([start, prev]);
        start = cur;
        prev = cur;
      }
    }
    ranges.push([start, prev]);

    // Process bottom->top so indices don't shift
    ranges.sort((a, b) => b[0] - a[0]);

    for (const [startIndex, endIndex] of ranges) {
      // Capture keys BEFORE split (split mutates children)
      const childrenBeforeSplit = listNode.getChildren();
      const toConvertKeys: string[] = [];

      for (let i = endIndex; i >= startIndex; i--) {
        const li: any = childrenBeforeSplit[i];
        if (li && $isListItemNode(li)) {
          toConvertKeys.push(li.getKey());
        }
      }

      // Split list so "after" items stay in a list
      splitListAfterRange(listNode, endIndex);

      // Convert captured items (reacquire by key)
      for (const key of toConvertKeys) {
        const li: any = $getNodeByKey(key);
        if (li && $isListItemNode(li)) {
          listItemToParagraphPreserveNested(li);
        }
      }

      // Remove empty list
      if (listNode.getChildren().length === 0) {
        listNode.remove();
      }
    }
  }
}

/**
 * Public entry point.
 * - If selection is in a list: Notion-style partial unlist
 * - Else: insert bullet list
 */
export function smartToggleBulletList(editor: LexicalEditor) {
  editor.update(() => {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) return;

    // check if in list by traversing upwards until finding a list item or no more parents from anchor / focus points
    const anchorLi = getListItemAncestor(selection.anchor.getNode());
    const focusLi = getListItemAncestor(selection.focus.getNode());
    let inList = !!anchorLi || !!focusLi;

    // checking to see if highlight starts in 1 list and ends in another
    if (anchorLi && focusLi) {
      if (anchorLi.getParent()?.getKey() !== focusLi.getParent()?.getKey()) {
        inList = true;
      }
      // else {
      //   inList = false;
      // }
    }

    console.log("mark a inList", inList);

    // if in a list, smart toggle list items
    if (true) {
      smartUnlistSelectionInsideUpdate(editor, inList);
    } else {
      // else use the default command to apply or remove OL
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
    }
  });
}
