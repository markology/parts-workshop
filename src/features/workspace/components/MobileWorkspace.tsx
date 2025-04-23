import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { Map } from "@/types/api/map";
import { ImpressionType } from "@/types/Impressions";
import { WorkshopNode } from "@/types/Nodes";
import { SidebarImpression } from "@/types/Sidebar";
import { Map as PrismaMap } from "@prisma/client";
import { ReactFlowProvider } from "@xyflow/react";
import { Edge } from "@xyflow/react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import React from "react";
import { createEmptyImpressionGroups } from "../state/useWorkingStore";
import CanvasClient from "./CanvasClient";
import { QueryClient } from "@tanstack/react-query";

export type HydratedMap = Omit<
  PrismaMap,
  "nodes" | "edges" | "sidebarImpressions" | "userId"
> &
  Map;

const MobileWorkspace = async () => {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/");

  let map = await prisma.map.findFirst({
    where: { userId: session.user.id },
    orderBy: { createdAt: "asc" },
  });
  let clientMap: Map | undefined = undefined;

  if (!map) {
    map = await prisma.map.create({
      data: {
        userId: session.user.id,
        title: "Untitled Map",
        nodes: [],
        edges: [],
        sidebarImpressions: createEmptyImpressionGroups(),
      },
    });
  }

  clientMap = {
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
    <ReactFlowProvider>
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
  );
};

export default MobileWorkspace;
