"use client";

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
import { Map } from "@prisma/client";

const Workspace = ({ map }: { map?: Map }) => {
  console.log("map in workspace", map);

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
    </div>
  );
};

export default Workspace;
