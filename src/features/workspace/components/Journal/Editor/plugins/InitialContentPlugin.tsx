/**
 * InitialContentPlugin.tsx
 *
 * Simple plugin that loads initial content from contentJson prop once on mount.
 * Since the JournalEditor component remounts when switching entries (via key prop),
 * we don't need to handle external updates or circular updates.
 */

"use client";

import { useEffect, useRef } from "react";
import type { MutableRefObject } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

interface InitialContentPluginProps {
  contentJson: string | null;
  isInitialLoadRef: MutableRefObject<boolean>;
}

export default function InitialContentPlugin({
  contentJson,
  isInitialLoadRef,
}: InitialContentPluginProps) {
  const [editor] = useLexicalComposerContext();
  const initialContentJsonRef = useRef(contentJson);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    // Only load once on mount using the initial contentJson value
    // Don't re-run if contentJson changes (that would reset cursor position)
    if (hasLoadedRef.current || !initialContentJsonRef.current) {
      // If no content to load, mark initial load as complete
      if (!initialContentJsonRef.current) {
        // Wait a bit for editor to be ready, then mark as loaded
        setTimeout(() => {
          isInitialLoadRef.current = false;
        }, 100);
      }
      return;
    }

    try {
      const parsedState = JSON.parse(initialContentJsonRef.current);
      editor.setEditable(false);
      editor.setEditorState(editor.parseEditorState(parsedState));
      editor.setEditable(true);
      hasLoadedRef.current = true;

      // Mark initial load as complete after a short delay to allow editor to settle
      setTimeout(() => {
        isInitialLoadRef.current = false;
      }, 300);
    } catch (error) {
      console.error("Failed to parse initial contentJson:", error);
      // Even on error, mark as loaded so onChange can work
      setTimeout(() => {
        isInitialLoadRef.current = false;
      }, 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - only run once on mount

  return null;
}
