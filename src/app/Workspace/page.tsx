import React from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { FlowNodesProvider } from "@/features/workspace/state/FlowNodesContext";
import { WorkshopNode } from "@/types/Nodes";
import { Edge } from "@xyflow/react";
import { Map as PrismaMap } from "@prisma/client";

import SideBar from "@/features/workspace/components/SideBar/SideBar";
import WorkSpace from "@/features/workspace/components/WorkSpace";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { Map } from "@/types/api/map";
import { ImpressionType } from "@/types/Impressions";
import { SidebarImpression } from "@/types/Sidebar";
// import { hydrateMap } from "@/lib/mapTransformers";
export type HydratedMap = Omit<
  PrismaMap,
  "nodes" | "edges" | "sidebarImpressions" | "userId"
> &
  Map;

const WorkspacePage = async () => {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/");

  let map = await prisma.map.findFirst({ where: { userId: session.user.id } });
  let clientMap: Map | undefined = undefined;

  if (!map) {
    // map = await prisma.map.create({
    map = await prisma.map.create({
      data: {
        userId: session.user.id,
        title: "Untitled Map",
        nodes: [],
        edges: [],
        sidebarImpressions: {},
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
          <WorkSpace map={clientMap} />
        </div>
      </FlowNodesProvider>
    </ReactFlowProvider>
  );
};

export default WorkspacePage;
