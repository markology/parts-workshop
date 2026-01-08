/**
 * DebouncedOnChangePlugin.tsx
 *
 * Debounced content change plugin that only fires onContentChange after user stops typing.
 * This prevents performance issues by avoiding frequent updates on every keystroke.
 */

"use client";

import { useEffect, useRef } from "react";
import type { MutableRefObject } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getRoot } from "lexical";

interface DebouncedOnChangePluginProps {
  onContentChange: (data: { json: string; text: string }) => void;
  readOnly: boolean;
  isInitialLoadRef: MutableRefObject<boolean>;
}

export default function DebouncedOnChangePlugin({
  onContentChange,
  readOnly,
  isInitialLoadRef,
}: DebouncedOnChangePluginProps) {
  const [editor] = useLexicalComposerContext();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastContentRef = useRef<string | null>(null);

  useEffect(() => {
    if (readOnly) return;

    return editor.registerUpdateListener(
      ({ editorState, prevEditorState, dirtyElements, dirtyLeaves }) => {
        // Don't fire onChange during initial load
        if (isInitialLoadRef.current) {
          return;
        }

        // Only process if there are actual content changes (not just selection)
        const hasContentChanges =
          dirtyElements.size > 0 || dirtyLeaves.size > 0;

        if (!hasContentChanges) {
          return; // Skip selection-only changes
        }

        // Clear existing timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        // Debounce: wait 300ms after last change before calling onContentChange
        timeoutRef.current = setTimeout(() => {
          // Double-check we're not in initial load
          if (isInitialLoadRef.current) {
            return;
          }

          editorState.read(() => {
            const root = $getRoot();
            const textContent = root.getTextContent();
            const jsonString = JSON.stringify(editorState.toJSON());

            // Only call if content actually changed
            if (jsonString !== lastContentRef.current) {
              lastContentRef.current = jsonString;
              onContentChange({ json: jsonString, text: textContent });
            }
          });
        }, 300);
      }
    );
  }, [editor, onContentChange, readOnly, isInitialLoadRef]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return null;
}
