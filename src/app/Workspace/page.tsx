"use client";

import "@xyflow/react/dist/style.css";

import React, { useEffect, useState } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { FlowNodesProvider } from "@/context/FlowNodesContext";

import { WorkshopContextProvider } from "@/context/WorkshopContext";
import SideBar from "@/components/SideBar/SideBar";
import WorkSpaceGrid from "@/components/WorkSpace/WorkSpaceGrid";
import { useSession } from "next-auth/react";
import { Map } from "@/types/api/map";

const WorkspacePresentational = ({ map }: { map?: Map }) => {
  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        overflow: "hidden",
        display: "flex",
      }}
      className={`PW`}
    >
      <FlowNodesProvider>
        <SideBar />
        <WorkSpaceGrid map={map} />
      </FlowNodesProvider>
    </div>
  );
};

const WorkSpaceContainer = () => {
  const { data: session } = useSession();
  const [map, setMap] = useState<Map | undefined>();
  console.log(session);

  useEffect(() => {
    (async function () {
      try {
        if (session && session?.user.id) {
          const res = await fetch(`${window.location.origin}/api/maps`);
          const data = await res.json();

          if (data.data.length) setMap(data.data[0]);
        }
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : String(error));
      }
    })();
  }, [session]);

  return (
    <ReactFlowProvider>
      <WorkshopContextProvider>
        <WorkspacePresentational map={map} />
      </WorkshopContextProvider>
    </ReactFlowProvider>
  );
};

export default WorkSpaceContainer;
