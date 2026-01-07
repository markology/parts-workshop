import {
  $createListNode,
  $isListItemNode,
  $isListNode,
  INSERT_UNORDERED_LIST_COMMAND,
} from "@lexical/list";
import {
  $createParagraphNode,
  $getRoot,
  LexicalEditor,
  LexicalNode,
} from "lexical";
import { $createListItemNode } from "@lexical/list";
import { $isElementNode } from "lexical";
import { getNearestBlock } from "./utils";

/**
 * List conversion and manipulation operations.
 */

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
export function wrapBlocksInBulletList(
  blocks: LexicalNode[],
  editor: LexicalEditor
) {
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
export function listItemToParagraphPreserveNested(listItem: any) {
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
export function splitListAfterRange(listNode: any, endIndex: number) {
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

