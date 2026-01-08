/**
 * SpeakerLineNode - A custom Lexical node for representing speaker lines in journal entries.
 *
 * This node extends ElementNode to create a specialized paragraph-like element that:
 * - Stores a speakerId to identify which speaker (part/person) is speaking
 * - Renders as a <p> element with a data-speaker-id attribute
 * - Can be serialized/deserialized to/from JSON and DOM
 * - Handles insertion and deletion behaviors specific to speaker lines
 *
 * Example usage: When a user clicks a speaker pill in the toolbar, a SpeakerLineNode
 * is created containing the speaker's label (in bold) followed by the content they type.
 */

import {
  ElementNode,
  LexicalNode,
  NodeKey,
  SerializedElementNode,
  Spread,
  $createParagraphNode,
  EditorConfig,
  DOMExportOutput,
  DOMConversionMap,
  LexicalEditor,
  RangeSelection,
} from "lexical";

/**
 * Serialized representation of a SpeakerLineNode.
 * Extends the base SerializedElementNode with speakerId and groupId fields.
 */
export type SerializedSpeakerLineNode = Spread<
  {
    speakerId: string | null;
    groupId: string | null;
  },
  SerializedElementNode
>;

/**
 * Custom Lexical node for speaker lines in journal entries.
 * Each speaker line represents a line of dialogue or content attributed to a specific speaker.
 *
 * Speaker lines can be grouped together using a groupId. When a user creates a speaker line
 * and presses Enter, the new line shares the same groupId, allowing multiple lines from the
 * same "response" to be identified and deleted together.
 */
export class SpeakerLineNode extends ElementNode {
  /** Internal storage for the speaker ID (e.g., part ID, "self", "unknown") */
  __speakerId: string | null;

  /**
   * Internal storage for the group ID.
   * Groups related speaker lines together (e.g., multiple lines from the same response).
   * When a speaker line is created, it gets a unique groupId. When Enter is pressed,
   * the new line shares the same groupId, allowing the entire group to be deleted together.
   */
  __groupId: string | null;

  /**
   * Returns the Lexical node type identifier for this node.
   * Used by Lexical to identify node types during serialization and updates.
   */
  static getType(): string {
    return "speaker-line";
  }

  /**
   * Creates a clone of this node with the same speakerId and groupId.
   * Used by Lexical internally for undo/redo and state management.
   */
  static clone(node: SpeakerLineNode): SpeakerLineNode {
    return new SpeakerLineNode(node.__speakerId, node.__groupId, node.__key);
  }

  /**
   * Creates a new SpeakerLineNode instance.
   * @param speakerId - The ID of the speaker (can be a part ID, "self", "unknown", or null)
   * @param groupId - Optional group ID for grouping related speaker lines. If not provided, will be null.
   * @param key - Optional Lexical node key (auto-generated if not provided)
   */
  constructor(
    speakerId: string | null,
    groupId: string | null = null,
    key?: NodeKey
  ) {
    super(key);
    this.__speakerId = speakerId;
    this.__groupId = groupId;
  }

  /**
   * Gets the speaker ID associated with this node.
   * @returns The speaker ID string or null if no speaker is set
   */
  getSpeakerId(): string | null {
    return this.__speakerId;
  }

  /**
   * Sets the speaker ID for this node.
   * Uses Lexical's getWritable() to ensure proper state mutation tracking.
   * @param speakerId - The new speaker ID to set
   */
  setSpeakerId(speakerId: string | null): void {
    const writable = this.getWritable();
    writable.__speakerId = speakerId;
  }

  /**
   * Gets the group ID associated with this node.
   * @returns The group ID string or null if no group is set
   */
  getGroupId(): string | null {
    return this.__groupId;
  }

  /**
   * Sets the group ID for this node.
   * Uses Lexical's getWritable() to ensure proper state mutation tracking.
   * @param groupId - The new group ID to set
   */
  setGroupId(groupId: string | null): void {
    const writable = this.getWritable();
    writable.__groupId = groupId;
  }

  // ============================================================================
  // DOM Rendering Methods
  // ============================================================================

  /**
   * Creates the DOM element representation of this node.
   * This method is called by Lexical to render the node in the browser.
   * @param config - The editor configuration containing theme and other settings
   * @returns A <p> element with appropriate classes and data attributes
   */
  createDOM(config: EditorConfig): HTMLElement {
    const element = document.createElement("p");
    element.className = config.theme.paragraph || "";
    // Set data attributes so we can identify speaker lines and their groups
    if (this.__speakerId) {
      element.setAttribute("data-speaker-id", this.__speakerId);
    }
    if (this.__groupId) {
      element.setAttribute("data-group-id", this.__groupId);
    }
    return element;
  }

  /**
   * Updates the DOM element when the node's properties change.
   * This method is called by Lexical to efficiently update the DOM without full re-renders.
   * @param prevNode - The previous version of this node
   * @param dom - The existing DOM element to update
   * @param config - The editor configuration
   * @returns false to indicate Lexical should update child nodes (since we didn't fully update)
   */
  updateDOM(
    prevNode: SpeakerLineNode,
    dom: HTMLElement,
    config: EditorConfig
  ): boolean {
    const prevSpeakerId = prevNode.__speakerId;
    const prevGroupId = prevNode.__groupId;

    // Update speaker ID attribute if it changed
    if (prevSpeakerId !== this.__speakerId) {
      if (this.__speakerId) {
        dom.setAttribute("data-speaker-id", this.__speakerId);
      } else {
        dom.removeAttribute("data-speaker-id");
      }
    }

    // Update group ID attribute if it changed
    if (prevGroupId !== this.__groupId) {
      if (this.__groupId) {
        dom.setAttribute("data-group-id", this.__groupId);
      } else {
        dom.removeAttribute("data-group-id");
      }
    }

    // Return false to let Lexical handle child node updates
    return false;
  }

  // ============================================================================
  // DOM Import/Export Methods
  // ============================================================================

  /**
   * Defines how to convert HTML/DOM elements back into SpeakerLineNode instances.
   * This is used when pasting content or importing HTML into the editor.
   *
   * Currently handles <p> elements with data-speaker-id attributes.
   * @returns A map of HTML tag handlers or null if no conversion is defined
   */
  static importDOM(): DOMConversionMap | null {
    return {
      p: (node: Node) => {
        const element = node as HTMLElement;
        const speakerId = element.getAttribute("data-speaker-id");
        const groupId = element.getAttribute("data-group-id");
        // Only convert <p> elements that have a data-speaker-id attribute
        if (speakerId) {
          return {
            conversion: () => {
              return {
                node: $createSpeakerLineNode(speakerId, groupId),
              };
            },
            priority: 1,
          };
        }
        return null;
      },
    };
  }

  /**
   * Exports this node to a DOM element.
   * This is used when copying/pasting or exporting the editor content to HTML.
   * @param editor - The Lexical editor instance
   * @returns The DOM representation of this node
   */
  exportDOM(editor: LexicalEditor): DOMExportOutput {
    const element = this.createDOM(editor._config);
    // Attributes are already set by createDOM, but we ensure they're present
    if (this.__speakerId) {
      element.setAttribute("data-speaker-id", this.__speakerId);
    }
    if (this.__groupId) {
      element.setAttribute("data-group-id", this.__groupId);
    }
    return { element };
  }

  // ============================================================================
  // JSON Serialization Methods
  // ============================================================================

  /**
   * Creates a SpeakerLineNode from its JSON representation.
   * Used when loading saved editor state from storage.
   * @param serializedNode - The JSON representation of the node
   * @returns A new SpeakerLineNode instance with the restored properties
   */
  static importJSON(
    serializedNode: SerializedSpeakerLineNode
  ): SpeakerLineNode {
    const { speakerId, groupId, format, indent, direction } = serializedNode;
    const node = $createSpeakerLineNode(speakerId || null, groupId || null);
    // Restore formatting properties inherited from ElementNode
    node.setFormat(format);
    node.setIndent(indent);
    node.setDirection(direction);
    return node;
  }

  /**
   * Converts this node to its JSON representation.
   * Used when saving editor state to storage.
   * @returns A serialized object containing all necessary node data
   */
  exportJSON(): SerializedSpeakerLineNode {
    return {
      ...super.exportJSON(),
      speakerId: this.__speakerId,
      groupId: this.__groupId,
      type: "speaker-line",
      version: 1,
    };
  }

  // ============================================================================
  // Mutation/Behavior Methods
  // ============================================================================

  /**
   * Called when the user presses Enter at the end of a speaker line.
   * Creates a new speaker line with the same speaker ID (preserving continuity).
   * @param rangeSelection - The current text selection
   * @param restoreSelection - Whether to restore the selection after insertion
   * @returns The newly created speaker line node
   */
  insertNewAfter(
    rangeSelection: RangeSelection,
    restoreSelection: boolean
  ): SpeakerLineNode {
    // Create a new speaker line with the same speaker ID and group ID
    // This preserves the grouping so multiple lines from the same response
    // can be identified and deleted together
    const newSpeakerLine = $createSpeakerLineNode(
      this.__speakerId,
      this.__groupId
    );
    // Preserve text direction (for RTL/LTR languages)
    const direction = this.getDirection();
    newSpeakerLine.setDirection(direction);
    // Insert the new node after this one
    this.insertAfter(newSpeakerLine, restoreSelection);
    return newSpeakerLine;
  }

  /**
   * Called when the user tries to delete the entire speaker line.
   * Converts the speaker line back to a regular paragraph instead of deleting it.
   * This prevents accidental loss of content when deleting the speaker attribute.
   * @returns true to indicate the operation was handled
   */
  collapseAtStart(): boolean {
    // Create a regular paragraph node
    const paragraph = $createParagraphNode();
    // Move all children (text content) to the paragraph
    const children = this.getChildren();
    children.forEach((child) => paragraph.append(child));
    // Replace this speaker line with the paragraph
    this.replace(paragraph);
    return true; // Signal that we handled the deletion
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Creates a new SpeakerLineNode instance.
 * This is the standard way to create speaker line nodes in Lexical.
 *
 * The $ prefix is a Lexical convention indicating this function must be called
 * within an editor.update() callback or other Lexical mutation context.
 *
 * @param speakerId - The ID of the speaker (can be a part ID, "self", "unknown", or null)
 * @param groupId - Optional group ID for grouping related speaker lines. If not provided, will be null.
 *                  When creating a new speaker line from a pill click, a unique groupId should be generated.
 *                  When pressing Enter in an existing speaker line, pass the existing groupId to preserve grouping.
 * @returns A new SpeakerLineNode instance
 *
 * @example
 * ```typescript
 * // Create a new speaker line with a unique group ID
 * const groupId = crypto.randomUUID();
 * editor.update(() => {
 *   const speakerLine = $createSpeakerLineNode("part-123", groupId);
 *   root.append(speakerLine);
 * });
 *
 * // Create a new line in the same group (e.g., when pressing Enter)
 * editor.update(() => {
 *   const existingLine = getCurrentSpeakerLine();
 *   const newLine = $createSpeakerLineNode("part-123", existingLine.getGroupId());
 *   existingLine.insertAfter(newLine);
 * });
 * ```
 */
export function $createSpeakerLineNode(
  speakerId: string | null,
  groupId: string | null = null
): SpeakerLineNode {
  return new SpeakerLineNode(speakerId, groupId);
}

/**
 * Type guard to check if a LexicalNode is a SpeakerLineNode.
 *
 * The $ prefix is a Lexical convention indicating this function must be called
 * within an editor.read() or editor.update() callback.
 *
 * @param node - The node to check (can be null or undefined)
 * @returns true if the node is a SpeakerLineNode, false otherwise
 *
 * @example
 * ```typescript
 * editor.read(() => {
 *   const node = $getSelection()?.anchor.getNode();
 *   if ($isSpeakerLineNode(node)) {
 *     const speakerId = node.getSpeakerId();
 *   }
 * });
 * ```
 */
export function $isSpeakerLineNode(
  node: LexicalNode | null | undefined
): node is SpeakerLineNode {
  return node instanceof SpeakerLineNode;
}
