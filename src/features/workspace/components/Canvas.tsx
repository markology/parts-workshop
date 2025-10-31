"use client";

import { nodeTypes } from "@/features/workspace/components/Nodes/NodeManager";
import { useFlowNodesContext } from "@/features/workspace/state/FlowNodesContext";
import {
  Background,
  Controls,
  Node,
  OnNodesChange,
  ReactFlow,
  useReactFlow,
} from "@xyflow/react";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useAutoSave } from "../state/hooks/useAutoSave";
import { useEffect, useRef } from "react";
import { useWorkingStore } from "../state/stores/useWorkingStore";

const Workspace = () => {
  const isMobile = useIsMobile();
  const hasFitViewRun = useRef(false);
  
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

  // Get mapId to reset fitView when map changes
  const mapId = useWorkingStore((s) => s.mapId);
  const prevMapIdRef = useRef<string>("");

  // Reset fitView when map changes
  useEffect(() => {
    if (mapId && mapId !== prevMapIdRef.current) {
      hasFitViewRun.current = false;
      prevMapIdRef.current = mapId;
    }
  }, [mapId]);

	// Component to call fitView on load, then zoom out
	const FitViewOnLoad = () => {
		const { fitView, getViewport, setCenter, screenToFlowPosition } = useReactFlow();
    
	useEffect(() => {
	  if (hasFitViewRun.current) return;
	  if (!nodes || nodes.length === 0) return; // wait until nodes exist
	  // Wait briefly to allow measurements, then run once
	  const fitTimer = setTimeout(() => {
	    fitView();
	    const postTimer = setTimeout(() => {
	      const viewportAfterFit = getViewport();
	      const screenCenter = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
	      const flowCenterAfterFit = screenToFlowPosition(screenCenter);
	      const targetZoom = Math.max(viewportAfterFit.zoom * 0.75, 0.02);
	      setCenter(flowCenterAfterFit.x - (250 / targetZoom), flowCenterAfterFit.y, { zoom: targetZoom, duration: 200 });
	      hasFitViewRun.current = true;
	    }, 300);
	    return () => clearTimeout(postTimer);
	  }, 200);
	  return () => clearTimeout(fitTimer);
	}, [nodes.length]);
    
    return null;
  };

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
          onPaneClick={handlePaneClick}
          nodeTypes={nodeTypes}
          defaultViewport={{ x: 0, y: 0, zoom: 1 }}
          minZoom={0}
          deleteKeyCode="Delete" 
          maxZoom={2}
        >
          <FitViewOnLoad />
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
          defaultViewport={{ x: 0, y: 0, zoom: 1 }}
          minZoom={0}
          maxZoom={2}
        >
          <FitViewOnLoad />
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
