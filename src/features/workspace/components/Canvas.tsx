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
import { workspaceDarkPalette } from "@/features/workspace/constants/darkPalette";

const Workspace = () => {
  const isMobile = useIsMobile();
  const hasFitViewRun = useRef(false);
  const { darkMode } = useThemeContext();
  const palette = workspaceDarkPalette;
  const defaultLightBg = "#f8fafc";
  const defaultDarkBg = "#3D434B";
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

  const colorButtonClasses = `w-9 h-9 rounded-md transition hover:scale-105 border flex items-center justify-center ${
    darkMode
      ? "bg-[#2a2e32] border-white/10 text-slate-200 shadow-[0_12px_28px_rgba(0,0,0,0.45)] hover:border-white/25"
      : "border-gray-300 bg-white text-gray-700 shadow-md hover:border-gray-400"
  }`;

  const colorPickerClasses = `absolute bottom-[56px] left-0 z-[205] rounded-xl shadow-2xl p-2 border ${
    darkMode
      ? "bg-[#272b2f] border-white/10 text-slate-200 shadow-[0_24px_60px_rgba(0,0,0,0.65)]"
      : "bg-white border-gray-200 text-gray-700"
  }`;

  const resetButtonClasses = `text-xs px-2 py-1 rounded border transition ${
    darkMode
      ? "border-white/15 text-slate-300 hover:bg-[#3d434b] hover:text-white"
      : "border-gray-300 text-gray-700 hover:bg-gray-100"
  }`;

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
          className={colorButtonClasses}
          aria-label="Pick workspace background color"
        >
          <Paintbrush className="w-5 h-5" />
        </button>
        {showColorPicker && (
          <div
            ref={colorPickerRef}
            className={colorPickerClasses}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 px-1">
              <div className={`flex items-center gap-2 text-sm ${darkMode ? "text-slate-200" : "text-gray-700"}`}>
                <Paintbrush className="w-4 h-4" />
                <span>Canvas color</span>
              </div>
              <button
                className={resetButtonClasses}
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
          <Background
            color={darkMode ? "#30343a" : "#d4dae4"}
            gap={32}
            size={1.2}
          />
          <Controls
            className={`absolute bottom-4 left-4 ${darkMode ? "text-slate-100" : "text-black"}`}
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
          <Background
            color={darkMode ? "#30343a" : "#d4dae4"}
            gap={32}
            size={1.2}
          />
          <Controls
            className={`absolute bottom-4 left-4 ${darkMode ? "text-slate-100" : "text-black"}`}
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
          box-shadow: ${darkMode ? "0 12px 28px rgba(0,0,0,0.55)" : "0 6px 12px rgba(0,0,0,0.12)"};
          border: 1px solid ${darkMode ? "rgba(255,255,255,0.08)" : "#e5e7eb"};
          background: ${darkMode ? palette.surface : "#ffffff"};
          color: ${darkMode ? "rgba(248,250,252,0.85)" : "#111827"};
          transition: background 150ms ease, border-color 150ms ease, color 150ms ease;
        }
        .react-flow__controls button:hover {
          background: ${darkMode ? palette.highlight : "#f3f4f6"};
          border-color: ${darkMode ? "rgba(255,255,255,0.18)" : "#d1d5db"};
          color: ${darkMode ? "#f9fafb" : "#111827"};
        }
      `}</style>
    </div>
  );
};

export default Workspace;
