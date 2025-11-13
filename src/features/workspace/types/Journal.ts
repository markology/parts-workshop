export type JournalEntry = {
  id: string;
  title?: string | null;
  nodeId?: string | null;
  content: string;
  createdAt: string;
  updatedAt: string;
};
