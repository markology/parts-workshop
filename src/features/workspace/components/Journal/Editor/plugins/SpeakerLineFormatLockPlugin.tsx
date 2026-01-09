/**
 * Speaker Line Format Lock Plugin
 *
 * Prevents formatting changes (bold, italic, underline) and pasting
 * when the cursor is inside a speaker line node.
 */

"use client";

import { useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  PASTE_COMMAND,
  COMMAND_PRIORITY_HIGH,
} from "lexical";
import { $isSpeakerLineNode } from "../SpeakerLineNode";

/**
 * Checks if the current selection is inside a speaker line node
 */
function isSelectionInSpeakerLine(): boolean {
  const selection = $getSelection();
  if (!$isRangeSelection(selection)) {
    return false;
  }

  const anchorNode = selection.anchor.getNode();
  const focusNode = selection.focus.getNode();

  // Check if anchor or focus is inside a speaker line
  function isInSpeakerLine(node: any): boolean {
    let current: any = node;
    while (current) {
      if ($isSpeakerLineNode(current)) {
        return true;
      }
      current = current.getParent();
    }
    return false;
  }

  return isInSpeakerLine(anchorNode) || isInSpeakerLine(focusNode);
}

export default function SpeakerLineFormatLockPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    // Prevent formatting when inside speaker line
    const unregisterFormat = editor.registerCommand(
      FORMAT_TEXT_COMMAND,
      (format: string) => {
        const isInSpeaker = editor.getEditorState().read(() => {
          return isSelectionInSpeakerLine();
        });

        if (isInSpeaker) {
          // Prevent formatting - return true to stop propagation
          return true;
        }

        // Allow formatting - return false to let Lexical handle it
        return false;
      },
      COMMAND_PRIORITY_HIGH
    );

    // Prevent pasting when inside speaker line
    const unregisterPaste = editor.registerCommand(
      PASTE_COMMAND,
      (event: ClipboardEvent) => {
        const isInSpeaker = editor.getEditorState().read(() => {
          return isSelectionInSpeakerLine();
        });

        if (isInSpeaker) {
          // Prevent pasting - return true to stop propagation
          event.preventDefault();
          return true;
        }

        // Allow pasting - return false to let Lexical handle it
        return false;
      },
      COMMAND_PRIORITY_HIGH
    );

    return () => {
      unregisterFormat();
      unregisterPaste();
    };
  }, [editor]);

  return null;
}

