"use client";

import "@xyflow/react/dist/style.css";

import React, { useState } from "react";
import {
  Node,
  NodeChange,
  ReactFlowProvider,
  useNodesState,
} from "@xyflow/react";

import { WorkshopContextProvider } from "./context/WorkshopContext";
import SideBar, { type SideBarItem } from "./components/SideBar/SideBar";
import WorkSpaceGrid from "@/app/components/WorkSpaceGrid";
import { ThemeContextProvider } from "./context/ThemeContext";

export type NodeStateType = {
  nodes: Node[];
  setNodes: (updater: (nodes: Node[]) => Node[]) => void;
  onNodesChange: (changes: NodeChange<Node>[]) => void;
};

const App = () => {
  const [activeSideBarNode, setActiveSideBarNode] =
    useState<SideBarItem | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);

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
      <SideBar
        setNodes={setNodes}
        setActiveSideBarNode={setActiveSideBarNode}
      />
      <WorkSpaceGrid
        nodes={nodes}
        setNodes={setNodes}
        onNodesChange={onNodesChange}
        activeSideBarNode={activeSideBarNode}
      />
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
