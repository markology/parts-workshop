"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Map,
  Calendar,
  Trash2,
  Play,
  Clock,
  ChevronDown,
  User,
  Target,
} from "lucide-react";
import { createEmptyImpressionGroups } from "@/features/workspace/state/stores/useWorkingStore";
import Image from "next/image";
import { useUIStore } from "@/features/workspace/state/stores/UI";
import Modal from "@/components/Modal";
import FeedbackForm from "@/components/FeedbackForm";
import LoadingSpinner from "@/components/LoadingSpinner";
import PageLoader from "@/components/PageLoader";
import PageHeader from "@/components/PageHeader";
import Banner, { type Banner as BannerType } from "@/components/Banner";

interface WorkspaceData {
  id: string;
  name: string;
  description?: string;
  createdAt: Date | null;
  lastModified: Date | null;
  partCount: number;
  thumbnail?: string;
  nodes: Array<{
    id: string;
    type: string;
    data?: {
      label?: string;
      image?: string;
    };
  }>;
}

type SortOption = "edited" | "created" | "name";

export default function WorkspacesPage() {
  const router = useRouter();
  const showFeedbackModal = useUIStore((s) => s.showFeedbackModal);
  const setShowFeedbackModal = useUIStore((s) => s.setShowFeedbackModal);
  const [workspaces, setWorkspaces] = useState<WorkspaceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("edited");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [navigatingToWorkspace, setNavigatingToWorkspace] = useState<
    string | null
  >(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dismissedBanners, setDismissedBanners] = useState<string[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Detect dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains("dark"));
    };

    checkDarkMode();
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  // Load dismissed banners from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("dismissedBanners");
    if (stored) {
      try {
        setDismissedBanners(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse dismissed banners", e);
      }
    }
  }, []);

  // Load workspaces from API
  useEffect(() => {
    const loadWorkspaces = async () => {
      try {
        const response = await fetch("/api/maps");
        if (!response.ok) {
          throw new Error("Failed to fetch workspaces");
        }
        const apiWorkspaces = await response.json();

        // Convert API workspaces to WorkspaceData format
        const formattedWorkspaces: WorkspaceData[] = apiWorkspaces.map(
          (workspace: {
            id: string;
            title: string;
            description?: string;
            createdAt: string;
            lastModified: string;
            nodes?: Array<{
              type: string;
              id: string;
              data?: { label?: string; image?: string };
            }>;
          }) => {
            // Filter to get only part nodes
            const partNodes = (workspace.nodes || []).filter(
              (node) => node.type === "part"
            );

            // Parse dates from API - only create Date objects if values exist
            const createdAt = workspace.createdAt
              ? new Date(workspace.createdAt)
              : null;
            const lastModified = workspace.lastModified
              ? new Date(workspace.lastModified)
              : null;

            // Use dates as-is if valid, otherwise use null (will be handled in display)
            const validCreatedAt =
              createdAt && !isNaN(createdAt.getTime()) ? createdAt : null;
            const validLastModified =
              lastModified && !isNaN(lastModified.getTime())
                ? lastModified
                : null;

            return {
              id: workspace.id,
              name: workspace.title,
              description: workspace.description || undefined,
              createdAt: validCreatedAt,
              lastModified: validLastModified,
              partCount: partNodes.length,
              thumbnail: undefined,
              nodes: partNodes,
            };
          }
        );

        setWorkspaces(formattedWorkspaces);
      } catch (err) {
        console.error("Failed to load workspaces:", err);
        setError("Failed to load workspaces");
      } finally {
        setLoading(false);
      }
    };

    loadWorkspaces();
  }, []);

  const handleStartSession = async () => {
    // Allow starting with or without a name

    try {
      const title = `Session ${new Date().toLocaleDateString()}`;

      const response = await fetch("/api/maps", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title,
          nodes: [],
          edges: [],
          sidebarImpressions: createEmptyImpressionGroups(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create workspace");
      }

      const newWorkspace = await response.json();

      // Navigate directly to the newly created workspace
      router.push(`/workspace/${newWorkspace.id}`);
    } catch (err) {
      console.error("Failed to create workspace:", err);
      setError("Failed to create workspace");
    }
  };

  const handleOpenWorkspace = (workspaceId: string) => {
    setNavigatingToWorkspace(workspaceId);
    router.push(`/workspace/${workspaceId}`);
  };

  const handleDeleteWorkspace = async (workspaceId: string) => {
    if (
      confirm(
        "Are you sure you want to delete this workspace? This action cannot be undone."
      )
    ) {
      try {
        const response = await fetch(`/api/maps/${workspaceId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error("Failed to delete workspace");
        }

        // Remove from local state
        setWorkspaces((prev) =>
          prev.filter((workspace) => workspace.id !== workspaceId)
        );
      } catch (err) {
        console.error("Failed to delete workspace:", err);
        alert("Failed to delete workspace. Please try again.");
      }
    }
  };

  const formatDate = (date: Date | null) => {
    // Check if date is valid
    if (!date || isNaN(date.getTime())) {
      return "";
    }
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [dropdownOpen]);

  // Sort workspaces
  const sortedWorkspaces = [...workspaces].sort((a, b) => {
    if (sortBy === "edited") {
      const aTime = a.lastModified?.getTime() ?? 0;
      const bTime = b.lastModified?.getTime() ?? 0;
      return bTime - aTime;
    } else if (sortBy === "created") {
      const aTime = a.createdAt?.getTime() ?? 0;
      const bTime = b.createdAt?.getTime() ?? 0;
      return bTime - aTime;
    } else {
      return a.name.localeCompare(b.name);
    }
  });

  const totalParts = workspaces.reduce(
    (sum, workspace) => sum + workspace.partCount,
    0
  );

  const handleDismissBanner = (bannerId: string) => {
    const updated = [...dismissedBanners, bannerId];
    setDismissedBanners(updated);
    localStorage.setItem("dismissedBanners", JSON.stringify(updated));
  };

  const allBanners: BannerType[] = [
    {
      id: "mission-page",
      message: "Check out our Mission & Roadmap to see what we're building",
      link: "/mission",
      icon: Target,
      dismissible: false,
      // backgroundColor: "#a6a6f6",
    },
  ];

  const activeBanners = allBanners.filter(
    (b) => !dismissedBanners.includes(b.id)
  );

  // FORCE LOADER FOR EDITING - Remove this line to restore normal behavior
  const forceLoading = false;

  if (loading || forceLoading) {
    return (
      <PageLoader
        title="Loading workspace library"
        subtitle="Gathering your sessions, parts, relationships, and journal insights."
      />
    );
  }

  return (
    <div
      className="min-h-screen dark:text-white bg-white dark:bg-[image:var(--background-gradient-dashboard)]"
      style={
        !isDarkMode
          ? {
              background: "white",
              color: "#6a6a6a",
            }
          : undefined
      }
    >
      <PageHeader pageName="Dashboard" showDashboard={false} />

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Banners */}
        <Banner banners={activeBanners} onDismiss={handleDismissBanner} />

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <div className="mb-4 text-red-600 dark:text-red-400">{error}</div>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-lg transition-colors bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white"
              style={!isDarkMode ? { color: "#6a6a6a" } : undefined}
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && workspaces.length === 0 && (
          <div className="relative overflow-hidden rounded-[24px] border px-8 py-16 text-center border-slate-200 dark:border-slate-800/60 bg-white/90 dark:bg-slate-950/40 shadow-[0_30px_70px_rgba(15,23,42,0.1)]">
            <div className="absolute inset-10 pointer-events-none rounded-[32px] blur-2xl bg-gradient-to-br from-purple-400/5 via-transparent to-sky-400/10 dark:to-purple-400/10" />
            <div className="relative flex flex-col items-center gap-4">
              <div className="bg-slate-100 dark:bg-slate-900/60 p-5 rounded-full">
                <Map className="w-14 h-14 text-slate-500 dark:text-slate-400" />
              </div>
              <h3
                className="text-2xl font-semibold dark:text-white"
                style={!isDarkMode ? { color: "#6a6a6a" } : undefined}
              >
                Your canvas is ready
              </h3>
              <p className="text-slate-600 dark:text-slate-400 max-w-md">
                Kick off your first session to start mapping parts, impressions,
                and relationships. We&apos;ll keep everything saved as you go.
              </p>
              <button
                onClick={handleStartSession}
                className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-purple-500 via-indigo-500 to-sky-500 shadow-[0_18px_40px_rgba(124,58,237,0.28)] hover:shadow-[0_24px_55px_rgba(124,58,237,0.32)] transition-all duration-200 hover:-translate-y-[2px]"
              >
                <Play className="w-4 h-4" />
                Start a session
              </button>
            </div>
          </div>
        )}

        {/* Workspaces Grid */}
        {!loading && !error && workspaces.length > 0 && (
          <>
            <div
              className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              style={{ marginTop: "50px" }}
            >
              <div className="flex flex-wrap items-baseline gap-3 items-center">
                <h2
                  className="text-2xl font-medium leading-none dark:text-white flex items-center"
                  style={
                    !isDarkMode
                      ? {
                          color: "black",
                        }
                      : undefined
                  }
                >
                  My Workspaces{" "}
                  <span
                    className="font-normal"
                    style={
                      !isDarkMode
                        ? {
                            color: "#939393",
                            marginTop: "3px",
                            letterSpacing: "2px",
                            marginLeft: "10px",
                            fontSize: "19px",
                          }
                        : {
                            marginTop: "3px",
                            letterSpacing: "2px",
                            marginLeft: "10px",
                            fontSize: "19px",
                          }
                    }
                  >
                    ({workspaces.length})
                  </span>
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium dark:text-white dark:hover:text-slate-300 bg-white dark:bg-[image:var(--background-gradient)]"
                    style={
                      !isDarkMode
                        ? {
                            color: "#6a6a6a",
                            background:
                              "linear-gradient(to right, rgb(255, 252, 252), rgb(255, 255, 255), rgb(254 255 255))",
                            boxShadow:
                              "rgba(170, 228, 243, 0.33) 4px 3px 6px -7px",
                            borderWidth: "1.5px 1px 1px 1.5px",
                            borderStyle: "solid",
                            borderColor:
                              "rgb(255 238 210) rgba(170, 228, 243, 0.33) rgba(170, 228, 243, 0.33) rgb(255 233 197)",
                          }
                        : undefined
                    }
                  >
                    {sortBy === "edited" && "Recently Edited"}
                    {sortBy === "created" && "Recently Created"}
                    {sortBy === "name" && "Name"}
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                  {dropdownOpen && (
                    <div className="absolute right-0 mt-3 w-40 rounded-xl border shadow-xl overflow-hidden z-50 bg-white border-slate-200 dark:border-[var(--border)] dark:bg-[image:var(--background-gradient)]">
                      {sortBy !== "edited" && (
                        <button
                          onClick={() => {
                            setSortBy("edited");
                            setDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm transition-colors first:rounded-t-xl dark:text-white hover:bg-slate-100 dark:hover:bg-white/10"
                          style={!isDarkMode ? { color: "#6a6a6a" } : undefined}
                        >
                          Recently Edited
                        </button>
                      )}
                      {sortBy !== "created" && (
                        <button
                          onClick={() => {
                            setSortBy("created");
                            setDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm transition-colors dark:text-white hover:bg-slate-100 dark:hover:bg-white/10"
                          style={!isDarkMode ? { color: "#6a6a6a" } : undefined}
                        >
                          Recently Created
                        </button>
                      )}
                      {sortBy !== "name" && (
                        <button
                          onClick={() => {
                            setSortBy("name");
                            setDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm transition-colors last:rounded-b-xl dark:text-white hover:bg-slate-100 dark:hover:bg-white/10"
                          style={!isDarkMode ? { color: "#6a6a6a" } : undefined}
                        >
                          Name
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 pb-[40px]">
              {sortedWorkspaces.map((workspace) => {
                // Use lastModified if available, otherwise fall back to createdAt
                const lastEdited =
                  workspace.lastModified || workspace.createdAt || null;

                return (
                  <div
                    key={workspace.id}
                    data-workspace-tile
                    className={`relative flex h-full cursor-pointer flex-col overflow-hidden rounded-3xl transition-all duration-300 hover:-translate-y-1 shadow-sm ${
                      navigatingToWorkspace === workspace.id
                        ? "opacity-60 pointer-events-none"
                        : ""
                    } dark:bg-[image:var(--background-gradient)]`}
                    style={
                      !isDarkMode
                        ? {
                            background:
                              "linear-gradient(354deg, rgb(243 238 253 / 94%), rgb(250 244 255 / 94%), rgb(236 240 255 / 94%))",
                            border: "none",
                          }
                        : undefined
                    }
                    onClick={() => handleOpenWorkspace(workspace.id)}
                    onMouseMove={(e) => {
                      const target = e.target as HTMLElement;
                      const deleteButton = e.currentTarget.querySelector(
                        "[data-delete-button]"
                      ) as HTMLButtonElement;
                      // Only apply styles if not hovering over delete button
                      if (
                        !deleteButton?.contains(target) &&
                        target !== deleteButton
                      ) {
                        const openButton = e.currentTarget.querySelector(
                          "[data-open-button]"
                        ) as HTMLButtonElement;
                        if (openButton) {
                          openButton.style.backgroundColor = "#253eff66";
                          openButton.style.color = "white";
                          openButton.style.borderColor = "transparent";
                        }
                      }
                    }}
                    onMouseLeave={(e) => {
                      const openButton = e.currentTarget.querySelector(
                        "[data-open-button]"
                      ) as HTMLButtonElement;
                      if (openButton) {
                        openButton.style.backgroundImage = "";
                        openButton.style.backgroundColor = "";
                        openButton.style.color = "";
                        openButton.style.borderColor = "";
                      }
                    }}
                  >
                    <div className="relative p-6 pb-4 space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-2">
                          <span
                            className="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold tracking-[0.2em] uppercase text-slate-600 dark:text-white dark:bg-[var(--card)]"
                            style={
                              !isDarkMode
                                ? {
                                    background: "white",
                                  }
                                : undefined
                            }
                          >
                            Session
                          </span>
                          <h3
                            className="text-xl font-semibold leading-tight line-clamp-1 dark:text-white"
                            style={
                              !isDarkMode ? { color: "#6a6a6a" } : undefined
                            }
                          >
                            {workspace.name}
                          </h3>
                        </div>
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                          {formatDate(lastEdited)}
                        </span>
                      </div>
                      {workspace.description && (
                        <p className="text-sm leading-relaxed line-clamp-2 text-slate-600 dark:text-slate-400">
                          {workspace.description}
                        </p>
                      )}
                    </div>
                    <div className="relative px-6 pb-4">
                      <div className="rounded-2xl border p-3 h-32 sm:h-36 border-slate-200 dark:border-[var(--border)] shadow-inner bg-white dark:bg-[image:var(--background-gradient-tile)]">
                        {workspace.nodes && workspace.nodes.length > 0 ? (
                          <div className="grid grid-cols-3 gap-2 h-full">
                            {workspace.nodes.slice(0, 6).map((node) => (
                              <div
                                key={node.id}
                                className="rounded-lg overflow-hidden flex items-center justify-center bg-slate-50 dark:bg-[var(--button)]"
                              >
                                {node.data?.image ? (
                                  <Image
                                    src={node.data.image}
                                    alt={node.data?.label || "Part"}
                                    width={50}
                                    height={50}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <span className="text-xs p-1 text-center truncate w-full text-slate-600 dark:text-slate-300">
                                    {node.data?.label || "Part"}
                                  </span>
                                )}
                              </div>
                            ))}
                            {workspace.nodes.length > 6 && (
                              <div className="rounded-lg flex items-center justify-center text-xs font-semibold bg-slate-100 dark:bg-slate-800/70 text-slate-600 dark:text-slate-200">
                                +{workspace.nodes.length - 6}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex h-full flex-col items-center justify-center gap-2">
                            <div
                              className="p-3 rounded-full bg-sky-50"
                              // style={isDark ? {
                              //   background: "linear-gradient(152deg, rgb(42, 46, 50), rgb(35, 39, 43))",
                              // } : undefined}
                            >
                              <Map className="w-7 h-7 text-sky-500 dark:text-slate-400" />
                            </div>
                            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                              Empty workspace
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div
                      className="relative px-6 pb-6 pt-4 mt-auto border-t border-slate-200 dark:border-slate-800/60 dark:bg-none"
                      style={
                        !isDarkMode
                          ? {
                              background: "white",
                            }
                          : undefined
                      }
                    >
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                          <User className="w-4 h-4" />
                          <span
                            className="px-[5px] py-[2px] dark:bg-transparent rounded-md"
                            style={
                              !isDarkMode
                                ? {
                                    background: "#ffac000a",
                                    boxShadow: "0px 1px 5px -3px #bdf8ff",
                                    borderWidth: "1.5px 1px 1px 1.5px",
                                    borderStyle: "solid",
                                    borderColor:
                                      "rgba(230, 207, 211, 0.46) rgba(170, 228, 243, 0.33) rgba(170, 228, 243, 0.33) rgba(230, 207, 211, 0.41)",
                                  }
                                : undefined
                            }
                          >
                            {workspace.partCount}
                          </span>
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            data-open-button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenWorkspace(workspace.id);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium uppercase overflow-hidden text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-[var(--border)]/60 transition-colors hover:bg-[#253eff66] hover:text-white hover:border-transparent"
                            style={{
                              textTransform: "uppercase",
                              backgroundColor: "transparent",
                            }}
                            title="Open session"
                          >
                            Open
                          </button>
                          <button
                            data-delete-button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteWorkspace(workspace.id);
                            }}
                            onMouseEnter={(e) => {
                              e.stopPropagation();
                              const tile = e.currentTarget.closest(
                                "[data-workspace-tile]"
                              ) as HTMLElement;
                              const openButton = tile?.querySelector(
                                "[data-open-button]"
                              ) as HTMLButtonElement;
                              if (openButton) {
                                openButton.style.backgroundImage = "";
                                openButton.style.backgroundColor = "";
                                openButton.style.color = "";
                                openButton.style.borderColor = "";
                              }
                            }}
                            onMouseLeave={(e) => {
                              e.stopPropagation();
                              const tile = e.currentTarget.closest(
                                "[data-workspace-tile]"
                              ) as HTMLElement;
                              const openButton = tile?.querySelector(
                                "[data-open-button]"
                              ) as HTMLButtonElement;
                              if (openButton && tile) {
                                // Reapply gradient when leaving delete button if still on tile
                                const relatedTarget =
                                  e.relatedTarget as HTMLElement;
                                if (
                                  tile.contains(relatedTarget) ||
                                  relatedTarget === tile
                                ) {
                                  openButton.style.backgroundColor =
                                    "#253eff66";
                                  openButton.style.color = "white";
                                  openButton.style.borderColor = "transparent";
                                }
                              }
                            }}
                            className="inline-flex items-center justify-center rounded-full p-2 transition-colors text-slate-500 dark:text-slate-400 hover:text-rose-500 dark:hover:text-rose-200 hover:bg-rose-50 dark:hover:bg-rose-500/20"
                            title="Delete session"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {navigatingToWorkspace === workspace.id && (
                      <div className="absolute inset-0 flex items-center justify-center rounded-3xl bg-[var(--card)]">
                        <LoadingSpinner variant="spinner" size="lg" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Feedback Modal */}
      <Modal
        show={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        width="auto"
      >
        <FeedbackForm />
      </Modal>
    </div>
  );
}
