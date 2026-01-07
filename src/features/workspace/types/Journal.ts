export type JournalType = "normal" | "textThread";

export type JournalEntry = {
  id: string;
  title?: string | null;
  nodeId?: string | null;
  content?: string | null; // Deprecated: kept for migration compatibility, use contentJson
  contentJson?: any | null; // Canonical Lexical editorState (JSON/SerializedEditorState)
  contentText?: string | null; // Plain text for search/preview
  contentHtml?: string | null; // Optional HTML cache (not generated on every keystroke)
  contentVersion?: number; // Version for future migrations
  journalType?: JournalType | null; // Type of journal: "normal" (Lexical) or "textThread" (array of messages)
  speakers?: string[]; // Array of part IDs or "self"
  createdAt: string;
  updatedAt: string;
};
