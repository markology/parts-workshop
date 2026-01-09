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
import {
  SpeakerLabelDecorator,
  $createSpeakerLabelDecorator,
  $isSpeakerLabelDecorator,
} from "../SpeakerLabelDecorator";
import { $createTextNode } from "lexical";
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
              
              // Get speaker label and color from the existing line's decorator
              const children = speakerLine.getChildren();
              const existingDecorator = children.find((child) =>
                $isSpeakerLabelDecorator(child)
              ) as SpeakerLabelDecorator | undefined;
              
              // Get speaker color
              const speakerColor = getSpeakerColor(
                speakerId,
                theme,
                partNodes,
                allPartNodes
              );
              
              // Get speaker label
              let speakerLabel = `${speakerId}: `;
              if (existingDecorator) {
                speakerLabel = existingDecorator.getLabel();
              } else {
                // Fallback: try to get label from partNodes
                if (speakerId === "self") {
                  speakerLabel = "Self: ";
                } else if (speakerId === "unknown") {
                  speakerLabel = "Unknown: ";
                } else {
                  const allParts = allPartNodes || partNodes || [];
                  const part = allParts.find((p) => p.id === speakerId);
                  if (part) {
                    speakerLabel = `${part.label}: `;
                  }
                }
              }
              
              // Create decorator for the new line
              const labelDecorator = $createSpeakerLabelDecorator(
                speakerId,
                speakerLabel,
                speakerColor
              );
              newSpeakerLine.append(labelDecorator);
              
              // Create content text node with placeholder
              const contentText = $createTextNode("\uFEFF");
              contentText.setStyle(`color: ${speakerColor}`);
              newSpeakerLine.append(contentText);
              
              speakerLine!.insertAfter(newSpeakerLine);

              // Move selection to content text node
              const rangeSelection = $createRangeSelection();
              rangeSelection.anchor.set(contentText.getKey(), 1, "text");
              rangeSelection.focus.set(contentText.getKey(), 1, "text");
              $setSelection(rangeSelection);

              // Apply speaker color to future typing
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

