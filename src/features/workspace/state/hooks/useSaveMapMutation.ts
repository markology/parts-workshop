import { SaveMapArgs } from "@/types/api/map";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useSaveMapMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      mapId,
      nodes,
      edges,
      sidebarImpressions,
    }: SaveMapArgs) => {
      const res = await fetch(`/api/maps/${mapId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nodes, edges, sidebarImpressions }),
      });

      if (!res.ok) throw new Error("Failed to save map");

      return res.json(); // optional: return updated map
    },

    // Optional: update cache after save
    onSuccess: (data, { mapId }) => {
      queryClient.setQueryData(["map", mapId], data);
    },
  });
};
