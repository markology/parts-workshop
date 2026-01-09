/**
 * SpeakerLabelDecorator - A decorator node for speaker labels
 *
 * This decorator node renders the speaker label as a read-only, non-selectable
 * pill/badge. Since it's a decorator node, it cannot be formatted or selected,
 * which simplifies deletion logic and prevents formatting issues.
 */

"use client";

import {
  DecoratorNode,
  NodeKey,
  EditorConfig,
  LexicalNode,
  SerializedLexicalNode,
  Spread,
} from "lexical";
import { ReactNode } from "react";

export type SerializedSpeakerLabelDecorator = Spread<
  {
    speakerId: string | null;
    label: string;
    color: string;
  },
  SerializedLexicalNode
>;

/**
 * Decorator node for speaker labels.
 * This node is read-only and non-selectable, making it behave like a single character
 * that cannot be formatted or partially selected.
 */
export class SpeakerLabelDecorator extends DecoratorNode<ReactNode> {
  __speakerId: string | null;
  __label: string;
  __color: string;

  static getType(): string {
    return "speaker-label-decorator";
  }

  static clone(node: SpeakerLabelDecorator): SpeakerLabelDecorator {
    return new SpeakerLabelDecorator(
      node.__speakerId,
      node.__label,
      node.__color,
      node.__key
    );
  }

  constructor(
    speakerId: string | null,
    label: string,
    color: string,
    key?: NodeKey
  ) {
    super(key);
    this.__speakerId = speakerId;
    this.__label = label;
    this.__color = color;
  }

  getSpeakerId(): string | null {
    return this.__speakerId;
  }

  getLabel(): string {
    return this.__label;
  }

  getColor(): string {
    return this.__color;
  }

  // Decorator nodes are non-selectable and read-only by default
  // This means they can't be formatted or partially selected
  isInline(): boolean {
    return true; // Inline decorator (like a character)
  }

  createDOM(): HTMLElement {
    // Return a span that will contain the decorator React component
    const span = document.createElement("span");
    span.style.display = "inline-block";
    return span;
  }

  updateDOM(): boolean {
    // Decorator nodes don't need DOM updates - React handles it
    return false;
  }

  decorate(): ReactNode {
    // Return the React component for the label
    return (
      <span
        className="inline-block font-bold text-xs px-1.5 py-0.5 rounded-full mr-2.5 border shadow-sm"
        style={{
          backgroundColor: "var(--theme-surface)",
          color: "var(--theme-text-primary)",
          borderColor: "var(--theme-border)",
        }}
        data-speaker-label="true"
        contentEditable={false}
      >
        {this.__label}
      </span>
    );
  }

  static importJSON(
    serializedNode: SerializedSpeakerLabelDecorator
  ): SpeakerLabelDecorator {
    const { speakerId, label, color } = serializedNode;
    return $createSpeakerLabelDecorator(speakerId, label, color);
  }

  exportJSON(): SerializedSpeakerLabelDecorator {
    return {
      speakerId: this.__speakerId,
      label: this.__label,
      color: this.__color,
      type: "speaker-label-decorator",
      version: 1,
    };
  }
}

/**
 * Creates a new SpeakerLabelDecorator node
 */
export function $createSpeakerLabelDecorator(
  speakerId: string | null,
  label: string,
  color: string
): SpeakerLabelDecorator {
  return new SpeakerLabelDecorator(speakerId, label, color);
}

/**
 * Type guard to check if a node is a SpeakerLabelDecorator
 */
export function $isSpeakerLabelDecorator(
  node: LexicalNode | null | undefined
): node is SpeakerLabelDecorator {
  return node instanceof SpeakerLabelDecorator;
}

