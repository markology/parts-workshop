import { ImpressionType } from "@/types/Impressions";
import { WorkshopNode } from "@/types/Nodes";
import { SidebarImpression } from "@/types/Sidebar";
import { Edge } from "@xyflow/react";
import { useEffect, useRef } from "react";

type SaveMapArgs = {
  mapId?: string;
  nodes: WorkshopNode[];
  edges: Edge[];
  sidebarImpressions: Record<ImpressionType, Record<string, SidebarImpression>>;
};

const useAutosave = ({
  mapId,
  nodes,
  edges,
  sidebarImpressions,
}: SaveMapArgs) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const latest = useRef({ nodes, edges, sidebarImpressions });

  useEffect(() => {
    latest.current = { nodes, edges, sidebarImpressions };
  }, [nodes, edges, sidebarImpressions]);

  // start polling PUT for maps
  useEffect(() => {
    if (!mapId) return;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      console.log("FETCHING THIS", mapId);
      fetch(`api/maps/${mapId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nodes: latest.current.nodes,
          edges: latest.current.edges,
          sidebarImpressions: latest.current.sidebarImpressions,
        }),
      });
    }, 10000);

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
};

export default useAutosave;
