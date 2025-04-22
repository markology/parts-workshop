import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useWorkingStore } from "../useWorkingStore";

export const useSaveMap = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { mapId, nodes, edges, sidebarImpressions, journalEntries } =
        useWorkingStore.getState(); // ✅ pull latest state snapshot
      const res = await fetch(`/api/maps/${mapId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nodes,
          edges,
          sidebarImpressions,
          journalEntries,
        }),
      });

      if (!res.ok) throw new Error("Failed to save map");

      return res.json();
    },

    onSuccess: (data) => {
      queryClient.setQueryData(["map", data.id], data);
    },
  });
};
