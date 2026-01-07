import {
  $createListNode,
  $isListItemNode,
  $isListNode,
  INSERT_UNORDERED_LIST_COMMAND,
} from "@lexical/list";
import { get } from "http";
// features/editor/commands/smartList.ts

import {
  $createParagraphNode,
  $getNodeByKey,
  $getRoot,
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  createCommand,
  LexicalEditor,
  LexicalNode,
} from "lexical";

/**
 * Public command your toolbar should dispatch.
 */
export const SMART_TOGGLE_BULLET_LIST = createCommand<void>();

/** Find nearest ListItem ancestor for any node. */
function getListItemAncestor(node: LexicalNode | null): LexicalNode | null {
  let cur: LexicalNode | null = node;
  while (cur) {
    if ($isListItemNode(cur)) return cur;
    cur = cur.getParent();
  }
  return null;
}

function getSelectedListItems(selection: any): LexicalNode[] {
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
  const filteredNodes = nodes.filter((n) => {
    const anchor = selection.anchor;
    const isAnchor = anchor.key === n.getKey();
    const focus = selection.focus;
    const isFocus = focus.key === n.getKey();

    if (n.getType() === "listitem") return false;
    if (n.getType() === "text") {
      const textLength = n.getTextContent().length;
      if (
        (isBackward && isAnchor && anchor.offset === 0) ||
        (isBackward && isFocus && focus.offset === textLength)
      )
        return false;
      if (
        (!isBackward && isFocus && focus.offset === 0) ||
        (!isBackward && isAnchor && anchor.offset === textLength)
      )
        return false;
    }

    return true;
  });

  console.log({ filteredNodes });

  for (const n of filteredNodes) {
    const li = getListItemAncestor(n);
    if (!li) continue;

    const key = (li as any).getKey();
    if (!seen.has(key)) {
      seen.add(key);
      items.push(li);
    } else {
    }
  }

  return items;
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
function smartUnlistSelectionInsideUpdate(editor: LexicalEditor) {
  const selection = $getSelection();
  if (!$isRangeSelection(selection)) return;

  const selectedItems = getSelectedListItems(selection);
  console.log("mark a selectedItems", selectedItems);

  if (selectedItems.length === 0) {
    editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
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

    const anchorLi = getListItemAncestor(selection.anchor.getNode());
    const focusLi = getListItemAncestor(selection.focus.getNode());
    const inList = !!anchorLi || !!focusLi;

    if (inList) {
      console.log("mark a, in list");
      smartUnlistSelectionInsideUpdate(editor);
    } else {
      console.log("DISPATCHING INSET UNORDEREDLIST");
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
    }
  });
}
