import { JournalEntry } from "@/features/workspace/types/Journal";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useDeleteJournalEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (nodeId: string) => {
      const res = await fetch(`/api/journal/node/${nodeId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete journal entry");
      }
    },
    onSuccess: (_, nodeId) => {
      queryClient.setQueryData(
        ["journal", "all"],
        (prev: JournalEntry[] = []) =>
          prev.filter((entry) => entry.nodeId !== nodeId)
      );
      queryClient.removeQueries({ queryKey: ["journal", nodeId] });
    },
  });
};
