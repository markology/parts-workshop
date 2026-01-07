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

export type SerializedSpeakerLineNode = Spread<
  {
    speakerId: string | null;
  },
  SerializedElementNode
>;

export class SpeakerLineNode extends ElementNode {
  __speakerId: string | null;

  static getType(): string {
    return "speaker-line";
  }

  static clone(node: SpeakerLineNode): SpeakerLineNode {
    return new SpeakerLineNode(node.__speakerId, node.__key);
  }

  constructor(speakerId: string | null, key?: NodeKey) {
    super(key);
    this.__speakerId = speakerId;
  }

  getSpeakerId(): string | null {
    return this.__speakerId;
  }

  setSpeakerId(speakerId: string | null): void {
    const writable = this.getWritable();
    writable.__speakerId = speakerId;
  }

  // View
  createDOM(config: EditorConfig): HTMLElement {
    const element = document.createElement("p");
    element.className = config.theme.paragraph || "";
    if (this.__speakerId) {
      element.setAttribute("data-speaker-id", this.__speakerId);
    }
    return element;
  }

  updateDOM(
    prevNode: SpeakerLineNode,
    dom: HTMLElement,
    config: EditorConfig
  ): boolean {
    const prevSpeakerId = prevNode.__speakerId;
    if (prevSpeakerId !== this.__speakerId) {
      if (this.__speakerId) {
        dom.setAttribute("data-speaker-id", this.__speakerId);
      } else {
        dom.removeAttribute("data-speaker-id");
      }
    }
    return false;
  }

  static importDOM(): DOMConversionMap | null {
    return {
      p: (node: Node) => {
        const element = node as HTMLElement;
        const speakerId = element.getAttribute("data-speaker-id");
        if (speakerId) {
          return {
            conversion: () => {
              return {
                node: $createSpeakerLineNode(speakerId),
              };
            },
            priority: 1,
          };
        }
        return null;
      },
    };
  }

  exportDOM(editor: LexicalEditor): DOMExportOutput {
    const element = this.createDOM(editor._config);
    if (this.__speakerId) {
      element.setAttribute("data-speaker-id", this.__speakerId);
    }
    return { element };
  }

  static importJSON(serializedNode: SerializedSpeakerLineNode): SpeakerLineNode {
    const { speakerId, format, indent, direction } = serializedNode;
    const node = $createSpeakerLineNode(speakerId || null);
    node.setFormat(format);
    node.setIndent(indent);
    node.setDirection(direction);
    return node;
  }

  exportJSON(): SerializedSpeakerLineNode {
    return {
      ...super.exportJSON(),
      speakerId: this.__speakerId,
      type: "speaker-line",
      version: 1,
    };
  }

  // Mutation
  insertNewAfter(
    rangeSelection: RangeSelection,
    restoreSelection: boolean
  ): SpeakerLineNode {
    const newSpeakerLine = $createSpeakerLineNode(this.__speakerId);
    const direction = this.getDirection();
    newSpeakerLine.setDirection(direction);
    this.insertAfter(newSpeakerLine, restoreSelection);
    return newSpeakerLine;
  }

  collapseAtStart(): boolean {
    const paragraph = $createParagraphNode();
    const children = this.getChildren();
    children.forEach((child) => paragraph.append(child));
    this.replace(paragraph);
    return true;
  }
}

export function $createSpeakerLineNode(speakerId: string | null): SpeakerLineNode {
  return new SpeakerLineNode(speakerId);
}

export function $isSpeakerLineNode(
  node: LexicalNode | null | undefined
): node is SpeakerLineNode {
  return node instanceof SpeakerLineNode;
}

