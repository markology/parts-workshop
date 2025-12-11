"use client";

import { nodeTypes } from "@/features/workspace/components/Nodes/NodeManager";
import { useFlowNodesContext } from "@/features/workspace/state/FlowNodesContext";
import {
  Background,
  Controls,
  type Node,
  OnNodesChange,
  ReactFlow,
  useReactFlow,
} from "@xyflow/react";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useAutoSave } from "../state/hooks/useAutoSave";
import { useEffect, useRef, useState } from "react";
import { useWorkingStore } from "../state/stores/useWorkingStore";
import { ChromePicker, ColorResult } from "react-color";
import { Paintbrush } from "lucide-react";
import { useThemeContext } from "@/state/context/ThemeContext";

const Workspace = () => {
  const isMobile = useIsMobile();
  const hasFitViewRun = useRef(false);
  const { darkMode } = useThemeContext();
  const defaultLightBg = "#f8fafc";
  const defaultDarkBg = "#0f172a";
  const defaultBg = darkMode ? defaultDarkBg : defaultLightBg;
  const [workspaceBgColor, setWorkspaceBgColor] = useState(defaultBg);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const colorPickerRef = useRef<HTMLDivElement>(null);
  const colorButtonRef = useRef<HTMLButtonElement>(null);
  const hasDispatchedDragClose = useRef(false);
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

  useEffect(() => {
    setWorkspaceBgColor(darkMode ? defaultDarkBg : defaultLightBg);
  }, [darkMode]);

  const handlePaneClickWrapped = () => {
    setShowColorPicker(false);
    window.dispatchEvent(new CustomEvent("workspace-pane-click"));
    handlePaneClick();
  };

  const handlePaneDragStart = () => {
    if (hasDispatchedDragClose.current) return;
    setShowColorPicker(false);
    window.dispatchEvent(new CustomEvent("workspace-pane-click"));
    hasDispatchedDragClose.current = true;
    // reset after a brief moment to allow future drags to retrigger
    setTimeout(() => {
      hasDispatchedDragClose.current = false;
    }, 500);
  };

  useEffect(() => {
    if (!showColorPicker) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node | null;
      const insideButton = colorButtonRef.current && target instanceof Node && colorButtonRef.current.contains(target);
      const insidePicker = colorPickerRef.current && target instanceof Node && colorPickerRef.current.contains(target);
      if (insideButton) return; // button click is handled by its own onClick
      if (!insidePicker) {
        setShowColorPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showColorPicker]);

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
    <div id="canvas" className="h-full flex-grow relative">
      <div 
        className="fixed" 
        style={{ left: "146px", bottom: "15px", zIndex: 200, pointerEvents: "auto", display: "flex", alignItems: "center" }}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button
          ref={colorButtonRef}
          onClick={(e) => {
            e.stopPropagation();
            if (showColorPicker) {
              setShowColorPicker(false);
              return;
            }
            setShowColorPicker(true);
          }}
          className="w-9 h-9 rounded-md shadow-md transition hover:scale-105 border border-gray-300 bg-white text-gray-700 flex items-center justify-center"
          aria-label="Pick workspace background color"
        >
          <Paintbrush className="w-5 h-5" />
        </button>
        {showColorPicker && (
          <div
            ref={colorPickerRef}
            className="absolute bottom-[56px] left-0 z-[205] bg-white rounded-xl shadow-2xl p-2"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 px-1">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Paintbrush className="w-4 h-4" />
                <span>Canvas color</span>
              </div>
              <button
                className="text-xs px-2 py-1 rounded border border-gray-300 hover:bg-gray-100"
                onClick={() => setWorkspaceBgColor(defaultBg)}
              >
                Reset
              </button>
            </div>
            <ChromePicker
              color={workspaceBgColor}
              onChange={(color: ColorResult) => {
                setWorkspaceBgColor(color.hex);
              }}
              disableAlpha
            />
          </div>
        )}
      </div>
      {!isMobile ? (
        <ReactFlow
          className="h-[4000px] w-[4000px]"
          style={{ background: workspaceBgColor }}
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange as OnNodesChange<Node>}
          onEdgesChange={onEdgeChange}
          onNodeDragStop={handleNodeDragStop}
          onConnect={onConnect}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onPaneClick={handlePaneClickWrapped}
          onMouseDown={handlePaneDragStart}
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
      <style jsx global>{`
        .react-flow__controls {
          display: inline-flex;
          gap: 0.4rem;
          align-items: center;
          background: transparent !important;
          box-shadow: none !important;
          border: none !important;
          padding: 0;
        }
        .react-flow__controls button {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          box-shadow: 0 6px 12px rgba(0, 0, 0, 0.12);
          border: 1px solid #e5e7eb;
        }
      `}</style>
    </div>
  );
};

export default Workspace;
