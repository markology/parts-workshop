import { useEffect } from "react";
import debounce from "lodash.debounce";
import { useMutation } from "@tanstack/react-query";
import { useWorkingStore } from "../useWorkingStore";

export const useSyncMap = () => {
  const { mapId, nodes, edges, sidebarImpressions, journalEntries } =
    useWorkingStore();

  const mutation = useMutation({
    mutationFn: async () => {
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
      if (!res.ok) throw new Error("Failed to sync map");
      return res.json();
    },
  });

  useEffect(() => {
    const sync = debounce(() => mutation.mutate(), 5000);
    sync();
    return () => sync.cancel();
  }, [nodes, edges, sidebarImpressions, journalEntries]);

  return { isSyncing: mutation.isPending };
};
