/**
 * List Backspace Plugin
 *
 * Handles backspace at the beginning of an empty list item:
 * - Converts the list item to a paragraph (like toggling list off)
 */

"use client";

import { useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getSelection,
  $isRangeSelection,
  $createParagraphNode,
  $createRangeSelection,
  $setSelection,
  KEY_BACKSPACE_COMMAND,
  COMMAND_PRIORITY_HIGH,
  LexicalNode,
} from "lexical";
import { $isListItemNode, $isListNode } from "@lexical/list";
import { getListItemAncestor } from "../commands/smartList/utils";

export default function ListBackspacePlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      KEY_BACKSPACE_COMMAND,
      (event: KeyboardEvent | null) => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
          return false; // Only handle collapsed selection at start
        }

        const anchorNode = selection.anchor.getNode();
        const anchorOffset = selection.anchor.offset;

        // Check if we're at the beginning (offset 0)
        if (anchorOffset !== 0) {
          return false;
        }

        // Find if we're in a list item
        const listItem = getListItemAncestor(anchorNode);
        if (!listItem || !$isListItemNode(listItem)) {
          return false;
        }

        // Check if list item is empty (no text content)
        const textContent = listItem.getTextContent().trim();
        if (textContent !== "") {
          return false; // Not empty, let Lexical handle it
        }

        // Check if this is the first item in the list
        const list = listItem.getParent();
        if (!$isListNode(list)) {
          return false;
        }

        const listChildren = list.getChildren();
        const isFirstItem = listChildren.length > 0 && listChildren[0] === listItem;
        
        // Only convert to paragraph if it's the first item
        if (!isFirstItem) {
          return false; // Not the first item, let Lexical handle it
        }

        // Convert list item to paragraph
        editor.update(() => {
          const paragraph = $createParagraphNode();
          listItem.replace(paragraph);

          // Position cursor in the new paragraph
          const rangeSelection = $createRangeSelection();
          rangeSelection.anchor.set(paragraph.getKey(), 0, "element");
          rangeSelection.focus.set(paragraph.getKey(), 0, "element");
          $setSelection(rangeSelection);
        });

        if (event) {
          event.preventDefault();
        }
        return true; // Handled
      },
      COMMAND_PRIORITY_HIGH
    );
  }, [editor]);

  return null;
}

