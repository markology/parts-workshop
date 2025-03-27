"use client";

import "@xyflow/react/dist/style.css";

import React, { useState } from "react";
import { ReactFlowProvider } from "@xyflow/react";

import { WorkshopContextProvider } from "./context/WorkshopContext";
import SideBar, { type SideBarItem } from "./components/SideBar/SideBar";
import Workspace from "@/app/components/Workspace";
import { ThemeContextProvider } from "./context/ThemeContext";

const App = () => {
  const [activeSideBarNode, setActiveSideBarNode] =
    useState<SideBarItem | null>(null);

  return (
    <div className={`PW`}>
      <SideBar setActiveSideBarNode={setActiveSideBarNode} />
      <Workspace activeSideBarNode={activeSideBarNode} />
    </div>
  );
};

const AppProvider = () => {
  return (
    <ReactFlowProvider>
      <ThemeContextProvider>
        <WorkshopContextProvider>
          <App />
        </WorkshopContextProvider>
      </ThemeContextProvider>
    </ReactFlowProvider>
  );
};

export default AppProvider;
