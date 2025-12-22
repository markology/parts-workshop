import { JournalEntry } from "@/features/workspace/types/Journal";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useDeleteJournalEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      entryId,
      nodeId,
    }: {
      entryId?: string;
      nodeId?: string | null;
    }) => {
      const baseUrl = nodeId
        ? `/api/journal/node/${nodeId}`
        : "/api/journal/global";
      const url =
        entryId && entryId.length > 0
          ? `${baseUrl}?entryId=${encodeURIComponent(entryId)}`
          : baseUrl;

      const res = await fetch(url, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete journal entry");
      }
    },
    onSuccess: (_, variables) => {
      queryClient.setQueryData(
        ["journal", "all"],
        (prev: JournalEntry[] = []) => {
          if (variables?.entryId) {
            return prev.filter((entry) => entry.id !== variables.entryId);
          }

          if (variables?.nodeId) {
            return prev.filter((entry) => entry.nodeId !== variables.nodeId);
          }

          return prev;
        }
      );

      if (variables?.nodeId) {
        queryClient.removeQueries({
          queryKey: ["journal", variables.nodeId],
        });
      }
    },
  });
};
