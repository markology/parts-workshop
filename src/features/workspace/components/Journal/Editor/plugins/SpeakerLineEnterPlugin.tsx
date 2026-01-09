/**
 * Speaker Line Enter Plugin
 *
 * Simplified behavior: When Enter is pressed inside a speaker line,
 * exit the speaker and create a regular paragraph.
 * This keeps it simple - one speaker line = one response.
 */

"use client";

import { useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  $createParagraphNode,
  $createLineBreakNode,
  $createRangeSelection,
  $setSelection,
  KEY_ENTER_COMMAND,
  LexicalNode,
} from "lexical";
import { SpeakerLineNode, $isSpeakerLineNode } from "../SpeakerLineNode";

export default function SpeakerLineEnterPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      KEY_ENTER_COMMAND,
      (event: KeyboardEvent | null) => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
          return false; // Let Lexical handle non-collapsed selections
        }

        const anchorNode = selection.anchor.getNode();
        let currentNode: LexicalNode | null = anchorNode;
        let speakerLine: SpeakerLineNode | null = null;

        // Walk up to find SpeakerLineNode
        while (currentNode) {
          if ($isSpeakerLineNode(currentNode)) {
            speakerLine = currentNode;
            break;
          }
          currentNode = currentNode.getParent();
        }

        // If we're in a speaker line
        if (speakerLine) {
          // Check if Shift is pressed (Shift+Enter = line break)
          const isShiftPressed = event?.shiftKey === true;

          if (isShiftPressed) {
            // Shift+Enter: Insert a line break within the speaker line
            editor.update(() => {
              const lineBreak = $createLineBreakNode();
              selection.insertNodes([lineBreak]);
            });

            if (event) {
              event.preventDefault();
            }
            return true; // Handled
          } else {
            // Enter (no Shift): Exit speaker by creating a regular paragraph
            editor.update(() => {
              const newParagraph = $createParagraphNode();
              speakerLine!.insertAfter(newParagraph);

              // Position cursor in the new paragraph
              const rangeSelection = $createRangeSelection();
              rangeSelection.anchor.set(newParagraph.getKey(), 0, "element");
              rangeSelection.focus.set(newParagraph.getKey(), 0, "element");
              $setSelection(rangeSelection);
            });

            if (event) {
              event.preventDefault();
            }
            return true; // Handled
          }
        }

        return false; // Let Lexical handle normally
      },
      1 // Priority: higher than default
    );
  }, [editor]);

  return null;
}
