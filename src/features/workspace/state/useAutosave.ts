import { useUIStore } from "@/state/UI";
import { ImpressionType } from "@/types/Impressions";
import { WorkshopNode } from "@/types/Nodes";
import { SidebarImpression } from "@/types/Sidebar";
import { Edge } from "@xyflow/react";
import { useEffect, useRef } from "react";

export type SaveMapArgs = {
  mapId?: string;
  nodes: WorkshopNode[];
  edges: Edge[];
  sidebarImpressions: Record<ImpressionType, Record<string, SidebarImpression>>;
};

export const saveMap = ({
  mapId,
  nodes,
  edges,
  sidebarImpressions,
}: SaveMapArgs): void => {
  fetch(`api/maps/${mapId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      nodes,
      edges,
      sidebarImpressions,
    }),
  });
};

const useAutosave = ({
  mapId,
  nodes,
  edges,
  sidebarImpressions,
}: SaveMapArgs) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const latest = useRef({ nodes, edges, sidebarImpressions });
  const setIsSavingMap = useUIStore((s) => s.setIsSavingMap);

  useEffect(() => {
    latest.current = { nodes, edges, sidebarImpressions };
  }, [nodes, edges, sidebarImpressions]);

  // start polling PUT for maps
  useEffect(() => {
    if (!mapId) return;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      setIsSavingMap(true);
      saveMap({
        mapId,
        nodes: latest.current.nodes,
        edges: latest.current.edges,
        sidebarImpressions: latest.current.sidebarImpressions,
      });
    }, 300000);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [mapId, nodes, edges, sidebarImpressions]);

  // Save on tab close
  useEffect(() => {
    const saveOnUnload = () => {
      if (!mapId || !latest.current) return;

      navigator.sendBeacon(
        `/api/maps/${mapId}`,
        new Blob([JSON.stringify(latest.current)], {
          type: "application/json",
        })
      );
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        saveOnUnload();
      }
    };

    window.addEventListener("beforeunload", saveOnUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("beforeunload", saveOnUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [mapId]);

  return {
    saveMap: () => saveMap({ mapId, nodes, edges, sidebarImpressions }),
  };
};

export default useAutosave;
