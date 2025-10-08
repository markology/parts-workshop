import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useWorkingStore } from "../stores/useWorkingStore";

export const useSaveMap = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { mapId, nodes, edges, sidebarImpressions } =
        useWorkingStore.getState(); // ✅ pull latest state snapshot
      
      console.log("💾 Saving map data:", {
        mapId,
        nodesCount: nodes?.length || 0,
        edgesCount: edges?.length || 0,
        nodes: nodes,
        edges: edges
      });
      
      const res = await fetch(`/api/maps/${mapId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nodes,
          edges,
          sidebarImpressions,
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
