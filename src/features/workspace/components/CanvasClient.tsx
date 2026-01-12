"use client";

import { useEffect, useState, useRef, useMemo } from "react";
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
import { ImpressionNode } from "../types/Nodes";
import { Sparkles, X } from "lucide-react";
import { useFlowNodesContext } from "../state/FlowNodesContext";
import { useThemeContext } from "@/state/context/ThemeContext";
import { useTheme } from "@/features/workspace/hooks/useTheme";
import type { ActiveTheme } from "@/features/workspace/constants/theme";
import { usePathname } from "next/navigation";
// import TourOverlay from "./TourOverlay";

// Helper to detect if user is on Mac
const isMac = () => {
  if (typeof window === "undefined") return false;
  return (
    /Mac|iPhone|iPad|iPod/.test(navigator.platform) ||
    /Mac|iPhone|iPad|iPod/.test(navigator.userAgent)
  );
};

// Function to normalize sidebarImpressions data structure
const normalizeSidebarImpressions = (sidebarImpressions: any) => {
  if (!sidebarImpressions || typeof sidebarImpressions !== "object") {
    return createEmptyImpressionGroups();
  }

  // Check if it's already in the correct format
  const expectedKeys = ["emotion", "thought", "sensation", "behavior", "other"];
  const hasExpectedKeys = expectedKeys.every(
    (key) => key in sidebarImpressions
  );

  if (hasExpectedKeys) {
    return sidebarImpressions;
  }

  // If it's an array or different structure, create empty structure
  return createEmptyImpressionGroups();
};

// Inner component to handle impression input modal with access to FlowNodesContext
const ImpressionInputModalContent = ({
  sidebarImpressionType,
  setSidebarImpressionType,
  canAddImpression,
  setCanAddImpression,
  impressionAddRef,
  impressionModalTargetPartId,
  impressionModalType,
}: {
  sidebarImpressionType: ImpressionType;
  setSidebarImpressionType: (type: ImpressionType) => void;
  canAddImpression: boolean;
  setCanAddImpression: (can: boolean) => void;
  impressionAddRef: React.RefObject<{
    add: () => void;
    isValid: boolean;
  } | null>;
  impressionModalTargetPartId?: string;
  impressionModalType?: string;
}) => {
  const theme = useTheme();
  const setShowImpressionModal = useUIStore((s) => s.setShowImpressionModal);
  const showImpressionModal = useUIStore((s) => s.showImpressionModal);
  const { updateNode } = useFlowNodesContext();
  const nodes = useWorkingStore((s) => s.nodes);

  // Get part data if target part ID is set
  const partNode = impressionModalTargetPartId
    ? nodes.find((node) => node.id === impressionModalTargetPartId)
    : null;
  const partName = partNode?.data?.name || partNode?.data?.label || "this part";

  // Determine if this is for a part or sidebar
  const isForPart = !!impressionModalTargetPartId;

  // Set initial type from modal type if provided, otherwise default to "emotion"
  const [currentType, setCurrentType] = useState<ImpressionType>(
    (impressionModalType as ImpressionType) || "emotion"
  );

  // Reset to "emotion" when modal opens unless a specific type is provided
  useEffect(() => {
    if (showImpressionModal) {
      if (impressionModalType) {
        setCurrentType(impressionModalType as ImpressionType);
      } else {
        setCurrentType("emotion");
      }
    }
  }, [impressionModalType, showImpressionModal]);

  // Reset canAddImpression when modal opens
  useEffect(() => {
    setCanAddImpression(false);
  }, [impressionModalTargetPartId, impressionModalType, setCanAddImpression]);

  const impressionTypeLabel = ImpressionTextType[currentType] ?? "Impression";

  const handleAddImpression = (impressionData: {
    id: string;
    label: string;
    type: ImpressionType;
  }) => {
    if (isForPart && impressionModalTargetPartId && partNode) {
      // Add to part
      const impressionTypeKey =
        ImpressionTextType[
          impressionData.type as keyof typeof ImpressionTextType
        ];
      const currentImpressions =
        (partNode.data[impressionTypeKey] as ImpressionNode[]) || [];
      const newImpression: ImpressionNode = {
        id: impressionData.id,
        type: impressionData.type,
        data: {
          label: impressionData.label,
          addedAt: Date.now(),
        },
        position: { x: 0, y: 0 },
      };

      updateNode(impressionModalTargetPartId, {
        data: {
          ...partNode.data,
          [impressionTypeKey]: [...currentImpressions, newImpression],
        },
      });
    } else {
      // Add to sidebar (default behavior)
      useWorkingStore.getState().addImpression(impressionData);
    }
  };

  const handleTypeChange = (type: ImpressionType) => {
    setCurrentType(type);
    if (!isForPart) {
      setSidebarImpressionType(type);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center px-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setShowImpressionModal(false);
        }
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none backdrop-blur-sm  theme-dark:bg-[var(--theme-modal-bg)]
  theme-light:bg-[var(--theme-modal-bg)]"
      />
      <div
        className="relative w-full max-w-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="relative overflow-hidden rounded-[28px] border shadow-[0_30px_70px_rgba(15,23,42,0.36)] border-[var(--theme-border)]"
          style={{
            backgroundColor: `var(--theme-impression-${currentType}-modal-bg)`,
          }}
        >
          <div className="relative px-8 pt-8 pb-6 space-y-7">
            <div className="flex items-start justify-between gap-6">
              <div className="space-y-3">
                <span
                  className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.28em] theme-dark:pl-0"
                  style={{
                    backgroundColor: `var(--theme-impression-${currentType}-modal-pill-bg)`,
                    color: `var(--theme-impression-${currentType}-modal-pill-font)`,
                  }}
                >
                  <Sparkles size={14} />
                  {impressionTypeLabel}
                </span>
                <div>
                  <h3 className="text-2xl font-semibold text-[var(--theme-text-primary)] truncate">
                    {isForPart ? (
                      <>
                        Add a new {impressionTypeLabel.toLowerCase()} to{" "}
                        <span className="theme-light:bg-[#fefefe80] theme-dark:bg-[rgba(0,0,0,0.14)] py-[4px] px-[10px] rounded-[10px]">
                          {String(partName)}
                        </span>{" "}
                        part
                      </>
                    ) : (
                      `Add a new ${impressionTypeLabel.toLowerCase()} to the impressions library`
                    )}
                  </h3>
                  <p
                    className="mt-2 text-sm leading-relaxed"
                    style={{ color: theme.textSecondary }}
                  >
                    {isForPart
                      ? `Give ${partName} a voice by noting what you're sensing right now.`
                      : `Give the impressions library a voice by noting what you're sensing right now.`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowImpressionModal(false)}
                className="h-10 w-10 flex items-center justify-center rounded-full shadow-sm theme-dark:shadow-none"
                style={{
                  backgroundColor: `var(--theme-impression-${currentType}-modal-pill-bg)`,
                  color: `var(--theme-impression-${currentType}-modal-pill-font)`,
                }}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div
              className="rounded-2xl border px-6 py-6 shadow-inner"
              style={{
                backgroundColor: `var(--theme-impression-modal-input-container-bg)`,
                borderColor: theme.border,
              }}
            >
              <ImpressionInput
                onAddImpression={isForPart ? handleAddImpression : undefined}
                onTypeChange={handleTypeChange}
                defaultType={currentType}
                onInputChange={(value, isValid) => setCanAddImpression(isValid)}
                addButtonRef={impressionAddRef}
              />
            </div>

            <div className="flex items-center justify-between gap-3 flex-wrap theme-dark:text-slate-400 theme-light:text-slate-500">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <kbd className="px-2 py-1 rounded text-[10px] font-semibold shadow-sm theme-dark:text-slate-200 theme-light:text-slate-700 bg-[var(--theme-impression-modal-keyboard-bg)]">
                    {isMac() ? "⇧ Tab" : "Shift+Tab"}
                  </kbd>
                  <span className="text-xs">Previous Type</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <kbd className="px-2 py-1 rounded text-[10px] font-semibold shadow-sm theme-dark:text-slate-200 theme-light:text-slate-700 bg-[var(--theme-impression-modal-keyboard-bg)]">
                    Tab
                  </kbd>
                  <span className="text-xs">Next Type</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <kbd className="px-2 py-1 rounded text-[10px] font-semibold shadow-sm theme-dark:text-slate-200 theme-light:text-slate-700 bg-[var(--theme-impression-modal-keyboard-bg)]">
                    {isMac() ? "⏎" : "Enter"}
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
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-75 disabled:opacity-40 disabled:cursor-not-allowed border-none
                  ${
                    canAddImpression
                      ? "text-white"
                      : "text-[#94a3b8] theme-dark:bg-[rgb(59,63,67)] theme-light:bg-[#e2e8f0] theme-dark:shadow-[rgb(0_0_0/20%)_0px_2px_4px]"
                  }`}
                style={{
                  ...(canAddImpression && {
                    backgroundColor: `var(--theme-impression-${currentType}-modal-add-button-bg)`,
                  }),
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
  );
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
  const [profileDropdownPosition, setProfileDropdownPosition] = useState<{
    top: number;
    right: number;
  } | null>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // Use individual selectors - Zustand handles this efficiently with shallow comparison
  const showPartModal = useUIStore((s) => s.showPartModal);
  const setShowPartModal = useUIStore((s) => s.setShowPartModal);
  const showImpressionModal = useUIStore((s) => s.showImpressionModal);
  const setShowImpressionModal = useUIStore((s) => s.setShowImpressionModal);
  const impressionModalTargetPartId = useUIStore(
    (s) => s.impressionModalTargetPartId
  );
  const impressionModalType = useUIStore((s) => s.impressionModalType);
  const showFeedbackModal = useUIStore((s) => s.showFeedbackModal);
  const setShowFeedbackModal = useUIStore((s) => s.setShowFeedbackModal);
  const { activeTheme, setActiveTheme, isDark } = useThemeContext();
  const theme = useTheme();
  const pathname = usePathname();
  const [sidebarImpressionType, setSidebarImpressionType] =
    useState<ImpressionType>("emotion");
  const [canAddImpression, setCanAddImpression] = useState(false);
  const impressionAddRef = useRef<{ add: () => void; isValid: boolean } | null>(
    null
  );
  const previousActiveThemeRef = useRef<ActiveTheme | null>(null);
  const workspaceThemeAppliedRef = useRef(false);
  const lastAppliedMapIdRef = useRef<string | null>(null);
  const isInWorkspaceRef = useRef(true);
  const prevPathnameRef = useRef<string | null>(null);
  const isRestoringThemeRef = useRef(false);
  const setActiveThemeRef = useRef(setActiveTheme);

  // Keep refs updated
  useEffect(() => {
    setActiveThemeRef.current = setActiveTheme;
  }, [setActiveTheme]);

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

  // Update dropdown position when it opens
  useEffect(() => {
    if (profileDropdownOpen && profileDropdownRef.current) {
      const rect = profileDropdownRef.current.getBoundingClientRect();
      setProfileDropdownPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    } else {
      setProfileDropdownPosition(null);
    }
  }, [profileDropdownOpen]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target as Node)
      ) {
        setProfileDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (data && typeof data === "object" && "id" in data) {
      const normalizedSidebarImpressions = normalizeSidebarImpressions(
        data.sidebarImpressions
      );

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
      // Get workspace activeTheme from metadata
      const mapActiveTheme = metadata?.activeTheme as ActiveTheme | undefined;

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

      // Only apply workspace theme on initial load (when mapId changes)
      const isNewMap = lastAppliedMapIdRef.current !== data.id;

      if (isNewMap) {
        // Store the current global activeTheme before applying workspace theme (reset for each new map)
        // Get the actual global activeTheme from localStorage
        const globalActiveTheme = localStorage.getItem(
          "activeTheme"
        ) as ActiveTheme | null;
        previousActiveThemeRef.current =
          globalActiveTheme || (isDark ? "dark" : "light");

        // Reset the applied flag for new map
        workspaceThemeAppliedRef.current = false;
        lastAppliedMapIdRef.current = data.id;

        // Determine workspace activeTheme to use
        let workspaceThemeToUse: ActiveTheme;

        if (
          mapActiveTheme &&
          ["light", "dark", "cherry"].includes(mapActiveTheme)
        ) {
          // Use saved workspace theme
          workspaceThemeToUse = mapActiveTheme;
          console.log(
            `[CanvasClient] Using saved workspace theme: ${workspaceThemeToUse}`
          );
        } else {
          // New workspace: default to current mode (light or dark)
          workspaceThemeToUse = isDark ? "dark" : "light";
          // Save this default to the map
          const sidebarImpressionsData = {
            ...normalizedSidebarImpressions,
            _metadata: {
              ...(typeof normalizedSidebarImpressions === "object" &&
              "_metadata" in normalizedSidebarImpressions
                ? (normalizedSidebarImpressions as any)._metadata
                : {}),
              workspaceBgColor: workspaceBgColor || undefined,
              activeTheme: workspaceThemeToUse,
            },
          };

          // Save asynchronously (don't block rendering)
          setTimeout(async () => {
            try {
              const savePayload = {
                nodes: data.nodes || [],
                edges: data.edges || [],
                sidebarImpressions: sidebarImpressionsData,
                workspaceBgColor: workspaceBgColor || undefined,
                activeTheme: workspaceThemeToUse,
              };
              console.log(
                `[CanvasClient] Saving default workspace theme:`,
                savePayload
              );
              const response = await fetch(`/api/maps/${data.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(savePayload),
              });
              const result = await response.json();
              console.log(`[CanvasClient] Default workspace theme saved:`, {
                workspaceThemeToUse,
                result,
              });
            } catch (error) {
              console.error(
                "[CanvasClient] Failed to save default workspace theme:",
                error
              );
            }
          }, 100);
        }

        // Apply workspace activeTheme (do NOT persist as global)
        console.log(`[CanvasClient] Applying workspace theme:`, {
          workspaceThemeToUse,
          mapId: data.id,
          currentActiveTheme: activeTheme,
        });
        setActiveTheme(workspaceThemeToUse, false);
        workspaceThemeAppliedRef.current = true;
      } else {
        console.log(`[CanvasClient] Skipping theme apply (not a new map)`);
      }

      setHydrated(true); // ✅ only now render FlowNodesProvider
    }
  }, [data, mapId]); // Added mapId dependency to ensure re-hydration on map change

  // Restore global variant when leaving workspace (on route change)
  useEffect(() => {
    // Check if we're navigating away from workspace
    const isWorkspaceRoute = pathname?.startsWith("/workspace/");
    const wasWorkspaceRoute =
      prevPathnameRef.current?.startsWith("/workspace/");

    // If we were in a workspace and now we're not, restore the global theme
    // Use a guard to prevent multiple restorations
    if (
      wasWorkspaceRoute &&
      !isWorkspaceRoute &&
      workspaceThemeAppliedRef.current &&
      previousActiveThemeRef.current &&
      !isRestoringThemeRef.current
    ) {
      isRestoringThemeRef.current = true;
      const themeToRestore =
        previousActiveThemeRef.current || (isDark ? "dark" : "light");
      console.log(
        `[Workspace] Route changed away from workspace, restoring global activeTheme: ${themeToRestore}`
      );

      // Reset refs first to prevent re-triggering
      previousActiveThemeRef.current = null;
      workspaceThemeAppliedRef.current = false;
      lastAppliedMapIdRef.current = null;
      // Then restore activeTheme (use setTimeout to avoid state update during render)
      setTimeout(() => {
        setActiveThemeRef.current(themeToRestore, false);
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
      // On unmount, restore the previous global activeTheme if we applied a workspace theme
      // Only restore if we're actually leaving (check pathname)
      const isStillInWorkspace =
        typeof window !== "undefined" &&
        window.location.pathname?.startsWith("/workspace/");
      if (
        !isStillInWorkspace &&
        workspaceThemeAppliedRef.current &&
        previousActiveThemeRef.current
      ) {
        const themeToRestore = previousActiveThemeRef.current;
        console.log(
          `[CanvasClient] Unmounting, restoring global activeTheme: ${themeToRestore}`
        );
        // Reset refs first to prevent re-triggering
        previousActiveThemeRef.current = null;
        workspaceThemeAppliedRef.current = false;
        lastAppliedMapIdRef.current = null;
        // Then restore activeTheme
        setActiveThemeRef.current(themeToRestore, false);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run cleanup on actual component unmount

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
        <ImpressionInputModalContent
          sidebarImpressionType={sidebarImpressionType}
          setSidebarImpressionType={setSidebarImpressionType}
          canAddImpression={canAddImpression}
          setCanAddImpression={setCanAddImpression}
          impressionAddRef={impressionAddRef}
          impressionModalTargetPartId={impressionModalTargetPartId}
          impressionModalType={impressionModalType}
        />
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
