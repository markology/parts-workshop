"use client";

// app/workspace/page.tsx (or pages/workspace/index.tsx if using Pages Router)

import { ReactFlowProvider } from "@xyflow/react";
import { useSession } from "next-auth/react";
import {
  HydrationBoundary,
  QueryClient,
  dehydrate,
} from "@tanstack/react-query";
import CanvasClient from "@/features/workspace/components/CanvasClient";
import { WorkshopNode } from "@/features/workspace/types/Nodes";
import { Edge } from "@xyflow/react";
import { Map } from "@/features/workspace/types/api/map";
import { Map as PrismaMap } from "@prisma/client";
import { ImpressionType } from "@/features/workspace/types/Impressions";
import { SidebarImpression } from "@/features/workspace/types/Sidebar";
import { createEmptyImpressionGroups } from "../state/stores/useWorkingStore";
import { useEffect, useState } from "react";

export type HydratedMap = Omit<
  PrismaMap,
  "nodes" | "edges" | "sidebarImpressions" | "userId"
> &
  Map;

export default function DesktopWorkspace() {
  const { data: session } = useSession();
  const [map, setMap] = useState<Map | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user?.id) {
      setError("Please log in to access your workspace");
      setLoading(false);
      return;
    }

    const fetchOrCreateMap = async () => {
      try {
        const response = await fetch("/api/maps");
        if (!response.ok) {
          throw new Error("Failed to fetch maps");
        }
        const maps = await response.json();

        if (maps.length === 0) {
          // Create a new map if none exists
          const createResponse = await fetch("/api/maps", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              title: "Untitled Map",
              nodes: [],
              edges: [],
              sidebarImpressions: createEmptyImpressionGroups(),
            }),
          });

          if (!createResponse.ok) {
            throw new Error("Failed to create map");
          }

          const newMap = await createResponse.json();
          setMap(newMap);
        } else {
          setMap(maps[0]);
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load your workspace");
      } finally {
        setLoading(false);
      }
    };

    fetchOrCreateMap();
  }, [session]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div className="p-4 text-center">{error}</div>;
  }

  if (!map) {
    return <div className="p-4 text-center">No map found</div>;
  }

  const clientMap: Map = {
    id: map.id,
    title: map.title || "Untitled Map",
    nodes: Array.isArray(map.nodes)
      ? (map.nodes as unknown as WorkshopNode[])
      : [],
    edges: Array.isArray(map.edges) ? (map.edges as unknown as Edge[]) : [],
    sidebarImpressions:
      typeof map.sidebarImpressions === "object" &&
      map.sidebarImpressions !== null
        ? (map.sidebarImpressions as unknown as Record<
            ImpressionType,
            Record<string, SidebarImpression>
          >)
        : ({} as Record<ImpressionType, Record<string, SidebarImpression>>),
  };

  const queryClient = new QueryClient();
  queryClient.setQueryData(["map", map.id], clientMap);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ReactFlowProvider>
        <div className="PW flex flex-row flex-grow h-[100vh] w-[100vw] overflow-hidden">
          <CanvasClient mapId={clientMap.id} showOnboarding={!map} />
        </div>
      </ReactFlowProvider>
    </HydrationBoundary>
  );
}
