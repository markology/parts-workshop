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
  Sparkles,
  Target,
  ArrowRight,
  Heart,
  User,
} from "lucide-react";
import { createEmptyImpressionGroups } from "@/features/workspace/state/stores/useWorkingStore";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { useUIStore } from "@/features/workspace/state/stores/UI";
import { useThemeContext } from "@/state/context/ThemeContext";
import { useTheme } from "@/features/workspace/hooks/useTheme";
import Modal from "@/components/Modal";
import FeedbackForm from "@/components/FeedbackForm";
import LoadingSpinner from "@/components/LoadingSpinner";
import PageLoader from "@/components/PageLoader";
import PageHeader from "@/components/PageHeader";

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
  const { data: session } = useSession();
  const { isDark, themePref, setThemePref } = useThemeContext();
  const theme = useTheme();
  const showFeedbackModal = useUIStore((s) => s.showFeedbackModal);
  const setShowFeedbackModal = useUIStore((s) => s.setShowFeedbackModal);
  const [workspaces, setWorkspaces] = useState<WorkspaceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("edited");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [navigatingToWorkspace, setNavigatingToWorkspace] = useState<
    string | null
  >(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchBoxRef = useRef<HTMLDivElement>(null);
  const savedScrollY = useRef<number>(0);

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
  const heroHighlights = [
    {
      icon: Map,
      label: "Interactive Parts Mapping",
      description:
        "Plot parts and relationships on an infinite customizable canvas",
    },
    {
      icon: Target,
      label: "Trailhead Discovery",
      description:
        "Develop your Self awareness with powerful noting meditation",
    },
    {
      icon: Heart,
      label: "Unblending Support",
      description:
        "Relieve your parts carrying the weight of your inner to-do list",
    },
    {
      icon: Sparkles,
      label: "Sitewide Companion",
      description: "Ask the Studio Assistant to help you on your journey",
    },
  ];

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
    <div className="min-h-screen text-gray-900 dark:text-white bg-gradient-to-b from-sky-50 via-indigo-50 to-rose-50 bg-[image:var(--background-gradient-dashboard)] dark:bg-[image:var(--background-gradient-dashboard)]">
      <PageHeader pageName="Dashboard" showDashboard={false} />

      {/* Start Session Section */}
      {!loading && !error && (
        <section className="w-full bg-gradient-to-r from-sky-50 via-indigo-50 to-rose-50 dark:bg-[image:var(--background-gradient)]">
          <div className="max-w-6xl mx-auto px-6">
            <div className="relative overflow-hidden">
              <div className="absolute -top-28 -right-36 h-72 w-72 rounded-full blur-3xl dark:bg-[radial-gradient(circle_at_center,rgba(148,163,184,0.28),transparent_60%)]" />
              <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full blur-3xl dark:bg-[radial-gradient(circle_at_center,rgba(51,65,85,0.4),transparent_65%)]" />
              <div className="relative flex flex-col gap-12 py-8 lg:flex-row lg:items-stretch lg:justify-between lg:py-12">
                <div className="relative flex-1 space-y-6">
                  <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.3em] border bg-white/90 dark:bg-[var(--elevated)] text-black dark:text-white border-white/80 dark:border-[var(--border)] shadow-sm">
                    <span>Self Guided Session</span>
                  </div>
                  <h2 className="text-3xl lg:text-4xl font-semibold leading-snug text-slate-900 dark:text-white">
                    Begin a fresh exploration of your inner team.
                  </h2>
                  <p className="text-sm leading-relaxed max-w-2xl text-slate-600 dark:text-slate-300">
                    Launch a new Parts Studio map to capture impressions,
                    relationships, and breakthroughs. Your work auto-saves, so
                    you can pause and return any time.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    {heroHighlights.map(
                      ({ icon: Icon, label, description }) => (
                        <div
                          key={label}
                          className="flex items-start gap-3 rounded-xl border px-4 py-3 border-slate-200 dark:border-none bg-white/80 dark:bg-[var(--component)] shadow-md"
                        >
                          <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-[var(--elevated)] text-slate-600 dark:text-white">
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="space-y-1">
                            <p className="font-semibold text-slate-900 dark:text-white">
                              {label}
                            </p>
                            <p className="text-slate-600 dark:text-slate-300">
                              {description}
                            </p>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-2">
                    <button
                      onClick={handleStartSession}
                      className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white shadow-[0_22px_48px_rgba(190,84,254,0.28)] hover:shadow-[0_28px_60px_rgba(190,84,254,0.32)] transition-all duration-200 hover:-translate-y-[2px] bg-[image:var(--button-jazz-gradient)]"
                    >
                      <Play className="w-4 h-4" />
                      Start a fresh map
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        setIsSearchExpanded(true);
                      }}
                      className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all text-slate-700 dark:text-white bg-white/85 dark:bg-[var(--component)] border border-sky-200/70 dark:border-[var(--border)] shadow-[0_16px_38px_rgba(59,130,246,0.12)] dark:shadow-[0_14px_32px_rgba(8,15,30,0.45)] hover:bg-white dark:hover:bg-[var(--button)] dark:hover:opacity-90 hover:-translate-y-px"
                    >
                      <Sparkles className="w-4 h-4" />
                      Ask the assistant
                    </button>
                  </div>
                </div>
                <aside className="relative lg:w-[360px] xl:w-[380px]">
                  <div className="relative flex h-full flex-col gap-6 overflow-hidden rounded-3xl border p-6 lg:p-7 bg-white/92 dark:bg-[var(--component)] border-white/70 dark:border-none  backdrop-blur-xl dark:shadow-[0_48px_90px_rgba(2,6,23,0.6)]">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.32em] font-semibold text-black dark:text-slate-400">
                          Studio snapshot
                        </p>
                        <p className="text-sm text-slate-600 dark:text-white">
                          A quick glance at your practice
                        </p>
                      </div>
                      <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-sky-100 dark:bg-[var(--component)] text-sky-600 dark:text-white">
                        <Sparkles className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-2xl px-4 py-3 border-none border-b border-[#dcdcdc1c] dark:border dark:border-[var(--theme-border)] dark:shadow-none bg-[#f7ebf352] dark:bg-[var(--card)]">
                        <p className="text-[11px] uppercase tracking-[0.28em] mb-2 font-medium text-sky-600 dark:text-slate-400">
                          Sessions
                        </p>
                        <div className="flex items-baseline gap-1.5">
                          <p className="text-2xl font-semibold text-slate-900 dark:text-white">
                            {workspaces.length}
                          </p>
                          <p className="text-xs uppercase tracking-wider font-normal text-black dark:text-white">
                            saved
                          </p>
                        </div>
                      </div>
                      <div className="rounded-2xl px-4 py-3 border-none border-b border-[#dcdcdc1c] dark:border dark:border-[var(--theme-border)] dark:shadow-none bg-[#8e7ff812] dark:bg-[var(--card)]">
                        <p className="text-[11px] uppercase tracking-[0.28em] mb-2 font-medium text-indigo-600 dark:text-slate-400">
                          Parts
                        </p>
                        <div className="flex items-baseline gap-1.5">
                          <p className="text-2xl font-semibold text-slate-900 dark:text-white">
                            {totalParts}
                          </p>
                          <p className="text-xs uppercase tracking-wider font-normal text-black dark:text-white">
                            mapped
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-2xl dark:border-none bg-white/90 dark:bg-[var(--card)] p-[30px]">
                      <p className="text-[11px] uppercase tracking-[0.32em] mb-2 text-slate-500 dark:text-slate-400">
                        Message from the team
                      </p>
                      <div className="space-y-3 text-sm leading-relaxed text-slate-600 dark:text-white">
                        <p className="dark:text-slate-300">
                          Thanks for trying Parts Studio. Every session you
                          create is saved automatically and backed up securely
                          so you can experiment without worry.
                        </p>
                        <p className="dark:text-slate-300">
                          We want your parts to feel safe here as we continue to
                          try and grow this tool together.
                        </p>
                        <div className="pt-2">
                          <button
                            onClick={() => router.push("/mission")}
                            className="arrow-pulse inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-80"
                            style={{ color: "orange" }}
                          >
                            <Target className="w-4 h-4" />
                            Our Mission & Roadmap
                            <ArrowRight className="arrow-icon w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="pointer-events-none absolute inset-x-10 -bottom-10 h-36 rounded-full bg-gradient-to-t from-sky-500/10 via-sky-400/0 to-transparent blur-3xl" />
                </aside>
              </div>
            </div>
          </div>
        </section>
      )}

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <div className="mb-4 text-red-600 dark:text-red-400">{error}</div>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-lg transition-colors bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white"
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
              <h3 className="text-2xl font-semibold text-slate-900 dark:text-white">
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
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex flex-wrap items-baseline gap-3 items-center">
                <h2 className="text-2xl font-semibold leading-none text-slate-900 dark:text-white">
                  My Workspaces
                </h2>
                <span className="inline-flex items-center text-[11px] font-semibold ml-3.5 px-2.5 py-1 rounded-[14px] bg-white dark:bg-white/90 text-slate-700 dark:text-slate-900 shadow-sm dark:shadow-none">
                  {workspaces.length}{" "}
                  {workspaces.length === 1 ? "session" : "sessions"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-white hover:text-slate-900 dark:hover:text-slate-300 bg-white dark:bg-[image:var(--background-gradient)]"
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
                          className="w-full text-left px-4 py-2 text-sm transition-colors first:rounded-t-xl text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10"
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
                          className="w-full text-left px-4 py-2 text-sm transition-colors text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10"
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
                          className="w-full text-left px-4 py-2 text-sm transition-colors last:rounded-b-xl text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10"
                        >
                          Name
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {sortedWorkspaces.map((workspace) => {
                // Use lastModified if available, otherwise fall back to createdAt
                const lastEdited =
                  workspace.lastModified || workspace.createdAt || null;

                return (
                  <div
                    key={workspace.id}
                    data-workspace-tile
                    className={`relative flex h-full cursor-pointer flex-col overflow-hidden rounded-3xl transition-all duration-300 shadow-sm hover:shadow-sm hover:-translate-y-1 ${
                      navigatingToWorkspace === workspace.id
                        ? "opacity-60 pointer-events-none"
                        : ""
                    } bg-[image:var(--background-gradient)] dark:bg-[image:var(--background-gradient)]`}
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
                          openButton.style.backgroundImage =
                            "linear-gradient(90deg, #be54fe, #6366f1, #0ea5e9)";
                          openButton.style.backgroundColor = "transparent";
                          openButton.style.backgroundClip = "padding-box";
                          openButton.style.webkitBackgroundClip = "padding-box";
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
                          <span className="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold tracking-[0.2em] uppercase border shadow-sm bg-white/90 text-slate-600 dark:text-white border-slate-200 dark:border-none shadow-slate-200/50 dark:shadow-none dark:bg-[var(--card)]">
                            Session
                          </span>
                          <h3 className="text-xl font-semibold leading-tight line-clamp-1 text-slate-900 dark:text-white">
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
                      <div className="rounded-2xl border p-3 h-32 sm:h-36 border-slate-200 dark:border-[var(--border)] shadow-inner dark:bg-[image:var(--background-gradient-tile)] bg-[image:var(--background-gradient-tile)]">
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
                    <div className="relative px-6 pb-6 pt-4 mt-auto border-t border-slate-200 dark:border-slate-800/60 bg-[image:var(--background-gradient-tile)] dark:bg-none">
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                          <User className="w-4 h-4" />
                          <span className="px-[5px] py-[2px] bg-[rgb(237,242,255)] dark:bg-transparent rounded-md">
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
                            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium uppercase overflow-hidden text-slate-700 dark:text-slate-200 hover:text-white border border-slate-200 dark:border-[var(--border)]/60 transition-colors"
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
                                  openButton.style.backgroundImage =
                                    "linear-gradient(90deg, #a855f7, #6366f1, #0ea5e9)";
                                  openButton.style.backgroundColor =
                                    "transparent";
                                  openButton.style.backgroundClip =
                                    "padding-box";
                                  openButton.style.webkitBackgroundClip =
                                    "padding-box";
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
