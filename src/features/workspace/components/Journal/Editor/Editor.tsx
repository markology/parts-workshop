/**
 * JournalEditor.tsx
 */

"use client";

import { useMemo, useRef } from "react";
import { ImpressionType } from "@/features/workspace/types/Impressions";
import { NodeBackgroundColors } from "../../../constants/Nodes";

// Lexical React
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import SmartListPlugin from "@/features/workspace/components/Journal/Editor/plugins/SmartListPlugin";
import PointerGhostSelectionPlugin from "@/features/workspace/components/Journal/Editor/plugins/PointerGhostSelectionPlugin";
import ToolbarPlugin from "@/features/workspace/components/Journal/Editor/plugins/ToolbarPlugin";
import DebouncedOnChangePlugin from "@/features/workspace/components/Journal/Editor/plugins/DebouncedOnChangePlugin";
import InitialContentPlugin from "@/features/workspace/components/Journal/Editor/plugins/InitialContentPlugin";

// Lexical core
import { LexicalEditor } from "lexical";

import { $generateHtmlFromNodes } from "@lexical/html";
import { ListNode, ListItemNode } from "@lexical/list";
// Speaker label functionality moved to backup files for future use
// import { SpeakerLineNode } from "./SpeakerLineNode";
// import { SpeakerLabelDecorator } from "./SpeakerLabelDecorator";
// import SpeakerLineEnterPlugin from "./plugins/SpeakerLineEnterPlugin";
// import SpeakerLineDeletePlugin from "./plugins/SpeakerLineDeletePlugin";
// import SpeakerLineFormatLockPlugin from "./plugins/SpeakerLineFormatLockPlugin";
import ListBackspacePlugin from "./plugins/ListBackspacePlugin";

interface JournalEditorProps {
  contentJson: string | null;
  onContentChange: (data: { json: string; text: string }) => void;
  readOnly?: boolean;
  nodeType?: ImpressionType | "part" | "tension" | "interaction";
  partNodes?: Array<{ id: string; label: string }>;
  allPartNodes?: Array<{ id: string; label: string }>;
  // Speaker-related props moved to backup for future use
  // selectedSpeakers?: string[];
  // activeSpeaker?: string | null;
  // onToggleSpeaker?: (speakerId: string) => void;
  nodeId?: string;
}

const PLACEHOLDER_TEXT = "Start writing your journal entry...";

const lexicalTheme = {
  paragraph: "mb-1",
  text: {
    bold: "font-bold",
    italic: "italic",
    underline: "underline",
  },
  list: {
    nested: { listitem: "list-none" },
    ol: "list-decimal",
    ul: "list-disc",
    listitem: "ml-4",
  },
};

export function exportEditorHtml(editor: LexicalEditor): string {
  return editor
    .getEditorState()
    .read(() => $generateHtmlFromNodes(editor, null));
}

const innerHtmlStyle = {
  __html: `
/* Speaker label styles moved to backup for future use */
/* Override prose default text color - only apply to elements without inline color style */
.prose { color: var(--theme-text-primary); }
.prose p:not([style*="color"]), 
.prose li:not([style*="color"]), 
.prose span:not([style*="color"]), 
.prose div:not([style*="color"]) {
  color: var(--theme-text-primary);
}
`,
};

export default function JournalEditor({
  contentJson,
  onContentChange,
  readOnly = false,
  nodeType,
  partNodes,
  allPartNodes,
  // Speaker-related props moved to backup for future use
  // selectedSpeakers,
  // activeSpeaker,
  // onToggleSpeaker,
  nodeId,
}: JournalEditorProps) {
  const accentColor = useMemo(() => {
    return (
      (nodeType && NodeBackgroundColors[nodeType]) ||
      NodeBackgroundColors.default
    );
  }, [nodeType]);

  // Shared ref to prevent onChange from firing during initial load
  const isInitialLoadRef = useRef(true);

  const initialConfig = {
    namespace: "JournalEditor",
    theme: lexicalTheme,
    nodes: [ListNode, ListItemNode], // Speaker nodes moved to backup for future use
    onError: (error: Error) => {
      console.error("Lexical error:", error);
    },
    editable: !readOnly,
    editorState: null,
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className="flex h-full flex-col gap-4">
        {!readOnly && (
          <ToolbarPlugin
            partNodes={partNodes}
            allPartNodes={allPartNodes}
            // Speaker-related props moved to backup for future use
            // selectedSpeakers={selectedSpeakers}
            // activeSpeaker={activeSpeaker}
            // onToggleSpeaker={onToggleSpeaker}
            nodeId={nodeId}
            nodeType={nodeType}
          />
        )}

        <div className="relative flex-1 overflow-hidden rounded-2xl border shadow-inner flex border-[var(--theme-border)] bg-[var(--theme-surface)]">
          <div className="flex-1 relative overflow-hidden">
            <style dangerouslySetInnerHTML={innerHtmlStyle} />

            <div className="h-full relative overflow-y-auto">
              <RichTextPlugin
                contentEditable={
                  <ContentEditable
                    className="prose prose-slate w-full min-w-full max-w-none py-5 text-base leading-relaxed focus:outline-none focus-visible:ring-0 dark:prose-invert whitespace-pre-wrap min-h-full pl-[24px] pr-[24px] text-[var(--theme-text-primary)]"
                    style={{
                      caretColor: accentColor,
                    }}
                  />
                }
                placeholder={
                  <div className="pointer-events-none absolute left-6 top-5 text-sm text-[var(--theme-text-muted)]">
                    {PLACEHOLDER_TEXT}
                  </div>
                }
                ErrorBoundary={({ children }) => <>{children}</>}
              />

              <HistoryPlugin />
              <ListPlugin />
              <SmartListPlugin />
              <PointerGhostSelectionPlugin />
              <InitialContentPlugin
                contentJson={contentJson}
                isInitialLoadRef={isInitialLoadRef}
              />
              {!readOnly && (
                <DebouncedOnChangePlugin
                  onContentChange={onContentChange}
                  readOnly={readOnly}
                  isInitialLoadRef={isInitialLoadRef}
                />
              )}
              {/* Speaker plugins moved to backup for future use */}
              {/* {!readOnly && <SpeakerLineEnterPlugin />} */}
              {/* {!readOnly && <SpeakerLineDeletePlugin />} */}
              {/* {!readOnly && <SpeakerLineFormatLockPlugin />} */}
              {!readOnly && <ListBackspacePlugin />}
            </div>
          </div>
        </div>
      </div>
    </LexicalComposer>
  );
}
