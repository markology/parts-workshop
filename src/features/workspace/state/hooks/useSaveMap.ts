import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useWorkingStore } from "../stores/useWorkingStore";

export const useSaveMap = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { mapId, nodes, edges, sidebarImpressions } =
        useWorkingStore.getState(); // ✅ pull latest state snapshot\
      // console.log({ mapId, nodes, edges, sidebarImpressions });
      // console.log(JSON.stringify({ mapId, nodes, edges, sidebarImpressions }));
      // console.log(
      //   "🧠 Map payload size (MB):",
      //   (
      //     new Blob([
      //       JSON.stringify({ mapId, nodes, edges, sidebarImpressions }),
      //     ]).size /
      //     1024 /
      //     1024
      //   ).toFixed(2)
      // );
      // console.log(
      //   "🔍 Nodes size (MB):",
      //   new Blob([JSON.stringify(nodes)]).size / 1024 / 1024
      // );
      // console.log(
      //   "🔍 Nodes lenght and description",
      //   nodes.length,
      //   JSON.stringify(nodes[2])
      // );
      // console.log(
      //   "🧩 Edges size (MB):",
      //   new Blob([JSON.stringify(edges)]).size / 1024 / 1024
      // );
      // console.log(
      //   "📎 Sidebar size (MB):",
      //   new Blob([JSON.stringify(sidebarImpressions)]).size / 1024 / 1024
      // );
      // console.log(
      //   "📎 Journal Entries size (MB):",
      //   new Blob([JSON.stringify(journalEntries)]).size / 1024 / 1024
      // );
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
