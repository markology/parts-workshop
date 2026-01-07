import { LexicalEditor, LexicalNode } from "lexical";
import { INSERT_UNORDERED_LIST_COMMAND } from "@lexical/list";
import { getListItemAncestor } from "./utils";

/**
 * Selection extraction and filtering logic for smart list operations.
 */

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
export function getSelectedListItems(
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
