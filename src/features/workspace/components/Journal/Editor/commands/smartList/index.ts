/**
 * Smart List Toggle Command
 *
 * This module implements "smart" bullet list behavior similar to Notion:
 * - If selection is in a list: partially unlist selected items (Notion-style)
 * - If selection is not in a list: convert selected blocks to a bullet list
 *
 * The implementation is split into several modules:
 * - utils.ts: Node traversal utilities
 * - selection.ts: Selection extraction and filtering
 * - listOperations.ts: List conversion and manipulation operations
 * - smartList.ts: Main orchestration logic
 */

import { createCommand } from "lexical";
import { smartToggleBulletList } from "./smartList";

/**
 * Public command that can be dispatched from the toolbar to toggle bullet lists.
 */
export const SMART_TOGGLE_BULLET_LIST = createCommand<void>();

/**
 * Public entry point for smart bullet list toggling.
 *
 * @param editor - The Lexical editor instance
 */
export { smartToggleBulletList };
