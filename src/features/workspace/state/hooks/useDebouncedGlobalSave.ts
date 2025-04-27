import { useEffect, useRef } from "react";
import { useWorkingStore } from "../stores/useWorkingStore";
import { useSaveMap } from "./useSaveMap"; // your existing mutation

export const useDebouncedSaveMap = (delay = 10000) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { mutate: saveMap, isPending } = useSaveMap();
  const { nodes, edges, sidebarImpressions, journalEntries } =
    useWorkingStore();

  // Trigger debounced save on data change
  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      if (!isPending) {
        saveMap(); // ✅ uses latest Zustand state
      }
    }, delay);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [
    nodes,
    edges,
    sidebarImpressions,
    journalEntries,
    delay,
    saveMap,
    isPending,
  ]);

  // Save on tab close
  useEffect(() => {
    const handleUnload = () => {
      if (!isPending) {
        saveMap();
      }
    };

    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, [saveMap, isPending]);
};
