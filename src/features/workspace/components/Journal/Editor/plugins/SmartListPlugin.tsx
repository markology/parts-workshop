// features/editor/plugins/ListPluginSmart.tsx
import { useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { COMMAND_PRIORITY_EDITOR } from "lexical";
import {
  SMART_TOGGLE_BULLET_LIST,
  smartToggleBulletList,
} from "../commands/smartList/index";

/**
 * Registers Notion-style bullet toggle:
 * - If selection is in a bullet list: unlists ONLY the selected items (splits list)
 * - Otherwise: inserts a bullet list
 */
export default function ListPluginSmart() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      SMART_TOGGLE_BULLET_LIST,
      () => {
        smartToggleBulletList(editor);
        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );
  }, [editor]);

  return null;
}
