import TourOverlay from "@/components/TourOverlay";
import Canvas from "@/features/workspace/components/Canvas";
import SideBar from "@/features/workspace/components/SideBar/SideBar";
import { FlowNodesProvider } from "@/features/workspace/state/FlowNodesContext";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { createEmptyImpressionGroups } from "@/state/Sidebar";
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

// import { hydrateMap } from "@/lib/mapTransformers";
export type HydratedMap = Omit<
  PrismaMap,
  "nodes" | "edges" | "sidebarImpressions" | "userId"
> &
  Map;

const DesktopWorkspace = async () => {
  const session = await getServerSession(authOptions);
  console.log("SESSIONworkspace", session);
  if (!session?.user) redirect("/");

  let map = await prisma.map.findFirst({ where: { userId: session.user.id } });
  let clientMap: Map | undefined = undefined;

  const showTour = !map;

  if (!map) {
    // map = await prisma.map.create({
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
  return (
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
  );
};

export default DesktopWorkspace;
