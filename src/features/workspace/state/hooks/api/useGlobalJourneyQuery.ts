import { useQuery } from "@tanstack/react-query";

export const useGlobalJournalQuery = () =>
  useQuery({
    queryKey: ["journal", "global"],
    queryFn: async () => {
      const res = await fetch("/api/journal/global");
      return res.json(); // returns { id, content }
    },
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
