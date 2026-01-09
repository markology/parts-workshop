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
  COMMAND_PRIORITY_EDITOR,
} from "lexical";
import {
  INSERT_UNORDERED_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
} from "@lexical/list";
import { $isSpeakerLineNode } from "../SpeakerLineNode";
import { SMART_TOGGLE_BULLET_LIST } from "../commands/smartList";

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
    // Note: We allow formatting (bold, italic, underline) in speaker lines
    // but prevent list conversion and color changes (handled elsewhere)
    // So we don't need to block FORMAT_TEXT_COMMAND here

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

    // Prevent list conversion when inside speaker line
    const unregisterUnorderedList = editor.registerCommand(
      INSERT_UNORDERED_LIST_COMMAND,
      () => {
        const isInSpeaker = editor.getEditorState().read(() => {
          return isSelectionInSpeakerLine();
        });

        if (isInSpeaker) {
          // Prevent list conversion - return true to stop propagation
          return true;
        }

        // Allow list conversion - return false to let Lexical handle it
        return false;
      },
      COMMAND_PRIORITY_HIGH
    );

    const unregisterOrderedList = editor.registerCommand(
      INSERT_ORDERED_LIST_COMMAND,
      () => {
        const isInSpeaker = editor.getEditorState().read(() => {
          return isSelectionInSpeakerLine();
        });

        if (isInSpeaker) {
          // Prevent list conversion - return true to stop propagation
          return true;
        }

        // Allow list conversion - return false to let Lexical handle it
        return false;
      },
      COMMAND_PRIORITY_HIGH
    );

    const unregisterRemoveList = editor.registerCommand(
      REMOVE_LIST_COMMAND,
      () => {
        const isInSpeaker = editor.getEditorState().read(() => {
          return isSelectionInSpeakerLine();
        });

        if (isInSpeaker) {
          // Prevent list removal - return true to stop propagation
          return true;
        }

        // Allow list removal - return false to let Lexical handle it
        return false;
      },
      COMMAND_PRIORITY_HIGH
    );

    // Prevent smart list toggle when inside speaker line
    // Use priority higher than SmartListPlugin (which uses COMMAND_PRIORITY_EDITOR)
    // Priority 3 ensures we intercept before SmartListPlugin's priority 2
    const unregisterSmartList = editor.registerCommand(
      SMART_TOGGLE_BULLET_LIST,
      () => {
        const isInSpeaker = editor.getEditorState().read(() => {
          return isSelectionInSpeakerLine();
        });

        if (isInSpeaker) {
          // Prevent smart list toggle - return true to stop propagation
          return true;
        }

        // Allow smart list toggle - return false to let Lexical handle it
        return false;
      },
      3 // Higher than COMMAND_PRIORITY_EDITOR (2) to intercept before SmartListPlugin
    );

    return () => {
      unregisterPaste();
      unregisterUnorderedList();
      unregisterOrderedList();
      unregisterRemoveList();
      unregisterSmartList();
    };
  }, [editor]);

  return null;
}

