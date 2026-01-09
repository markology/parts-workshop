import { LexicalNode } from "lexical";
import { $isListItemNode } from "@lexical/list";

/**
 * Utility functions for traversing and finding nodes in the Lexical tree.
 */

/**
 * Finds the nearest ListItem ancestor node by traversing up the parent chain.
 *
 * This is used to determine if a node is inside a list item, regardless of
 * how deeply nested it is within the list item's content.
 *
 * @param node - The node to start searching from (can be null)
 * @returns The ListItemNode ancestor if found, null otherwise
 */
export function getListItemAncestor(
  node: LexicalNode | null
): LexicalNode | null {
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
export function getNearestBlock(node: LexicalNode): LexicalNode {
  let cur: LexicalNode | null = node;
  while (cur) {
    const parent: LexicalNode | null = cur.getParent();
    // Stop at root OR if current is a direct child of root
    if (!parent || parent.getType?.() === "root") return cur;
    cur = parent;
  }
  return node;
}
