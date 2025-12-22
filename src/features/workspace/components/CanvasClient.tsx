"use client";

import { useEffect, useState, useRef } from "react";
import { useLoadMap } from "../state/hooks/useLoadMap";
import Canvas from "./Canvas";
import { useWorkingStore } from "../state/stores/useWorkingStore";
import { FlowNodesProvider } from "../state/FlowNodesContext";
import { useIsMobile } from "@/hooks/useIsMobile";
import OnboardingModal from "@/components/OboardingModal";
import { createEmptyImpressionGroups } from "../state/stores/useWorkingStore";
import FloatingActionButtons from "./FloatingActionButtons";
import PartInput from "./SideBar/PartInput";
import ImpressionInput from "./SideBar/Impressions/ImpressionInput";
import FeedbackForm from "@/components/FeedbackForm";
import Modal from "@/components/Modal";
import { useUIStore } from "../state/stores/UI";
import PartDetailPanel from "./SideBar/PartDetailPanel";
import PageLoader from "@/components/PageLoader";
import { useSession, signOut } from "next-auth/react";
import { User, Settings, Moon, Mail, LogOut, HelpCircle } from "lucide-react";
import Image from "next/image";
import { NodeBackgroundColors, NodeTextColors } from "../constants/Nodes";
import { ImpressionTextType, ImpressionType } from "../types/Impressions";
import { Sparkles, X } from "lucide-react";
import { useThemeContext } from "@/state/context/ThemeContext";
import { useTheme } from "@/features/workspace/hooks/useTheme";
import type { ThemeName } from "@/features/workspace/constants/theme";
import { usePathname } from "next/navigation";
// import TourOverlay from "./TourOverlay";

// Helper to detect if user is on Mac
const isMac = () => {
  if (typeof window === 'undefined') return false;
  return /Mac|iPhone|iPad|iPod/.test(navigator.platform) || 
         /Mac|iPhone|iPad|iPod/.test(navigator.userAgent);
};

// Function to normalize sidebarImpressions data structure
const normalizeSidebarImpressions = (sidebarImpressions: any) => {
  if (!sidebarImpressions || typeof sidebarImpressions !== 'object') {
    return createEmptyImpressionGroups();
  }

  // Check if it's already in the correct format
  const expectedKeys = ['emotion', 'thought', 'sensation', 'behavior', 'other'];
  const hasExpectedKeys = expectedKeys.every(key => key in sidebarImpressions);
  
  if (hasExpectedKeys) {
    return sidebarImpressions;
  }

  // If it's an array or different structure, create empty structure
  return createEmptyImpressionGroups();
};

export default function CanvasClient({
  mapId,
  showOnboarding,
}: {
  mapId: string;
  showOnboarding: boolean;
}) {
  const { data, isLoading, error } = useLoadMap(mapId);
  const [hydrated, setHydrated] = useState(false);
  const isMobile = useIsMobile();
  const { data: session } = useSession();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [profileDropdownPosition, setProfileDropdownPosition] = useState<{ top: number; right: number } | null>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  
  // Use individual selectors - Zustand handles this efficiently with shallow comparison
  const showPartModal = useUIStore((s) => s.showPartModal);
  const setShowPartModal = useUIStore((s) => s.setShowPartModal);
  const showImpressionModal = useUIStore((s) => s.showImpressionModal);
  const setShowImpressionModal = useUIStore((s) => s.setShowImpressionModal);
  const showFeedbackModal = useUIStore((s) => s.showFeedbackModal);
  const setShowFeedbackModal = useUIStore((s) => s.setShowFeedbackModal);
  const { darkMode, themeName, setThemeName } = useThemeContext();
  const theme = useTheme();
  const pathname = usePathname();
  const [sidebarImpressionType, setSidebarImpressionType] = useState<ImpressionType>("emotion");
  const [canAddImpression, setCanAddImpression] = useState(false);
  const impressionAddRef = useRef<{ add: () => void; isValid: boolean } | null>(null);
  const previousThemeRef = useRef<ThemeName | null>(null);
  const workspaceThemeAppliedRef = useRef(false);
  const isInWorkspaceRef = useRef(true);
  const prevPathnameRef = useRef<string | null>(null);
  const isRestoringThemeRef = useRef(false);
  const setThemeNameRef = useRef(setThemeName);
  
  // Keep ref updated with latest setThemeName
  useEffect(() => {
    setThemeNameRef.current = setThemeName;
  }, [setThemeName]);

  useEffect(() => {
    if (showImpressionModal) {
      setSidebarImpressionType("emotion");
    }
  }, [showImpressionModal]);

  const toRgba = (hex: string, opacity: number) => {
    if (!hex) return `rgba(99, 102, 241, ${opacity})`;
    const sanitized = hex.replace("#", "");
    const bigint = parseInt(sanitized, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  const accentHex =
    NodeBackgroundColors[sidebarImpressionType as keyof typeof NodeBackgroundColors] ?? "#6366f1";
  const accentTextHex = darkMode
    ? NodeBackgroundColors[sidebarImpressionType as keyof typeof NodeBackgroundColors] ?? "#6366f1"
    : NodeTextColors[sidebarImpressionType as keyof typeof NodeTextColors] ?? "#312e81";
  const accentSoftBg = toRgba(accentHex, darkMode ? 0.26 : 0.14);
  const accentBorder = toRgba(accentHex, darkMode ? 0.55 : 0.28);
  const impressionTypeLabel =
    ImpressionTextType[sidebarImpressionType] ?? "Impression";

  // Update dropdown position when it opens
  useEffect(() => {
    if (profileDropdownOpen && profileDropdownRef.current) {
      const rect = profileDropdownRef.current.getBoundingClientRect();
      setProfileDropdownPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right
      });
    } else {
      setProfileDropdownPosition(null);
    }
  }, [profileDropdownOpen]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (data && typeof data === 'object' && 'id' in data) {
      const normalizedSidebarImpressions = normalizeSidebarImpressions(data.sidebarImpressions);

      // Clear the store completely before setting new data to prevent cross-map contamination
      useWorkingStore.getState().setState({
        mapId: "",
        nodes: [],
        edges: [],
        sidebarImpressions: createEmptyImpressionGroups(),
        journalEntries: [],
        hydrated: false,
      });

      // Extract workspaceBgColor from sidebarImpressions metadata if it exists
      const sidebarImpressionsData = data.sidebarImpressions || {};
      const metadata =
        typeof sidebarImpressionsData === "object" &&
        "_metadata" in sidebarImpressionsData
          ? (sidebarImpressionsData as any)._metadata
          : {};
      const workspaceBgColor = metadata?.workspaceBgColor;
      const mapThemeName = metadata?.themeName as ThemeName | undefined;

      // Then set the new map data
      useWorkingStore.getState().setState({
        mapId: data.id,
        nodes: data.nodes || [],
        edges: data.edges || [],
        sidebarImpressions: normalizedSidebarImpressions,
        journalEntries: data.journalEntries ?? [],
        workspaceBgColor: workspaceBgColor || undefined,
        hydrated: true,
      });

      // Store the current global theme before applying workspace theme (only once per workspace load)
      // This is the theme that was active BEFORE entering the workspace
      if (!previousThemeRef.current) {
        // Get the actual global theme (not workspace theme) from localStorage
        const globalThemeName = localStorage.getItem("themeName") as ThemeName | null;
        const themeGlobal = localStorage.getItem("themeGlobal");
        
        if (themeGlobal === "1" && globalThemeName && ["light", "dark", "red"].includes(globalThemeName)) {
          // User has a saved global theme
          previousThemeRef.current = globalThemeName;
        } else {
          // No global preference, use browser preference
          const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
          previousThemeRef.current = prefersDark ? "dark" : "light";
        }
        console.log(`[Workspace] Stored global theme for restore: ${previousThemeRef.current}`);
      }

      // If the map has a saved theme, prefer that over system/default
      // Workspace themes ALWAYS override global themes
      if (mapThemeName && ["light", "dark", "red"].includes(mapThemeName)) {
        // Map-specific theme: do NOT persist as global preference
        console.log(`[Workspace] Applying workspace theme: ${mapThemeName} (overrides global)`);
        setThemeName(mapThemeName, false);
        workspaceThemeAppliedRef.current = true;
      } else {
        // No workspace theme saved - on first load, set it to dark or light based on current mode
        if (!workspaceThemeAppliedRef.current) {
          const defaultWorkspaceTheme: ThemeName = darkMode ? "dark" : "light";
          console.log(`[Workspace] No workspace theme found, setting to ${defaultWorkspaceTheme} based on mode`);
          setThemeName(defaultWorkspaceTheme, false);
          workspaceThemeAppliedRef.current = true;
          
          // Save this default theme to the map
          const sidebarImpressionsData = {
            ...normalizedSidebarImpressions,
            _metadata: {
              ...(typeof normalizedSidebarImpressions === "object" &&
              "_metadata" in normalizedSidebarImpressions
                ? (normalizedSidebarImpressions as any)._metadata
                : {}),
              workspaceBgColor: workspaceBgColor || undefined,
              themeName: defaultWorkspaceTheme,
            },
          };
          
          // Save asynchronously (don't block rendering)
          setTimeout(async () => {
            try {
              await fetch(`/api/maps/${data.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  nodes: data.nodes || [],
                  edges: data.edges || [],
                  sidebarImpressions: sidebarImpressionsData,
                  workspaceBgColor: workspaceBgColor || undefined,
                  themeName: defaultWorkspaceTheme,
                }),
              });
              console.log(`[Workspace] Saved default workspace theme: ${defaultWorkspaceTheme}`);
            } catch (error) {
              console.error("Failed to save default workspace theme:", error);
            }
          }, 100);
        } else {
          console.log(`[Workspace] No workspace theme found, using global theme`);
        }
      }

      setHydrated(true); // ✅ only now render FlowNodesProvider
    }
  }, [data, mapId]); // Added mapId dependency to ensure re-hydration on map change

  // Restore global theme when leaving workspace (on route change)
  useEffect(() => {
    // Check if we're navigating away from workspace
    const isWorkspaceRoute = pathname?.startsWith("/workspace/");
    const wasWorkspaceRoute = prevPathnameRef.current?.startsWith("/workspace/");
    
    // If we were in a workspace and now we're not, restore the global theme
    // Use a guard to prevent multiple restorations
    if (wasWorkspaceRoute && !isWorkspaceRoute && workspaceThemeAppliedRef.current && previousThemeRef.current && !isRestoringThemeRef.current) {
      isRestoringThemeRef.current = true;
      console.log(`[Workspace] Route changed away from workspace, restoring global theme: ${previousThemeRef.current}`);
      const themeToRestore = previousThemeRef.current;
      const isDark = themeToRestore === "dark";
      
      // Update HTML class IMMEDIATELY so PageLoader reads the correct mode
      document.documentElement.classList.remove("light", "dark");
      document.documentElement.classList.add(isDark ? "dark" : "light");
      console.log(`[Workspace] Updated HTML class immediately to: ${isDark ? "dark" : "light"}`);
      
      // Reset refs first to prevent re-triggering
      previousThemeRef.current = null;
      workspaceThemeAppliedRef.current = false;
      // Then restore theme (use setTimeout to avoid state update during render)
      setTimeout(() => {
        setThemeNameRef.current(themeToRestore, false);
        isRestoringThemeRef.current = false;
      }, 0);
    }
    
    // If we're entering a workspace, reset the restoration guard
    if (isWorkspaceRoute && !wasWorkspaceRoute) {
      isRestoringThemeRef.current = false;
    }
    
    prevPathnameRef.current = pathname;
  }, [pathname]); // Only watch pathname

  // Separate effect for cleanup on unmount
  useEffect(() => {
    isInWorkspaceRef.current = true;
    
    return () => {
      isInWorkspaceRef.current = false;
      // On unmount, restore the previous global theme if we applied a workspace theme
      if (workspaceThemeAppliedRef.current && previousThemeRef.current) {
        console.log(`[Workspace] Unmounting, restoring global theme: ${previousThemeRef.current}`);
        const themeToRestore = previousThemeRef.current;
        // Reset refs first to prevent re-triggering
        previousThemeRef.current = null;
        workspaceThemeAppliedRef.current = false;
        // Then restore theme
        setThemeName(themeToRestore, false);
      }
    };
  }, [mapId]); // Only run cleanup when mapId changes (entering new workspace)

  // Cleanup effect to clear store when component unmounts or mapId changes
  useEffect(() => {
    return () => {
      // Clear the store when leaving this map to prevent data leakage
      useWorkingStore.getState().setState({
        mapId: "",
        nodes: [],
        edges: [],
        sidebarImpressions: createEmptyImpressionGroups(),
        journalEntries: [],
        hydrated: false,
      });
    };
  }, [mapId]);

  if (typeof window !== "undefined") {
    window.onerror = function (msg, url, lineNo, columnNo, error) {
      document.body.innerHTML = `
        <pre style="white-space: pre-wrap; font-size: 14px;">
          ⚠️ JS Error:
          ${msg}
          At: ${url}:${lineNo}:${columnNo}
          ${error?.stack || ""}
        </pre>
      `;
      return false;
    };
  }

  if (isLoading || !data || !hydrated) {
    return (
      <PageLoader
        title="Loading workspace canvas"
        subtitle="Hydrating parts, impressions, and journal insights."
        message="Preparing your Studio view..."
      />
    );
  }
  if (error) {
    return (
      <PageLoader
        title="We hit a snag"
        subtitle="We couldn't load this workspace."
        message="Please refresh or try again shortly."
        spinnerVariant="dots"
      >
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-500 to-sky-500 shadow-[0_12px_30px_rgba(124,58,237,0.25)] hover:brightness-110 transition-all"
        >
          Try again
        </button>
      </PageLoader>
    );
  }
  // const showTour = !map;

  return (
    <FlowNodesProvider>
      {showOnboarding && <OnboardingModal />}
      {/* <TourOverlay /> */}
      <FloatingActionButtons />
      <Canvas />
      <PartDetailPanel />
      
      {/* Modals for actions */}
      <Modal show={showPartModal} onClose={() => setShowPartModal(false)}>
        <PartInput />
      </Modal>
      
      {/* Sidebar Impression Input Modal */}
      {showImpressionModal && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center px-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowImpressionModal(false);
            }
          }}
        >
          <div
            className="absolute inset-0 pointer-events-none backdrop-blur-sm"
            style={{
              backgroundColor: darkMode ? `${theme.modal}f2` : `${theme.modal}99`,
            }}
          />
          <div
            className="relative w-full max-w-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="relative overflow-hidden rounded-[28px] border shadow-[0_30px_70px_rgba(15,23,42,0.36)]"
              style={{
                backgroundColor: theme.elevated,
                borderColor: theme.border,
              }}
            >
              <div className="relative px-8 pt-8 pb-6 space-y-7">
                <div className="flex items-start justify-between gap-6">
                  <div className="space-y-3">
                    <span
                      className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.28em]"
                      style={{
                        backgroundColor: accentSoftBg,
                        color: accentTextHex,
                      }}
                    >
                      <Sparkles size={14} />
                      {impressionTypeLabel}
                    </span>
                    <div>
                      <h3
                        className="text-2xl font-semibold"
                        style={{ color: theme.textPrimary }}
                      >
                        Add a new {impressionTypeLabel.toLowerCase()} to the impressions library
                      </h3>
                      <p
                        className="mt-2 text-sm leading-relaxed"
                        style={{ color: theme.textSecondary }}
                      >
                        Give the impressions library a voice by noting what you're sensing right now.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowImpressionModal(false)}
                    className="h-10 w-10 flex items-center justify-center rounded-full border transition-colors"
                    style={{
                      borderColor: theme.border,
                      color: theme.textSecondary,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = darkMode ? `${theme.surface}66` : theme.surface;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                    aria-label="Close"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div
                  className="rounded-2xl border px-6 py-6 shadow-inner"
                  style={{
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                  }}
                >
                  <ImpressionInput
                    onTypeChange={(type) => setSidebarImpressionType(type)}
                    defaultType={sidebarImpressionType}
                    onInputChange={(value, isValid) => setCanAddImpression(isValid)}
                    addButtonRef={impressionAddRef}
                  />
                </div>

                <div className={`flex items-center justify-between gap-3 flex-wrap ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <kbd className="px-2 py-1 rounded text-[10px] font-semibold bg-white border border-slate-200 text-slate-700">
                        {isMac() ? '⇧ Tab' : 'Shift+Tab'}
                      </kbd>
                      <span className="text-xs">Previous Type</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <kbd className="px-2 py-1 rounded text-[10px] font-semibold bg-white border border-slate-200 text-slate-700">
                        Tab
                      </kbd>
                      <span className="text-xs">Next Type</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <kbd className="px-2 py-1 rounded text-[10px] font-semibold bg-white border border-slate-200 text-slate-700">
                        {isMac() ? '⏎' : 'Enter'}
                      </kbd>
                      <span className="text-xs">Submit</span>
                    </div>
                  </div>
                    <button
                      onClick={() => {
                        if (impressionAddRef.current) {
                          impressionAddRef.current.add();
                        }
                      }}
                      disabled={!canAddImpression}
                      className="px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                    style={{
                      backgroundColor: canAddImpression 
                        ? NodeBackgroundColors[sidebarImpressionType]
                        : darkMode 
                          ? theme.elevated 
                          : "#e2e8f0",
                      color: canAddImpression 
                        ? "#ffffff"
                        : darkMode
                          ? theme.textMuted
                          : "#94a3b8",
                      border: canAddImpression 
                        ? `1px solid ${NodeBackgroundColors[sidebarImpressionType]}`
                        : "none",
                      ...(darkMode ? { borderTop: canAddImpression ? undefined : "1px solid rgba(0, 0, 0, 0.15)" } : { borderTop: canAddImpression ? undefined : "1px solid #00000012" }),
                      ...(darkMode ? { boxShadow: "rgb(0 0 0 / 20%) 0px 2px 4px" } : {}),
                    }}
                    onMouseEnter={(e) => {
                      if (canAddImpression) {
                        e.currentTarget.style.opacity = "0.9";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (canAddImpression) {
                        e.currentTarget.style.opacity = "1";
                      }
                    }}
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <Modal
        show={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        width="auto"
      >
        <FeedbackForm />
      </Modal>
    </FlowNodesProvider>
  ); // now fully local + Zustand-based
}
