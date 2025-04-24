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
import Utilities from "./Utilities/Utilities";
import { useJournalStore } from "@/state/Journal";
import { useIsMobile } from "@/hooks/useIsMobile";

const Workspace = () => {
  const isOpen = useJournalStore((s) => s.isOpen);
  const isMobile = useIsMobile();

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
    <div id="canvas" className="reactflow-wrapper">
      {!isMobile ? (
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
          <Controls className="absolute bottom-4 left-4" /> :
        </ReactFlow>
      ) : (
        <ReactFlow
          className="h-[4000px] w-[4000px]"
          nodes={nodes}
          edges={edges}
          onNodesChange={() => {}}
          onEdgesChange={() => {}}
          onConnect={() => {}}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          nodeTypes={nodeTypes}
          fitView
          defaultViewport={{ x: 0, y: 0, zoom: 1 }}
          minZoom={0}
          maxZoom={2}
        >
          <Background />
          <Controls className="absolute bottom-4 left-4" />
        </ReactFlow>
      )}
      {!isOpen && <Utilities full />} {/* now Zustand-powered */}
    </div>
  );
};

export default Workspace;
