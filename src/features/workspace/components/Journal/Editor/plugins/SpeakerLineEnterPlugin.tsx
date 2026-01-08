/**
 * Speaker Line Enter Plugin
 *
 * Handles Enter key behavior when inside a SpeakerLineNode:
 * - Creates a new SpeakerLineNode with the same speaker
 * - Applies the speaker's color to the new line
 */

"use client";

import { useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getSelection,
  $isRangeSelection,
  $createRangeSelection,
  $setSelection,
  KEY_ENTER_COMMAND,
  LexicalNode,
} from "lexical";
import { $patchStyleText } from "@lexical/selection";
import {
  SpeakerLineNode,
  $createSpeakerLineNode,
  $isSpeakerLineNode,
} from "../SpeakerLineNode";
import { useTheme } from "@/features/workspace/hooks/useTheme";

interface SpeakerLineEnterPluginProps {
  partNodes?: Array<{ id: string; label: string }>;
  allPartNodes?: Array<{ id: string; label: string }>;
}

/**
 * Generates a consistent color for a speaker based on their ID.
 */
function getSpeakerColor(
  speakerId: string,
  theme: ReturnType<typeof useTheme>,
  partNodes?: Array<{ id: string; label: string }>,
  allPartNodes?: Array<{ id: string; label: string }>
): string {
  if (speakerId === "self") {
    return theme.info;
  }
  if (speakerId === "unknown") {
    return theme.textMuted;
  }
  const allParts = allPartNodes || partNodes || [];
  const partIndex = allParts.findIndex((p) => p.id === speakerId);
  if (partIndex >= 0) {
    const hue = (partIndex * 137.508) % 360;
    return `hsl(${hue}, 65%, 58%)`;
  }
  return theme.error || "rgb(239, 68, 68)";
}

export default function SpeakerLineEnterPlugin({
  partNodes,
  allPartNodes,
}: SpeakerLineEnterPluginProps) {
  const [editor] = useLexicalComposerContext();
  const theme = useTheme();

  useEffect(() => {
    return editor.registerCommand(
      KEY_ENTER_COMMAND,
      (event: KeyboardEvent | null) => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
          return false;
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

        if (speakerLine) {
          const speakerId = speakerLine.getSpeakerId();
          const groupId = speakerLine.getGroupId();
          if (speakerId) {
            // Create new SpeakerLineNode with same speaker and group ID
            // This preserves the grouping so multiple lines from the same response
            // can be identified and deleted together
            editor.update(() => {
              const newSpeakerLine = $createSpeakerLineNode(speakerId, groupId);
              speakerLine!.insertAfter(newSpeakerLine);

              // Move selection to new line
              const rangeSelection = $createRangeSelection();
              rangeSelection.anchor.set(newSpeakerLine.getKey(), 0, "element");
              rangeSelection.focus.set(newSpeakerLine.getKey(), 0, "element");
              $setSelection(rangeSelection);

              // Apply speaker color to future typing
              const speakerColor = getSpeakerColor(
                speakerId,
                theme,
                partNodes,
                allPartNodes
              );
              $patchStyleText(rangeSelection, { color: speakerColor });
            });

            if (event) {
              event.preventDefault();
            }
            return true;
          }
        }

        return false;
      },
      1 // Priority: higher than default
    );
  }, [editor, theme, partNodes, allPartNodes]);

  return null;
}

