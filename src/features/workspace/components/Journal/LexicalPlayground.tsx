"use client";

/**
 * Lexical Playground - Simple test to understand how Lexical works
 * 
 * This is a minimal implementation to experiment with Lexical's API
 */

import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { LexicalEditor, EditorState } from "lexical";
import { $getRoot, $getSelection, $isRangeSelection } from "lexical";
import { $generateHtmlFromNodes } from "@lexical/html";

// Minimal theme
const theme = {
  paragraph: "mb-1",
  text: {
    bold: "font-bold",
    italic: "italic",
    underline: "underline",
  },
};

// Initial config
const initialConfig = {
  namespace: "Playground",
  theme,
  onError: (error: Error) => {
    console.error("Lexical error:", error);
  },
  editable: true,
};

// Simple plugin to log changes
function LogPlugin() {
  const [editor] = useLexicalComposerContext();

  return (
    <OnChangePlugin
      onChange={(editorState: EditorState, editor: LexicalEditor) => {
        editorState.read(() => {
          const root = $getRoot();
          const selection = $getSelection();
          
          console.log("=== Editor State Changed ===");
          console.log("Root text:", root.getTextContent());
          console.log("Selection:", $isRangeSelection(selection) ? "Range selection" : "No selection");
          
          if ($isRangeSelection(selection)) {
            console.log("Selected text:", selection.getTextContent());
          }
          
          // Generate HTML
          const html = $generateHtmlFromNodes(editor, null);
          console.log("HTML:", html);
        });
      }}
    />
  );
}

// Simple toolbar
function Toolbar() {
  const [editor] = useLexicalComposerContext();

  const makeBold = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        selection.formatText("bold");
      }
    });
  };

  const makeItalic = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        selection.formatText("italic");
      }
    });
  };

  return (
    <div className="flex gap-2 p-2 border-b">
      <button onClick={makeBold} className="px-2 py-1 border rounded">
        Bold
      </button>
      <button onClick={makeItalic} className="px-2 py-1 border rounded">
        Italic
      </button>
    </div>
  );
}

export default function LexicalPlayground() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Lexical Playground</h1>
      
      <div className="border rounded-lg">
        <LexicalComposer initialConfig={initialConfig}>
          <Toolbar />
          <div className="p-4 min-h-[200px] border-t">
            <RichTextPlugin
              contentEditable={
                <ContentEditable className="outline-none" />
              }
              placeholder={
                <div className="text-gray-400">Start typing...</div>
              }
            />
            <HistoryPlugin />
            <LogPlugin />
          </div>
        </LexicalComposer>
      </div>

      <div className="mt-4 p-4 bg-gray-100 rounded">
        <h2 className="font-bold mb-2">Check console for logs</h2>
        <p className="text-sm text-gray-600">
          Open browser console to see editor state changes, selections, and HTML output
        </p>
      </div>
    </div>
  );
}

