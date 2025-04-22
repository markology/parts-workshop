import { useQuery } from "@tanstack/react-query";

export const useAllJournalEntries = () => {
  return useQuery({
    queryKey: ["journal", "all"],
    queryFn: async () => {
      const res = await fetch("/api/journal/all");
      if (!res.ok) throw new Error("Failed to fetch all journal entries");
      return res.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
