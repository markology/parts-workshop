"use client";

import type { Map } from "@/types/api/map";
import { nodeTypes } from "@/features/workspace/components/Nodes/NodeManager";
import { useFlowNodesContext } from "@/features/workspace/state/FlowNodesContext";
import {
  Background,
  Controls,
  Node,
  OnNodesChange,
  ReactFlow,
} from "@xyflow/react";
import TrashCan from "./TrashCan";
import useAutosave from "../state/useAutosave";
import { useSidebarStore } from "@/state/Sidebar";
import SaveProgress from "./SaveProgress";
import Logout from "./Logout";
import ThemeToggle from "./ThemeToggle";

const Workspace = ({ map }: { map?: Map }) => {
  const sidebarImpressions = useSidebarStore((s) => s.impressions);
  const {
    edges,
    handleNodeDragStop,
    handlePaneClick,
    nodes,
    onConnect,
    onDragOver,
    onDrop,
    onEdgeChange,
    onNodesChange,
  } = useFlowNodesContext();

  const { saveMap } = useAutosave({
    mapId: map?.id,
    nodes,
    edges,
    sidebarImpressions,
  });

  return (
    <div className="reactflow-wrapper">
      <ReactFlow
        className="h-[4000px] w-[4000px]"
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange as OnNodesChange<Node>}
        onEdgesChange={onEdgeChange}
        onNodeDragStop={handleNodeDragStop}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        fitView
        onPaneClick={handlePaneClick}
        nodeTypes={nodeTypes}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        minZoom={0}
        deleteKeyCode="Delete"
        maxZoom={2}
      >
        <Background />
        <Controls className="absolute bottom-4 left-4" />
      </ReactFlow>
      <TrashCan />
      <SaveProgress saveMap={saveMap} />
      <Logout />
      <ThemeToggle />
    </div>
  );
};

export default Workspace;
