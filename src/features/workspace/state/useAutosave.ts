import { useEffect, useRef } from "react";

import { useSaveMapMutation } from "./hooks/api/useSaveMapMutation";
import { SaveMapArgs } from "@/types/api/map";

export function useAutosave({
  mapId,
  nodes,
  edges,
  sidebarImpressions,
}: SaveMapArgs) {
  const saveMap = useSaveMapMutation();
  const latest = useRef<SaveMapArgs>({
    mapId,
    nodes,
    edges,
    sidebarImpressions,
  });

  useEffect(() => {
    latest.current = { mapId, nodes, edges, sidebarImpressions };
  }, [mapId, nodes, edges, sidebarImpressions]);

  // useEffect(() => {
  //   const timeout = setTimeout(() => {
  //     if ("mapId" in latest.current && latest.current.mapId !== undefined) {
  //       saveMap.mutate(latest.current);
  //     }
  //   }, 5000);

  //   return () => clearTimeout(timeout);
  // }, [mapId, nodes, edges, sidebarImpressions, saveMap]);

  // useEffect(() => {
  //   const onClose = () => {
  //     if (!latest.current.mapId) return;
  //     navigator.sendBeacon(
  //       `/api/maps/${latest.current.mapId}`,
  //       new Blob([JSON.stringify(latest.current)], {
  //         type: "application/json",
  //       })
  //     );
  //   };

  //   window.addEventListener("beforeunload", onClose);
  //   return () => window.removeEventListener("beforeunload", onClose);
  // }, []);

  return () => saveMap.mutate(latest.current);
}
