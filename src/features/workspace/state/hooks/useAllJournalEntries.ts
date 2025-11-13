import { useQuery } from "@tanstack/react-query";
import { JournalEntry } from "@/features/workspace/types/Journal";

export const useAllJournalEntries = () => {
  return useQuery({
    queryKey: ["journal", "all"],
    queryFn: async () => {
      const res = await fetch("/api/journal/all");
      if (!res.ok) throw new Error("Failed to fetch all journal entries");
      const entries: JournalEntry[] = await res.json();
      return entries.sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
