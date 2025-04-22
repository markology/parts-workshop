// app/workspace/page.tsx (or pages/workspace/index.tsx if using Pages Router)

import { ReactFlowProvider } from "@xyflow/react";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/authOptions";
import {
  HydrationBoundary,
  QueryClient,
  dehydrate,
} from "@tanstack/react-query";
import CanvasClient from "@/features/workspace/components/CanvasClient";
import TourOverlay from "@/features/workspace/components/TourOverlay";
import { WorkshopNode } from "@/types/Nodes";
import { Edge } from "@xyflow/react";
import { Map } from "@/types/api/map";
import { Map as PrismaMap } from "@prisma/client";
import { ImpressionType } from "@/types/Impressions";
import { SidebarImpression } from "@/types/Sidebar";
import { createEmptyImpressionGroups } from "../state/useWorkingStore";

export type HydratedMap = Omit<
  PrismaMap,
  "nodes" | "edges" | "sidebarImpressions" | "userId"
> &
  Map;

async function DesktopWorkspace() {
  const session = await getServerSession(authOptions);
  console.log("SESSION:", session);

  if (!session?.user?.id) {
    throw new Error("User not logged in");
  }

  const userId = session.user.id;
  let map = await prisma.map.findFirst({ where: { userId } });
  console.log("MAP FOUND:", map?.id);

  const showTour = !map;

  if (!map) {
    console.log("❌ No map found — creating a new one");
    map = await prisma.map.create({
      data: {
        userId,
        title: "Untitled Map",
        nodes: [],
        edges: [],
        sidebarImpressions: createEmptyImpressionGroups(),
      },
    });
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

  await queryClient.prefetchQuery({
    queryKey: ["map", map.id],
    queryFn: () => Promise.resolve(clientMap),
    staleTime: Infinity,
  });

  console.log(clientMap);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ReactFlowProvider>
        {showTour && <TourOverlay />}
        <div
          className="PW"
          style={{
            height: "100vh",
            width: "100vw",
            overflow: "hidden",
            display: "flex",
          }}
        >
          <CanvasClient mapId={clientMap.id} />
        </div>
      </ReactFlowProvider>
    </HydrationBoundary>
  );
}

export default DesktopWorkspace;
