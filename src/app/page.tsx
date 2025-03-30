"use client";

import "@xyflow/react/dist/style.css";

import React from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { FlowNodesProvider } from "@/context/FlowNodesContext";

import { WorkshopContextProvider } from "@/context/WorkshopContext";
import SideBar from "@/components/SideBar/SideBar";
import WorkSpaceGrid from "@/components/WorkSpace/WorkSpaceGrid";
import { ThemeContextProvider } from "@/context/ThemeContext";

const App = () => {
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
        <WorkSpaceGrid />
      </FlowNodesProvider>
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
