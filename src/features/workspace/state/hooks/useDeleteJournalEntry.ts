import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useDeleteJournalEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (nodeId: string) => {
      const res = await fetch(`/api/journal/${nodeId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete journal entry");
    },
    onSuccess: (_, nodeId) => {
      queryClient.invalidateQueries({ queryKey: ["journal", nodeId] });
    },
  });
};
