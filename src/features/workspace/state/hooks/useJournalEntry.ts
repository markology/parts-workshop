import { useQuery } from "@tanstack/react-query";

export const useJournalEntry = (nodeId?: string) => {
  return useQuery({
    queryKey: ["journal", nodeId ?? "global"],
    queryFn: async () => {
      const url = nodeId ? `/api/journal/${nodeId}` : "/api/journal/global";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to load journal entry");
      return res.json(); // assumes { id, content, ... }
    },
  });
};
