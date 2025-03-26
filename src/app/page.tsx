"use client";

import "@xyflow/react/dist/style.css";

import React, { useState } from "react";
import { ReactFlowProvider } from "@xyflow/react";

import { WorkshopContextProvider } from "./context/WorkshopContext";
import SideBar, { type SideBarItem } from "./components/SideBar";
import Workspace from "@/app/components/Workspace";

const App = () => {
  const [activeSideBarNode, setActiveSideBarNode] =
    useState<SideBarItem | null>(null);

  return (
    <div className="dndflow">
      <SideBar setActiveSideBarNode={setActiveSideBarNode} />
      <Workspace activeSideBarNode={activeSideBarNode} />
    </div>
  );
};

const AppProvider = () => {
  return (
    <ReactFlowProvider>
      <WorkshopContextProvider>
        <App />
      </WorkshopContextProvider>
    </ReactFlowProvider>
  );
};

export default AppProvider;
