// app/workspace/page.tsx (or pages/workspace/index.tsx if using Pages Router)

import { ReactFlowProvider } from "@xyflow/react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/authOptions";
import {
  HydrationBoundary,
  QueryClient,
  dehydrate,
} from "@tanstack/react-query";
import { FlowNodesProvider } from "@/features/workspace/state/FlowNodesContext";
import Canvas from "@/features/workspace/components/Canvas";
import SideBar from "@/features/workspace/components/SideBar/SideBar";
import TourOverlay from "@/features/workspace/components/TourOverlay";
import { createEmptyImpressionGroups } from "@/state/Sidebar";
import { WorkshopNode } from "@/types/Nodes";
import { Edge } from "@xyflow/react";
import { Map } from "@/types/api/map";
import { Map as PrismaMap } from "@prisma/client";
import { ImpressionType } from "@/types/Impressions";
import { SidebarImpression } from "@/types/Sidebar";

export type HydratedMap = Omit<
  PrismaMap,
  "nodes" | "edges" | "sidebarImpressions" | "userId"
> &
  Map;

async function DesktopWorkspace() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/");

  const userId = session.user.id;
  let map = await prisma.map.findFirst({ where: { userId } });

  const showTour = !map;

  if (!map) {
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

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ReactFlowProvider>
        {showTour && <TourOverlay />}
        <FlowNodesProvider map={clientMap}>
          <div
            className="PW"
            style={{
              height: "100vh",
              width: "100vw",
              overflow: "hidden",
              display: "flex",
            }}
          >
            <SideBar />
            <Canvas map={clientMap} />
          </div>
        </FlowNodesProvider>
      </ReactFlowProvider>
    </HydrationBoundary>
  );
}

export default DesktopWorkspace;
