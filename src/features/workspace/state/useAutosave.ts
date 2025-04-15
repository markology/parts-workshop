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
    const saveOnExit = () => {
      navigator.sendBeacon(
        `/api/maps/${mapId}`,
        new Blob([JSON.stringify(latest.current)], { type: "application/json" })
      );
    };

    window.addEventListener("beforeunload", saveOnExit);
    return () => window.removeEventListener("beforeunload", saveOnExit);
  }, [mapId]);
};

export default useAutosave;
