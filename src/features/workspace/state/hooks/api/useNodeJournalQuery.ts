import { useQuery } from "@tanstack/react-query";

export const useNodeJournalQuery = (nodeId: string) =>
  useQuery({
    queryKey: ["journal", "node", nodeId],
    enabled: !!nodeId,
    queryFn: async () => {
      const res = await fetch(`/api/journal/node/${nodeId}`);
      if (!res.ok) throw new Error("Failed to fetch node journal");
      return res.json();
    },
    refetchOnWindowFocus: false,
  });
