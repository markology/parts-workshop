"use client";
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
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PageLoader from "@/components/PageLoader";

export type HydratedMap = Omit<
  PrismaMap,
  "nodes" | "edges" | "sidebarImpressions" | "userId"
> &
  Map;

export default function MobileWorkspace() {
  const { status, data: session } = useSession();
  const [map, setMap] = useState<Map | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!session?.user?.id) {
      setError("Please log in to access your workspace");
      setLoading(false);
      return;
    }

    const fetchMap = async () => {
      try {
        const response = await fetch("/api/maps");
        if (!response.ok) {
          throw new Error("Failed to fetch map");
        }
        const maps = await response.json();
        if (maps.length === 0) {
          setError(
            "Please create your first map on desktop before using mobile"
          );
          setLoading(false);
          return;
        }
        const firstMap = maps[0];
        setMap(firstMap);
      } catch (err) {
        console.error(err);
        setError("Failed to load your workspace");
      } finally {
        setLoading(false);
      }
    };

    fetchMap();
  }, [session]);

  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  if (loading || status === "loading") {
    return (
      <PageLoader
        title="Opening your mobile workspace"
        subtitle="We’re preparing your saved canvas and impressions."
        message="Loading workspace data..."
      />
    );
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
      <p className="p-4 text-center">
        You can only use your scratchpad and view map on mobile
      </p>
      <ReactFlowProvider>
        <div className="PW flex flex-row flex-grow h-[100vh] w-[100vw] overflow-hidden">
          <CanvasClient mapId={clientMap.id} showOnboarding={false} />
        </div>
      </ReactFlowProvider>
    </HydrationBoundary>
  );
}
