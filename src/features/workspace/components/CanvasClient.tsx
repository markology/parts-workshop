"use client";

import { useEffect, useState } from "react";
import { useLoadMap } from "../state/hooks/useLoadMap";
import Canvas from "./Canvas";
import { useWorkingStore } from "../state/useWorkingStore";
import { FlowNodesProvider } from "../state/FlowNodesContext";
import SideBar from "./SideBar/SideBar";
import { useAutoSave } from "../state/hooks/useAutoSave";
import { useIsMobile } from "@/hooks/useIsMobile";
import OnboardingModal from "@/components/OboardingModal";
// import TourOverlay from "./TourOverlay";

export default function CanvasClient({
  mapId,
  showOnboarding,
}: {
  mapId: string;
  showOnboarding: boolean;
}) {
  const { data, isLoading, error } = useLoadMap(mapId);
  const [hydrated, setHydrated] = useState(false);
  const isMobile = useIsMobile();
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

  if (typeof window !== "undefined") {
    window.onerror = function (msg, url, lineNo, columnNo, error) {
      document.body.innerHTML = `
        <pre style="white-space: pre-wrap; font-size: 14px;">
          ⚠️ JS Error:
          ${msg}
          At: ${url}:${lineNo}:${columnNo}
          ${error?.stack || ""}
        </pre>
      `;
      return false;
    };
  }

  useAutoSave();

  if (isLoading || !data || !hydrated) return <p>Loading workspace...</p>;
  if (error) return <p>Failed to load map.</p>;
  // const showTour = !map;

  return (
    <FlowNodesProvider>
      {showOnboarding && <OnboardingModal />}
      {/* <TourOverlay /> */}
      {!isMobile && <SideBar />}
      <Canvas />
    </FlowNodesProvider>
  ); // now fully local + Zustand-based
}
