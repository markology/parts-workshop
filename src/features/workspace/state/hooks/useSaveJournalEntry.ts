import { JournalEntry } from "@/features/workspace/types/Journal";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useSaveJournalEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      nodeId,
      content,
    }: {
      nodeId?: string;
      content?: string;
    }) => {
      const url = nodeId
        ? `/api/journal/node/${nodeId}`
        : "/api/journal/global";
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error("Had trouble saving journal entry");

      return res.json();
    },
    onSuccess: (newEntry) => {
      queryClient.setQueryData(
        ["journal", "all"],
        (prev: JournalEntry[] = []) => {
          const rest = prev.filter((e) => e.nodeId !== newEntry.nodeId);
          return [...rest, newEntry];
        }
      );
    },
  });
};
