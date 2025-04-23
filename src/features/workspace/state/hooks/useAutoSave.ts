"use client";

import { useEffect, useRef, useState } from "react";
import { useSaveMap } from "./useSaveMap";
import { useWorkingStore } from "../useWorkingStore";

export const useAutoSave = () => {
  const saveMap = useSaveMap();
  const lastSavedState = useRef<string | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [saveCheck, setSaveCheck] = useState(false);

  const getCurrentSnapshot = () => {
    const { nodes, edges, sidebarImpressions, journalEntries } =
      useWorkingStore.getState();
    return JSON.stringify({ nodes, edges, sidebarImpressions, journalEntries });
  };

  const isDirty = () => {
    const current = getCurrentSnapshot();
    return current !== lastSavedState.current;
  };

  const saveIfDirty = () => {
    if (!isDirty()) return;

    setIsSaving(true);
    saveMap.mutate(undefined, {
      onSuccess: () => {
        lastSavedState.current = getCurrentSnapshot();
        setIsSaving(false);
        setSaveCheck(true);
        setTimeout(() => setSaveCheck(false), 1000);
      },
      onError: () => {
        setIsSaving(false);
      },
    });
  };

  // Autosave every 60 seconds
  useEffect(() => {
    const interval = setInterval(saveIfDirty, 30000);
    return () => clearInterval(interval);
  }, []);

  // Save on tab close
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isDirty()) {
        const { mapId, nodes, edges, sidebarImpressions } =
          useWorkingStore.getState();
        const payload = JSON.stringify({
          mapId,
          nodes,
          edges,
          sidebarImpressions,
        });
        const blob = new Blob([payload], { type: "application/json" });

        navigator.sendBeacon("/api/maps/save", blob);
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  return {
    saveNow: saveIfDirty,
    isSaving,
    saveCheck,
  };
};
