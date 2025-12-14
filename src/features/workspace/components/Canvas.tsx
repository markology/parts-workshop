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
import { useTheme } from "@/features/workspace/hooks/useTheme";
import { useThemeContext } from "@/state/context/ThemeContext";
import { ThemeName, getThemeByName } from "@/features/workspace/constants/theme";

const Workspace = () => {
  const isMobile = useIsMobile();
  const hasFitViewRun = useRef(false);
  const theme = useTheme();
  const { themeName, setThemeName } = useThemeContext();
  const defaultBg = theme.workspace;
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
    setWorkspaceBgColor(theme.workspace);
  }, [theme.workspace]);

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

  const colorButtonStyle = {
    backgroundColor: theme.elevated,
    borderColor: theme.border,
    color: theme.textPrimary,
    boxShadow: '0 12px 28px rgba(0,0,0,0.45)',
  };

  const colorPickerStyle = {
    backgroundColor: theme.surface,
    borderColor: theme.border,
    color: theme.textPrimary,
    boxShadow: '0 24px 60px rgba(0,0,0,0.65)',
  };

  const resetButtonStyle = {
    borderColor: theme.border,
    color: theme.textSecondary,
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
          className="w-9 h-9 rounded-md transition hover:scale-105 border flex items-center justify-center"
          style={colorButtonStyle}
          aria-label="Pick workspace background color"
        >
          <Paintbrush className="w-5 h-5" />
        </button>
        {showColorPicker && (
          <div
            ref={colorPickerRef}
            className="absolute bottom-[56px] left-0 z-[205] rounded-xl shadow-2xl p-2 border"
            style={colorPickerStyle}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 px-1 mb-3">
              <div className={`flex items-center gap-2 text-sm`} style={{ color: theme.textSecondary }}>
                <Paintbrush className="w-4 h-4" />
                <span>Theme</span>
              </div>
            </div>
            
            {/* Theme Selection */}
            <div className="space-y-1 mb-4">
              {(['light', 'dark', 'red'] as ThemeName[]).map((option) => {
                const isActive = themeName === option;
                return (
                  <button
                    key={option}
                    onClick={() => {
                      setThemeName(option);
                      setWorkspaceBgColor(getThemeByName(option).workspace);
                    }}
                    className="w-full text-left px-3 py-2 text-sm rounded transition-colors flex items-center gap-2"
                    style={{
                      backgroundColor: isActive ? theme.accent : 'transparent',
                      color: theme.textPrimary,
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = theme.buttonHover;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    <span className="capitalize">{option}</span>
                    {isActive && (
                      <span className="ml-auto text-xs">✓</span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="border-t pt-3" style={{ borderColor: theme.borderSubtle }}>
              <div className="flex items-center justify-between pb-2 px-1">
                <div className={`flex items-center gap-2 text-sm`} style={{ color: theme.textSecondary }}>
                  <Paintbrush className="w-4 h-4" />
                  <span>Canvas color</span>
                </div>
                <button
                  className="text-xs px-2 py-1 rounded border transition hover:opacity-80"
                  style={resetButtonStyle}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = theme.accentHover;
                    e.currentTarget.style.color = theme.textPrimary;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = theme.textSecondary;
                  }}
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
            color={theme.border}
            gap={32}
            size={1.2}
          />
          <Controls
            className="absolute bottom-4 left-4"
            orientation="horizontal"
            showInteractive={false}
            style={{ flexDirection: 'row-reverse', color: theme.textPrimary }}
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
            color={theme.border}
            gap={32}
            size={1.2}
          />
          <Controls
            className="absolute bottom-4 left-4"
            orientation="horizontal"
            showInteractive={false}
            style={{ flexDirection: 'row-reverse', color: theme.textPrimary }}
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
          box-shadow: 0 12px 28px rgba(0,0,0,0.55);
          border: 1px solid ${theme.border};
          background: ${theme.surface};
          color: ${theme.textSecondary};
          transition: background 150ms ease, border-color 150ms ease, color 150ms ease;
        }
        .react-flow__controls button:hover {
          background: ${theme.accent};
          border-color: ${theme.border};
          color: ${theme.textPrimary};
        }
      `}</style>
    </div>
  );
};

export default Workspace;
