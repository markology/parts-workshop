"use client";

import { useEffect, useState } from "react";
import { useLoadMap } from "../state/hooks/useLoadMap";
import Canvas from "./Canvas";
import { useWorkingStore } from "../state/useWorkingStore";
import { FlowNodesProvider } from "../state/FlowNodesContext";
import SideBar from "./SideBar/SideBar";
import { useAutoSave } from "../state/hooks/useAutoSave";

export default function CanvasClient({ mapId }: { mapId: string }) {
  const { data, isLoading, error } = useLoadMap(mapId);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (data) {
      console.log("💾 Hydrating Zustand from fetched map");
      useWorkingStore.getState().setState({
        mapId: data.id,
        nodes: data.nodes,
        edges: data.edges,
        sidebarImpressions: data.sidebarImpressions,
        journalEntries: data.journalEntries ?? [],
      });
      setHydrated(true); // ✅ only now render FlowNodesProvider
    }
  }, [data]);

  useAutoSave();

  if (isLoading || !data || !hydrated) return <p>Loading workspace...</p>;
  if (error) return <p>Failed to load map.</p>;

  return (
    <FlowNodesProvider>
      <SideBar />
      <Canvas />
    </FlowNodesProvider>
  ); // now fully local + Zustand-based
}
