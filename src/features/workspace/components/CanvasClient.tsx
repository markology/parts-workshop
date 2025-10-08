"use client";

import { useEffect, useState } from "react";
import { useLoadMap } from "../state/hooks/useLoadMap";
import Canvas from "./Canvas";
import { useWorkingStore } from "../state/stores/useWorkingStore";
import { FlowNodesProvider } from "../state/FlowNodesContext";
import SideBar from "./SideBar/SideBar";
import { useAutoSave } from "../state/hooks/useAutoSave";
import { useIsMobile } from "@/hooks/useIsMobile";
import OnboardingModal from "@/components/OboardingModal";
import { createEmptyImpressionGroups } from "../state/stores/useWorkingStore";
// import TourOverlay from "./TourOverlay";

// Function to normalize sidebarImpressions data structure
const normalizeSidebarImpressions = (sidebarImpressions: any) => {
  if (!sidebarImpressions || typeof sidebarImpressions !== 'object') {
    console.log("🔄 Normalizing sidebarImpressions: creating empty structure");
    return createEmptyImpressionGroups();
  }

  // Check if it's already in the correct format
  const expectedKeys = ['emotion', 'thought', 'sensation', 'behavior', 'other'];
  const hasExpectedKeys = expectedKeys.every(key => key in sidebarImpressions);
  
  if (hasExpectedKeys) {
    console.log("✅ sidebarImpressions already in correct format");
    return sidebarImpressions;
  }

  // If it's an array or different structure, create empty structure
  console.log("🔄 sidebarImpressions has unexpected structure, creating empty structure");
  return createEmptyImpressionGroups();
};

export default function CanvasClient({
  mapId,
  showOnboarding,
}: {
  mapId: string;
  showOnboarding: boolean;
}) {
  console.log("🔄 CanvasClient mapId:", mapId);
  const { data, isLoading, error } = useLoadMap(mapId);
  const [hydrated, setHydrated] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    console.log("🔄 CanvasClient mapId changed to:", mapId);
    
    if (data && typeof data === 'object' && 'id' in data) {
      console.log("💾 Hydrating Zustand from fetched map", {
        mapId: data.id,
        title: data.title,
        nodesCount: data.nodes?.length || 0,
        edgesCount: data.edges?.length || 0,
        sidebarImpressionsType: typeof data.sidebarImpressions,
        sidebarImpressionsKeys: data.sidebarImpressions ? Object.keys(data.sidebarImpressions) : 'null/undefined',
        journalEntriesCount: data.journalEntries?.length || 0,
        fullData: data
      });

      const normalizedSidebarImpressions = normalizeSidebarImpressions(data.sidebarImpressions);

      // Clear the store completely before setting new data to prevent cross-map contamination
      console.log("🧹 Clearing store before loading new map data");
      useWorkingStore.getState().setState({
        mapId: "",
        nodes: [],
        edges: [],
        sidebarImpressions: createEmptyImpressionGroups(),
        journalEntries: [],
        hydrated: false,
      });

      // Then set the new map data
      console.log("📝 Setting new map data for mapId:", data.id);
      useWorkingStore.getState().setState({
        mapId: data.id,
        nodes: data.nodes || [],
        edges: data.edges || [],
        sidebarImpressions: normalizedSidebarImpressions,
        journalEntries: data.journalEntries ?? [],
        hydrated: true,
      });

      setHydrated(true); // ✅ only now render FlowNodesProvider
    }
  }, [data, mapId]); // Added mapId dependency to ensure re-hydration on map change

  // Cleanup effect to clear store when component unmounts or mapId changes
  useEffect(() => {
    return () => {
      // Clear the store when leaving this map to prevent data leakage
      console.log("🧹 Cleaning up store for mapId:", mapId);
      useWorkingStore.getState().setState({
        mapId: "",
        nodes: [],
        edges: [],
        sidebarImpressions: createEmptyImpressionGroups(),
        journalEntries: [],
        hydrated: false,
      });
    };
  }, [mapId]);

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

  console.log("🔍 Loading state check:", {
    isLoading,
    hasData: !!data,
    hydrated,
    mapId,
    error
  });

  if (isLoading || !data || !hydrated) {
    console.log("⏳ Still loading because:", {
      isLoading,
      hasData: !!data,
      hydrated
    });
    return <p>Loading workspace...</p>;
  }
  if (error) {
    console.log("❌ Error loading map:", error);
    return <p>Failed to load map.</p>;
  }
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
