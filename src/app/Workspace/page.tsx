import "@xyflow/react/dist/style.css";

import React from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { FlowNodesProvider } from "@/features/workspace/state/FlowNodesContext";

import SideBar from "@/features/workspace/components/SideBar/SideBar";
import WorkSpace from "@/features/workspace/components/WorkSpace";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { authOptions } from "../api/auth/[...nextauth]/route";

const WorkspacePage = async () => {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/");

  const maps = await prisma.map.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <ReactFlowProvider>
      <FlowNodesProvider>
        <div className="h-screen w-screen overflow-hidden flex PW">
          <SideBar />
          <WorkSpace map={maps?.[0] ?? undefined} />
        </div>
      </FlowNodesProvider>
    </ReactFlowProvider>
  );
};

export default WorkspacePage;
