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
import { useEffect, useRef, useState, useMemo } from "react";
import { useWorkingStore } from "../state/stores/useWorkingStore";
import { Paintbrush } from "lucide-react";
import { useTheme } from "@/features/workspace/hooks/useTheme";
import { useThemeContext } from "@/state/context/ThemeContext";
import { ActiveTheme, getTheme } from "@/features/workspace/constants/theme";
import { useSaveMap } from "../state/hooks/useSaveMap";
import { useUIStore } from "../state/stores/UI";

const Workspace = () => {
  const isMobile = useIsMobile();
  const hasFitViewRun = useRef(false);
  const selectedPartId = useUIStore((s) => s.selectedPartId);
  const theme = useTheme();
  const { activeTheme, setActiveTheme, isDark } = useThemeContext();
  // Memoize defaultBg to prevent unnecessary effect triggers when only mode changes
  const defaultBg = useMemo(() => theme.workspace, [theme.workspace]);
  const mapId = useWorkingStore((s) => s.mapId);
  const savedBgColor = useWorkingStore((s) => (s as any).workspaceBgColor);
  const [workspaceBgColor, setWorkspaceBgColor] = useState(savedBgColor || defaultBg);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const colorPickerRef = useRef<HTMLDivElement>(null);
  const colorButtonRef = useRef<HTMLButtonElement>(null);
  const hasDispatchedDragClose = useRef(false);
  const saveMap = useSaveMap();
  // Call auto-save inside ReactFlow context
  useAutoSave();

  // Track Shift key for snap-to-grid
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Shift') {
        setIsShiftPressed(true);
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === 'Shift') {
        setIsShiftPressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const {
    edges,
    handleNodeDrag,
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
  const prevMapIdRef = useRef<string>("");

  // Load saved background color when map changes (but not when theme changes)
  useEffect(() => {
    if (savedBgColor && savedBgColor !== defaultBg) {
      // Only use saved color if it's different from the current theme's default
      // This allows custom colors to persist within the same theme
      setWorkspaceBgColor(savedBgColor);
    } else {
      setWorkspaceBgColor(defaultBg);
    }
  }, [mapId, savedBgColor]);

  // Reset to theme default when activeTheme changes
  const prevActiveThemeRef = useRef(activeTheme);
  
  useEffect(() => {
    const themeChanged = prevActiveThemeRef.current !== activeTheme;
    
    // Only reset if theme actually changed
    if (themeChanged) {
      setWorkspaceBgColor(defaultBg);
      // Clear saved background color when theme changes
      useWorkingStore.setState({ workspaceBgColor: undefined } as any);
      prevActiveThemeRef.current = activeTheme;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTheme]); // Don't include defaultBg to prevent loops

  // Save background color to store when it changes (only if it's a custom color)
  // Use ref to track what we last saved to prevent loops
  const prevSavedToStoreRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    const currentSaved = useWorkingStore.getState().workspaceBgColor;
    
    // Only update if workspaceBgColor changed AND it's different from what we last saved
    if (workspaceBgColor !== prevSavedToStoreRef.current) {
      if (workspaceBgColor && workspaceBgColor !== defaultBg) {
        // Only update if it's different from what's already saved
        if (currentSaved !== workspaceBgColor) {
          useWorkingStore.setState({ workspaceBgColor } as any);
          prevSavedToStoreRef.current = workspaceBgColor;
        }
      } else if (workspaceBgColor === defaultBg && currentSaved !== undefined) {
        // Clear saved color if it matches the default (and something was saved)
        useWorkingStore.setState({ workspaceBgColor: undefined } as any);
        prevSavedToStoreRef.current = undefined;
      } else if (workspaceBgColor === defaultBg && currentSaved === undefined) {
        // Already cleared, just update ref
        prevSavedToStoreRef.current = defaultBg;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceBgColor]); // Don't include defaultBg to prevent loops

  // Helper function to adjust brightness of a hex color
  const adjustBrightness = (hex: string, percent: number) => {
    const num = parseInt(hex.replace("#", ""), 16);
    const r = Math.min(255, Math.max(0, ((num >> 16) & 0xff) + percent));
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + percent));
    const b = Math.min(255, Math.max(0, (num & 0xff) + percent));
    return `rgb(${r}, ${g}, ${b})`;
  };

  // Get gradient background for all themes, but allow custom colors
  const getBackgroundStyle = () => {
    // If user has selected a custom color, use it (even in dark mode)
    if (workspaceBgColor && workspaceBgColor !== defaultBg && workspaceBgColor !== theme.workspace) {
      return workspaceBgColor;
    }
    // Otherwise, use vignette effect for light mode, subtle gradient for dark mode
    if (workspaceBgColor === defaultBg) {
      if (!isDark) {
        // Radial gradient: white center fading to light peach at edges
        return "radial-gradient(rgb(255, 255, 255) 0%, rgb(255, 255, 255) 40%, rgb(252 248 246 / 82%) 100%)";
      } else {
        // Subtle gradient for dark mode: slightly lighter to slightly darker
        return `linear-gradient(152deg, ${adjustBrightness(theme.workspace, 3)}, ${adjustBrightness(theme.workspace, -3)})`;
      }
    }
    return workspaceBgColor;
  };

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

  // Listen for custom event to open theme picker
  useEffect(() => {
    const handleOpenThemePicker = () => {
      setShowColorPicker(true);
    };
    window.addEventListener("open-theme-picker", handleOpenThemePicker);
    return () => window.removeEventListener("open-theme-picker", handleOpenThemePicker);
  }, []);

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


  // bg-[image:var(--theme-workspace-bg)]
  return (
    <div id="canvas" className="h-full flex-grow relative ">
      {!selectedPartId && (
        <div 
          className="fixed" 
          style={{ left: "146px", bottom: "15px", zIndex: 75, pointerEvents: "auto", display: "flex", alignItems: "center" }}
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
            className={`
              w-9 h-9 rounded-md transition hover:scale-105 border flex items-center justify-center
              theme-dark:bg-[#2a2e32]
              bg-white
              ${showColorPicker ? 'theme-light:bg-[image:var(--theme-jazz-gradient)] theme-dark:bg-[var(--theme-sub-button-hover)] scale-105' : ''}
              theme-light:hover:bg-[image:var(--theme-jazz-gradient)]
            theme-dark:hover:bg-[var(--theme-sub-button-hover)]
              shadow-sm theme-dark:shadow-[0_12px_28px_rgba(0,0,0,0.45)] hover:bg-[var(--theme-component-hover)]
              border-none text-[var(--theme-button-text)]
            `}
            aria-label="Pick workspace background color"
          >
            <Paintbrush className="w-5 h-5" />
          </button>
          {showColorPicker && (
            <div
              ref={colorPickerRef}
              className="absolute bottom-[56px] left-0 z-[80] rounded-xl shadow-2xl p-2 border w-80 max-w-80 shadow-[0_24px_60px_rgba(0,0,0,0.65)]"
              style={{
                backgroundColor: theme.surface,
                borderColor: theme.border,
                color: theme.textPrimary,
              }}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
            <div className="flex items-center justify-between pb-2 px-1 mb-3">
              <div className="flex items-center gap-2 text-sm" style={{ color: theme.textSecondary }}>
                <Paintbrush className="w-4 h-4" />
                <span>Theme</span>
              </div>
            </div>
            
            {/* Theme Selection: Light, Dark, Cherry */}
            <div className="space-y-2 mb-4">
              {[
                { name: "light", label: "Light", theme: "light" as ActiveTheme, comingSoon: false },
                { name: "dark", label: "Dark", theme: "dark" as ActiveTheme, comingSoon: false },
                { name: "cherry", label: "Cherry", theme: "cherry" as ActiveTheme, comingSoon: true },
              ].map((themeOption) => {
                // Check if this theme option is currently active
                const isActive = activeTheme === themeOption.theme;
                const previewTheme = getTheme(themeOption.theme);
                
                const previewSwatches = [
                  previewTheme.workspace,
                  previewTheme.card,
                  previewTheme.accent,
                ];
                
                return (
                  <button
                    key={themeOption.name}
                    disabled={themeOption.comingSoon}
                    aria-disabled={themeOption.comingSoon}
                    onClick={async () => {
                      if (themeOption.comingSoon) return;
                      
                      console.log(`[Canvas] Theme option clicked:`, {
                        themeOption: themeOption.theme,
                        label: themeOption.label,
                        mapId,
                        currentActiveTheme: activeTheme,
                        previewThemeWorkspace: previewTheme.workspace
                      });
                      
                      // Set workspace-specific theme (do NOT persist as global)
                      setActiveTheme(themeOption.theme, false);
                      setWorkspaceBgColor(previewTheme.workspace);
                      
                      // Save workspace theme to map immediately
                      if (mapId) {
                        const { nodes, edges, sidebarImpressions } = useWorkingStore.getState();
                        
                        const sidebarImpressionsData = {
                          ...sidebarImpressions,
                          _metadata: {
                            ...(typeof sidebarImpressions === "object" &&
                            "_metadata" in sidebarImpressions
                              ? (sidebarImpressions as any)._metadata
                              : {}),
                            workspaceBgColor: previewTheme.workspace,
                            activeTheme: themeOption.theme,
                          },
                        };
                        
                        const savePayload = {
                          nodes,
                          edges,
                          sidebarImpressions: sidebarImpressionsData,
                          workspaceBgColor: previewTheme.workspace,
                          activeTheme: themeOption.theme,
                        };
                        
                        console.log(`[Canvas] Saving workspace theme to API:`, {
                          mapId,
                          activeTheme: themeOption.theme,
                          payload: savePayload
                        });
                        
                        try {
                          const response = await fetch(`/api/maps/${mapId}`, {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(savePayload),
                          });
                          const result = await response.json();
                          console.log(`[Canvas] Workspace theme saved successfully:`, {
                            theme: themeOption.label,
                            response: result
                          });
                        } catch (error) {
                          console.error("[Canvas] Failed to save workspace theme:", error);
                        }
                      }
                    }}
                    className="w-full text-left px-3 py-2 text-sm rounded-2xl flex items-center gap-3 border transition-all"
                    style={{
                      backgroundColor: isActive ? theme.elevated : theme.surface,
                      borderColor: theme.border,
                      color: theme.textPrimary,
                      boxShadow: "none",
                      opacity: themeOption.comingSoon ? 0.55 : 1,
                      cursor: themeOption.comingSoon ? "not-allowed" : "pointer",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive && !themeOption.comingSoon) {
                        e.currentTarget.style.backgroundColor = theme.buttonHover;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive && !themeOption.comingSoon) {
                        e.currentTarget.style.backgroundColor = theme.surface;
                      }
                    }}
                  >
                    <div className="flex gap-1.5">
                      {previewSwatches.map((color, idx) => (
                        <span
                          key={`${themeOption.name}-${idx}`}
                          className="h-7 w-4 rounded-full border"
                          style={{
                            borderColor: theme.border,
                            backgroundColor: color,
                          }}
                        />
                      ))}
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="font-semibold">
                        {themeOption.label}
                      </span>
                    </div>
                    {themeOption.comingSoon ? (
                      <span
                        className="text-[10px] font-semibold px-2 py-1 rounded-full uppercase tracking-wide border flex-shrink-0"
                        style={{
                          backgroundColor: "rgba(148, 163, 184, 0.15)",
                          color: theme.textSecondary,
                          borderColor: theme.border,
                        }}
                      >
                        Coming soon
                      </span>
                    ) : isActive ? (
                      <span
                        className="text-[10px] font-semibold px-2 py-1 rounded-full uppercase tracking-wide border flex-shrink-0"
                        style={{
                          backgroundColor: theme.accent,
                          color: theme.buttonText,
                          borderColor: theme.border,
                        }}
                      >
                        Current
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
          )}
        </div>
      )}
      {!isMobile ? (
        <ReactFlow
          className="h-[4000px] w-[4000px] bg-[image:var(--theme-workspace-bg)]"
          // style={{ background: getBackgroundStyle() }}
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange as OnNodesChange<Node>}
          onEdgesChange={onEdgeChange}
          onNodeDrag={handleNodeDrag}
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
          snapToGrid={isShiftPressed}
          snapGrid={[32, 32]}
        >
          <FitViewOnLoad />
          <Background
            color={theme.workspace}
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
          className="h-[4000px] w-[4000px] bg-[image:var(--theme-workspace-bg)]"
          // style={{ background: getBackgroundStyle() }}
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
            color={'green'}
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
          border: 1px solid ${theme.border} !important;
          background: ${theme.button} !important;
          color: ${theme.textPrimary} !important;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
          transition: transform 150ms ease, background 150ms ease, color 150ms ease;
        }
        ${isDark ? `
        .react-flow__controls button {
          border: none !important;
          box-shadow: 0 12px 28px rgba(0,0,0,0.45) !important;
        }
        ` : ''}
        .react-flow__controls button:hover {
          transform: scale(1.05);
          background: ${theme.buttonHover} !important;
          color: ${theme.textPrimary} !important;
        }
      `}</style>
    </div>
  );
};

export default Workspace;
