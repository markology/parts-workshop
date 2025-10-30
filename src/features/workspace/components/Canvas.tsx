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
import { useIsMobile } from "@/hooks/useIsMobile";
import { useAutoSave } from "../state/hooks/useAutoSave";

const Workspace = () => {
  const isMobile = useIsMobile();
  
  // Call auto-save inside ReactFlow context
  useAutoSave();

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

  // Sidebar width: w-64 = 256px, plus button area (~80px) = ~336px total
  const SIDEBAR_WIDTH = 336;

  return (
    <div id="canvas" className="h-full flex-grow">
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
          fitViewOptions={{
            padding: { left: SIDEBAR_WIDTH, right: 20, top: 20, bottom: 20 },
            minZoom: 0.8,
            maxZoom: 2,
            duration: 0,
          }}
          onPaneClick={handlePaneClick}
          nodeTypes={nodeTypes}
          defaultViewport={{ x: 0, y: 0, zoom: 1 }}
          minZoom={0}
          deleteKeyCode="Delete"
          maxZoom={2}
        >
          <Background />
          <Controls
            className="absolute bottom-4 left-4 text-black"
            orientation="horizontal"
            showInteractive={false}
            style={{ flexDirection: 'row-reverse' }}
          />
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
          fitViewOptions={{
            padding: { left: 20, right: 20, top: 20, bottom: 20 },
            minZoom: 0.8,
            maxZoom: 2,
            duration: 0,
          }}
          defaultViewport={{ x: 0, y: 0, zoom: 1 }}
          minZoom={0}
          maxZoom={2}
        >
          <Background />
          <Controls
            className="absolute bottom-4 left-4 text-black"
            orientation="horizontal"
            showInteractive={false}
            style={{ flexDirection: 'row-reverse' }}
          />
        </ReactFlow>
      )}
    </div>
  );
};

export default Workspace;
