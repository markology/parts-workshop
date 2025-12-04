export type JournalEntry = {
  id: string;
  title?: string | null;
  nodeId?: string | null;
  content: string;
  speakers?: string[]; // Array of part IDs or "self"
  createdAt: string;
  updatedAt: string;
};
