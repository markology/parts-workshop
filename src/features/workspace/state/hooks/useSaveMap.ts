import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useWorkingStore } from "../stores/useWorkingStore";
import { useThemeContext } from "@/state/context/ThemeContext";

export const useSaveMap = () => {
  const queryClient = useQueryClient();
  const { themeName } = useThemeContext();

  return useMutation({
    mutationFn: async () => {
      const { mapId, nodes, edges, sidebarImpressions, workspaceBgColor } =
        useWorkingStore.getState(); // ✅ pull latest state snapshot
      
      const res = await fetch(`/api/maps/${mapId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nodes,
          edges,
          sidebarImpressions,
          workspaceBgColor,
          themeName,
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
