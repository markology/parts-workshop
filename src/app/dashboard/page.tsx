"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Map, Calendar, Trash2, Play, Clock, ChevronDown, User, Settings, Moon, Sun, LogOut, MailPlus, HelpCircle, Sparkles, Target, ArrowRight } from "lucide-react";
import { createEmptyImpressionGroups } from "@/features/workspace/state/stores/useWorkingStore";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import { useUIStore } from "@/features/workspace/state/stores/UI";
import { useThemeContext } from "@/state/context/ThemeContext";
import { useTheme } from "@/features/workspace/hooks/useTheme";
import Modal from "@/components/Modal";
import FeedbackForm from "@/components/FeedbackForm";
import StudioSparkleInput from "@/components/StudioSparkleInput";
import StudioAssistant from "@/components/StudioAssistant";
import LoadingSpinner from "@/components/LoadingSpinner";
import PageLoader from "@/components/PageLoader";
import PartsStudioLogo from "@/components/PartsStudioLogo";

interface WorkspaceData {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  lastModified: Date;
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

type SortOption = 'edited' | 'created' | 'name';

export default function WorkspacesPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { darkMode, themeName, setThemeName } = useThemeContext();
  const theme = useTheme();
  const showFeedbackModal = useUIStore((s) => s.showFeedbackModal);
  const setShowFeedbackModal = useUIStore((s) => s.setShowFeedbackModal);
  const [workspaces, setWorkspaces] = useState<WorkspaceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('edited');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [navigatingToWorkspace, setNavigatingToWorkspace] = useState<string | null>(null);
  const [profileDropdownPosition, setProfileDropdownPosition] = useState<{ top: number; right: number } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
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
        const formattedWorkspaces: WorkspaceData[] = apiWorkspaces.map((workspace: {
          id: string;
          title: string;
          description?: string;
          createdAt: string;
          lastModified: string;
          nodes?: Array<{ type: string; id: string; data?: { label?: string; image?: string } }>;
        }) => {
          // Filter to get only part nodes
          const partNodes = (workspace.nodes || []).filter((node) => node.type === 'part');
          
          return {
            id: workspace.id,
            name: workspace.title,
            description: workspace.description || undefined,
            createdAt: new Date(workspace.createdAt),
            lastModified: new Date(workspace.lastModified),
            partCount: partNodes.length,
            thumbnail: undefined,
            nodes: partNodes
          };
        });
        
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

  useEffect(() => {
    if (isSearchExpanded) {
      savedScrollY.current = window.scrollY;
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${savedScrollY.current}px`;
      document.body.style.width = '100%';
    } else {
      const scrollY = savedScrollY.current;
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      // Restore scroll position immediately without animation
      requestAnimationFrame(() => {
        document.documentElement.scrollTop = scrollY;
        document.body.scrollTop = scrollY;
      });
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
    };
  }, [isSearchExpanded]);

  useEffect(() => {
    if (!isSearchExpanded) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsSearchExpanded(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isSearchExpanded]);



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
          sidebarImpressions: createEmptyImpressionGroups()
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
    if (confirm("Are you sure you want to delete this workspace? This action cannot be undone.")) {
      try {
        const response = await fetch(`/api/maps/${workspaceId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error("Failed to delete workspace");
        }

        // Remove from local state
        setWorkspaces(prev => prev.filter(workspace => workspace.id !== workspaceId));
      } catch (err) {
        console.error("Failed to delete workspace:", err);
        alert("Failed to delete workspace. Please try again.");
      }
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric'
    });
  };

  const headerBackgroundClass = isSearchExpanded
    ? "bg-transparent supports-[backdrop-filter]:backdrop-blur-xl border-b border-transparent"
    : darkMode
      ? "bg-slate-950/80 border-b border-slate-800/60 supports-[backdrop-filter]:backdrop-blur-xl"
      : "bg-white/75 border-b border-slate-200/70 supports-[backdrop-filter]:backdrop-blur-xl shadow-[0_18px_42px_rgba(15,23,42,0.08)]";

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
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
      if (profileDropdownOpen && profileDropdownRef.current) {
        const dropdownMenu = (profileDropdownRef.current as { dropdownMenu?: HTMLElement }).dropdownMenu;
        const clickedInsideButton = profileDropdownRef.current.contains(event.target as Node);
        const clickedInsideMenu = dropdownMenu && dropdownMenu.contains(event.target as Node);
        if (!clickedInsideButton && !clickedInsideMenu) {
          setProfileDropdownOpen(false);
        }
      }
    };

    if (profileDropdownOpen || dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [profileDropdownOpen, dropdownOpen]);

  // Sort workspaces
  const sortedWorkspaces = [...workspaces].sort((a, b) => {
    if (sortBy === 'edited') {
      return b.lastModified.getTime() - a.lastModified.getTime();
    } else if (sortBy === 'created') {
      return b.createdAt.getTime() - a.createdAt.getTime();
    } else {
      return a.name.localeCompare(b.name);
    }
  });

  const totalParts = workspaces.reduce((sum, workspace) => sum + workspace.partCount, 0);
  const heroHighlights = [
    {
      icon: Map,
      label: "Visual canvases",
      description: "Plot parts and relationships on an infinite canvas.",
    },
    {
      icon: Calendar,
      label: "Reflection ready",
      description: "Log entries and export them to your journal in seconds.",
    },
    {
      icon: Clock,
      label: "Auto-saving progress",
      description: "Sessions update as you drag, drop, and edit.",
    },
    {
      icon: HelpCircle,
      label: "Assistant guidance",
      description: "Ask the Studio Assistant for prompts anytime.",
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
    <div
      className={`min-h-screen ${darkMode ? "" : "text-gray-900"}`}
      style={
        darkMode
          ? {
              // Match workspace dark theme palette
              backgroundImage:
                "linear-gradient(135deg, #454b54, #3d434b, #353b43)",
              color: theme.textPrimary,
            }
          : {
              backgroundImage:
                "linear-gradient(to bottom, #e6f8ff 0%, #dbeafe 400px, #e0e7ff calc(400px + 500px), #fef1f2 calc(400px + 1000px), #f3e8ff 100%)",
              color: theme.textPrimary,
            }
      }
    >
      <div
        className={`fixed inset-0 ${
          isSearchExpanded ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        style={{
          backgroundColor: isSearchExpanded ? 'rgba(0,0,0,0.35)' : 'transparent',
          backdropFilter: isSearchExpanded ? 'blur(2px)' : 'none',
          WebkitBackdropFilter: isSearchExpanded ? 'blur(2px)' : 'none',
          zIndex: isSearchExpanded ? 70 : 40
        }}
        onClick={() => setIsSearchExpanded(false)}
      >
        {isSearchExpanded && (
          <div className="absolute left-1/2 -translate-x-1/2 w-full max-w-md px-6" style={{ top: '20px' }} ref={searchBoxRef} onClick={(e) => e.stopPropagation()}>
            <StudioAssistant
              isOpen={isSearchExpanded}
              onClose={() => setIsSearchExpanded(false)}
              containerRef={searchBoxRef}
            />
          </div>
        )}
      </div>
      {/* Header */}
      <header
        className={`sticky top-0 z-[65] ${headerBackgroundClass}`}
        style={
          darkMode
            ? {
                backgroundColor: theme.elevated,
                borderColor: theme.border,
              }
            : undefined
        }
      >
        <div className="relative max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="inline-flex items-center" style={{ columnGap: '4px', marginLeft: '6px' }}>
              <PartsStudioLogo size="lg" showText={false} />
              <div className="flex flex-col gap-0.5">
                <span
                  className="text-lg font-semibold leading-tight"
                  style={{
                    color: darkMode ? theme.textPrimary : "#0f172a",
                  }}
                >
                  Parts Studio
                </span>
                <span
                  className="text-xs uppercase tracking-[0.28em]"
                  style={{
                    color: darkMode ? theme.textSecondary : "#64748b",
                  }}
                >
                  Dashboard
                </span>
              </div>
            </div>
          </div>

          {/* Search Input - Absolutely positioned, centered */}
          <div
            className="absolute left-1/2 -translate-x-1/2 w-full max-w-md px-6 pointer-events-none"
            style={{ zIndex: 60, top: '20px' }}
          >
            <div
              ref={searchBoxRef}
              className="relative pointer-events-auto"
            >
              {!isSearchExpanded && (
                <StudioSparkleInput
                  onClick={() => {
                    setIsSearchExpanded(true);
                  }}
                  placeholder="Ask the Studio Assistant"
                />
              )}
            </div>
          </div>

          {/* Contact Button and Profile Dropdown */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setShowFeedbackModal(true)}
              className="hidden sm:inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200"
              style={{
                background:
                  "linear-gradient(90deg, #be54fe, #6366f1, #0ea5e9)",
                color: "white",
              }}
              title="Contact"
            >
              <MailPlus className="w-4 h-4" />
              <span>Contact</span>
            </button>
            <button
              onClick={() => setShowFeedbackModal(true)}
              className="sm:hidden inline-flex items-center justify-center w-10 h-10 rounded-full transition-colors"
              style={{
                backgroundColor: darkMode ? theme.button : "#ffffff",
                color: darkMode ? theme.buttonText : "#334155",
              }}
              title="Contact"
            >
              <MailPlus className="w-5 h-5" />
            </button>

            {/* Profile Dropdown */}
            <div className="relative" ref={profileDropdownRef}>
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className={`flex items-center justify-center w-10 h-10 rounded-full border transition-all duration-200 overflow-hidden ${
                  darkMode
                    ? 'border-slate-700 bg-slate-900/80 hover:border-slate-500'
                    : 'border-slate-200 bg-white hover:border-slate-400'
                }`}
              >
                {session?.user?.image ? (
                  <Image
                    src={session.user.image}
                    alt={session.user.name || 'User'}
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                ) : (
                  <User className={`w-5 h-5 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`} />
                )}
              </button>

              {profileDropdownOpen && profileDropdownPosition && (
                <div
                  ref={(el) => {
                    if (el && profileDropdownRef.current) {
                      (profileDropdownRef.current as { dropdownMenu?: HTMLElement }).dropdownMenu = el;
                    }
                  }}
                  className="fixed rounded-lg shadow-lg z-[100]"
                  style={{
                    minWidth: "160px",
                    top: `${profileDropdownPosition.top}px`,
                    right: `${profileDropdownPosition.right}px`,
                    background: darkMode
                      ? `linear-gradient(152deg, rgb(42, 46, 50), rgb(28, 31, 35))`
                      : `linear-gradient(152deg, rgb(255, 255, 255), rgb(248, 250, 252))`,
                    borderColor: theme.border,
                    borderWidth: 1,
                    borderStyle: "solid",
                  }}
                >
                  <button
                    onClick={() => {
                      router.push('/account');
                      setProfileDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 first:rounded-t-lg ${
                      darkMode
                        ? 'hover:bg-gray-700 text-white'
                        : 'hover:bg-gray-100 text-gray-900'
                    }`}
                  >
                    <Settings className="w-4 h-4" />
                    Account
                  </button>
                  <button
                    onClick={() => {
                      const nextTheme =
                        themeName === "dark"
                          ? "light"
                          : "dark";
                      // Persist as a global site preference
                      setThemeName(nextTheme, true);
                      setProfileDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${
                      darkMode
                        ? "hover:bg-gray-700 text-white"
                        : "hover:bg-gray-100 text-gray-900"
                    }`}
                  >
                    {darkMode ? (
                      <>
                        <Sun className="w-4 h-4" />
                        Light Mode
                      </>
                    ) : (
                      <>
                        <Moon className="w-4 h-4" />
                        Dark Mode
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setShowFeedbackModal(true);
                      setProfileDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${
                      darkMode
                        ? 'hover:bg-gray-700 text-white'
                        : 'hover:bg-gray-100 text-gray-900'
                    }`}
                  >
                    <HelpCircle className="w-4 h-4" />
                    Help
                  </button>
                  <button
                    onClick={async () => {
                      await signOut({ callbackUrl: '/login' });
                      setProfileDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 last:rounded-b-lg ${
                      darkMode
                        ? 'hover:bg-gray-700 text-white'
                        : 'hover:bg-gray-100 text-gray-900'
                    }`}
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <div className={`mb-4 ${darkMode ? 'text-red-400' : 'text-red-600'}`}>{error}</div>
            <button
              onClick={() => window.location.reload()}
              className={`px-4 py-2 rounded-lg transition-colors ${
                darkMode 
                  ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
              }`}
            >
              Retry
            </button>
          </div>
        )}

        {/* Start Session Section */}
        {!loading && !error && (
          <section className="mb-12">
            <div
              className={`relative overflow-hidden rounded-[28px] border transition-all duration-300 ${
                darkMode
                  ? ""
                  : "bg-gradient-to-r from-sky-50 via-indigo-50 to-rose-50 border-slate-200 shadow-[0_35px_80px_rgba(89,81,255,0.12)]"
              }`}
              style={
                darkMode
                  ? {
                      background: `linear-gradient(152deg, rgb(42, 46, 50), rgb(28, 31, 35))`,
                      borderColor: theme.border,
                      boxShadow: "0 40px 80px rgba(15,23,42,0.7)",
                    }
                  : undefined
              }
            >
              <div
                className="absolute -top-28 -right-36 h-72 w-72 rounded-full blur-3xl"
                style={
                  darkMode
                    ? {
                        background:
                          "radial-gradient(circle at center, rgba(148,163,184,0.28), transparent 60%)",
                      }
                    : undefined
                }
              />
              <div
                className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full blur-3xl"
                style={
                  darkMode
                    ? {
                        background:
                          "radial-gradient(circle at center, rgba(51,65,85,0.4), transparent 65%)",
                      }
                    : undefined
                }
              />
              <div className="relative flex flex-col gap-12 p-8 lg:flex-row lg:items-stretch lg:justify-between lg:p-12">
                <div className="relative flex-1 space-y-6">
                  <div 
                    style={darkMode ? {
                      backgroundColor: theme.elevated,
                      color: theme.textPrimary,
                      borderColor: theme.border,
                    } : undefined}
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.3em] border ${
                      darkMode ? '' : 'bg-white/90 text-black border-white/80 shadow-sm'
                    }`}
                  >
                    <span>Self Guided Session</span>
                  </div>
                  <h2 className={`text-3xl lg:text-4xl font-semibold leading-snug ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    Begin a fresh exploration of your inner team.
                  </h2>
                  <p className={`text-sm leading-relaxed max-w-2xl ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                    Launch a new Parts Studio map to capture impressions, relationships, and breakthroughs. Your work auto-saves, so you can pause and return any time.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    {heroHighlights.map(({ icon: Icon, label, description }) => (
                      <div
                        key={label}
                        style={darkMode ? {
                          borderColor: theme.border,
                          backgroundColor: theme.card,
                        } : undefined}
                        className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${
                          darkMode ? '' : 'border-slate-200 bg-white/80 shadow-sm'
                        }`}
                      >
                        <div 
                          style={darkMode ? {
                            backgroundColor: theme.elevated,
                            color: theme.textPrimary,
                          } : undefined}
                          className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-full ${
                            darkMode ? '' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="space-y-1">
                          <p style={darkMode ? { color: theme.textPrimary } : undefined} className={`font-semibold ${darkMode ? '' : 'text-slate-900'}`}>{label}</p>
                          <p style={darkMode ? { color: theme.textSecondary } : undefined} className={darkMode ? '' : 'text-slate-600'}>{description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-2">
                    <button
                      onClick={handleStartSession}
                      className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white shadow-[0_22px_48px_rgba(190,84,254,0.28)] hover:shadow-[0_28px_60px_rgba(190,84,254,0.32)] transition-all duration-200 hover:-translate-y-[2px]"
                      style={{
                        background: "linear-gradient(to right, #be54fe, #6366f1, #0ea5e9)"
                      }}
                    >
                      <Play className="w-4 h-4" />
                      Start a fresh map
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        setIsSearchExpanded(true);
                      }}
                      style={darkMode ? {
                        color: theme.textPrimary,
                        backgroundColor: theme.button,
                        borderColor: theme.border,
                      } : undefined}
                      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                        darkMode
                          ? 'border shadow-[0_14px_32px_rgba(8,15,30,0.45)] hover:opacity-90 hover:-translate-y-px'
                          : 'text-slate-700 bg-white/85 border border-sky-200/70 shadow-[0_16px_38px_rgba(59,130,246,0.12)] hover:bg-white hover:-translate-y-px'
                      }`}
                    >
                      <Sparkles className="w-4 h-4" />
                      Ask the assistant
                    </button>
                  </div>
                </div>
                <aside className="relative lg:w-[360px] xl:w-[380px]">
                  <div 
                    style={darkMode ? {
                      backgroundColor: theme.card,
                      borderColor: theme.border,
                    } : undefined}
                    className={`relative flex h-full flex-col gap-6 overflow-hidden rounded-3xl border p-6 lg:p-7 ${
                      darkMode
                        ? 'shadow-[0_48px_120px_rgba(2,6,23,0.6)]'
                        : 'bg-white/92 border-white/70 shadow-[0_55px_120px_rgba(91,105,255,0.15)] backdrop-blur-xl'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p style={darkMode ? { color: theme.textSecondary, fontWeight: 600 } : { fontWeight: 600 }} className={`text-[11px] uppercase tracking-[0.32em] ${darkMode ? '' : 'text-black'}`}>
                          Studio snapshot
                        </p>
                        <p style={darkMode ? { color: theme.textPrimary } : undefined} className={`text-sm ${darkMode ? '' : 'text-slate-600'}`}>
                          A quick glance at your practice
                        </p>
                      </div>
                      <div 
                        style={darkMode ? {
                          backgroundColor: theme.elevated,
                          color: theme.textPrimary,
                        } : undefined}
                        className={`flex h-9 w-9 items-center justify-center rounded-2xl ${
                          darkMode ? '' : 'bg-sky-100 text-sky-600'
                        }`}
                      >
                        <Sparkles className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div 
                        style={darkMode ? {
                          borderColor: theme.border,
                          backgroundColor: theme.surface,
                        } : {
                          border: 'none',
                          borderBottom: 'solid 1px #dcdcdc1c',
                          boxShadow: '0px 1px 2px 1px #dcdcdc82 inset',
                          background: '#f7ebf352',
                        }}
                        className={`rounded-2xl px-4 py-3 ${
                          darkMode ? 'border' : ''
                        }`}
                      >
                        <p style={darkMode ? { color: theme.textSecondary, fontWeight: 500 } : { fontWeight: 500 }} className={`text-[11px] uppercase tracking-[0.28em] mb-2 ${darkMode ? '' : 'text-sky-600'}`}>Sessions</p>
                        <div className="flex items-baseline gap-1.5">
                          <p style={darkMode ? { color: theme.textPrimary } : undefined} className={`text-2xl font-semibold ${darkMode ? '' : 'text-slate-900'}`}>{workspaces.length}</p>
                          <p style={darkMode ? { color: theme.textPrimary, fontWeight: 400 } : { color: '#000000', fontWeight: 400 }} className="text-xs uppercase tracking-wider">saved</p>
                        </div>
                      </div>
                      <div 
                        style={darkMode ? {
                          borderColor: theme.border,
                          backgroundColor: theme.surface,
                        } : {
                          border: 'none',
                          borderBottom: 'solid 1px #dcdcdc1c',
                          boxShadow: '0px 1px 2px 1px #dcdcdc82 inset',
                          background: '#8e7ff812',
                        }}
                        className={`rounded-2xl px-4 py-3 ${
                          darkMode ? 'border' : ''
                        }`}
                      >
                        <p style={darkMode ? { color: theme.textSecondary, fontWeight: 500 } : { fontWeight: 500 }} className={`text-[11px] uppercase tracking-[0.28em] mb-2 ${darkMode ? '' : 'text-indigo-600'}`}>Parts</p>
                        <div className="flex items-baseline gap-1.5">
                          <p style={darkMode ? { color: theme.textPrimary } : undefined} className={`text-2xl font-semibold ${darkMode ? '' : 'text-slate-900'}`}>{totalParts}</p>
                          <p style={darkMode ? { color: theme.textPrimary, fontWeight: 400 } : { color: '#000000', fontWeight: 400 }} className="text-xs uppercase tracking-wider">mapped</p>
                        </div>
                      </div>
                    </div>
                    <div 
                      className={`rounded-2xl border ${
                        darkMode ? '' : 'border-slate-200/70 bg-white/90 shadow-inner'
                      }`}
                      style={darkMode ? {
                        borderColor: theme.border,
                        backgroundColor: theme.surface,
                        padding: '30px',
                      } : {
                        padding: '30px',
                      }}
                    >
                      <p style={darkMode ? { color: theme.textSecondary } : undefined} className={`text-[11px] uppercase tracking-[0.32em] mb-2 ${darkMode ? '' : 'text-slate-500'}`}>
                        Message from the team
                      </p>
                      <div style={darkMode ? { color: theme.textPrimary } : undefined} className={`space-y-3 text-sm leading-relaxed ${darkMode ? '' : 'text-slate-600'}`}>
                        <p>
                          Thanks for trying Parts Studio. Every session you create is saved automatically and backed up securely so you can experiment without worry.
                        </p>
                        <p>
                          We want your parts to feel safe here as we continue to try and grow this tool together.
                        </p>
                        <div className="pt-2">
                          <button
                            onClick={() => window.open('/mission', '_blank')}
                            className="arrow-pulse inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-80"
                            style={{ color: 'orange' }}
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
          </section>
        )}

        {/* Empty State */}
        {!loading && !error && workspaces.length === 0 && (
          <div className={`relative overflow-hidden rounded-[24px] border px-8 py-16 text-center ${
            darkMode ? 'border-slate-800/60 bg-slate-950/40' : 'border-slate-200 bg-white/90 shadow-[0_30px_70px_rgba(15,23,42,0.1)]'
          }`}>
            <div className={`absolute inset-10 pointer-events-none rounded-[32px] blur-2xl ${
              darkMode
                ? "bg-gradient-to-br from-purple-400/5 via-transparent to-purple-400/10"
                : "bg-gradient-to-br from-purple-400/5 via-transparent to-sky-400/10"
            }`} />
            <div className="relative flex flex-col items-center gap-4">
              <div className={`${darkMode ? 'bg-slate-900/60' : 'bg-slate-100'} p-5 rounded-full`}>
                <Map className={`w-14 h-14 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`} />
              </div>
              <h3 className={`text-2xl font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Your canvas is ready</h3>
              <p className={`${darkMode ? 'text-slate-400' : 'text-slate-600'} max-w-md`}>
                Kick off your first session to start mapping parts, impressions, and relationships. We&apos;ll keep everything saved as you go.
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
              <div className="flex flex-wrap items-baseline gap-3">
                <h2 className={`text-2xl font-semibold leading-none ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  My Workspaces
                </h2>
                <span className={`inline-flex items-center text-[11px] font-semibold ml-3.5 px-2.5 py-1 rounded-[14px] ${
                  darkMode
                    ? 'bg-white/90 text-slate-900 shadow-sm'
                    : 'bg-white text-slate-700 shadow-sm shadow-slate-200/50'
                }`}>
                  {workspaces.length} {workspaces.length === 1 ? 'session' : 'sessions'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium ${
                      darkMode ? 'text-white hover:text-slate-300' : 'text-slate-700 hover:text-slate-900'
                    }`}
                    style={darkMode 
                      ? { background: `linear-gradient(152deg, rgb(42, 46, 50), rgb(28, 31, 35))` }
                      : { backgroundColor: '#ffffff' }
                    }
                    >
                    {sortBy === 'edited' && 'Recently Edited'}
                    {sortBy === 'created' && 'Recently Created'}
                    {sortBy === 'name' && 'Name'}
                    <ChevronDown className={`w-4 h-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {dropdownOpen && (
                    <div
                      className="absolute right-0 mt-3 w-40 rounded-xl border shadow-xl overflow-hidden z-50"
                      style={darkMode 
                        ? { 
                            background: `linear-gradient(152deg, rgb(42, 46, 50), rgb(28, 31, 35))`,
                            borderColor: theme.border
                          }
                        : { backgroundColor: '#ffffff', borderColor: '#e2e8f0' }
                      }
                    >
                      {sortBy !== 'edited' && (
                        <button
                          onClick={() => {
                            setSortBy('edited');
                            setDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm transition-colors first:rounded-t-xl"
                          style={darkMode 
                            ? { color: '#ffffff' }
                            : { color: '#0f172a' }
                          }
                          onMouseEnter={(e) => {
                            if (darkMode) {
                              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                            } else {
                              e.currentTarget.style.backgroundColor = '#f1f5f9';
                            }
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          Recently Edited
                        </button>
                      )}
                      {sortBy !== 'created' && (
                        <button
                          onClick={() => {
                            setSortBy('created');
                            setDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm transition-colors"
                          style={darkMode 
                            ? { color: '#ffffff' }
                            : { color: '#0f172a' }
                          }
                          onMouseEnter={(e) => {
                            if (darkMode) {
                              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                            } else {
                              e.currentTarget.style.backgroundColor = '#f1f5f9';
                            }
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          Recently Created
                        </button>
                      )}
                      {sortBy !== 'name' && (
                        <button
                          onClick={() => {
                            setSortBy('name');
                            setDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm transition-colors last:rounded-b-xl"
                          style={darkMode 
                            ? { color: '#ffffff' }
                            : { color: '#0f172a' }
                          }
                          onMouseEnter={(e) => {
                            if (darkMode) {
                              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                            } else {
                              e.currentTarget.style.backgroundColor = '#f1f5f9';
                            }
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
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
                const lastEdited =
                  workspace.createdAt.getTime() === workspace.lastModified.getTime()
                    ? workspace.createdAt
                    : workspace.lastModified;

                return (
                  <div
                    key={workspace.id}
                    data-workspace-tile
                    className={`relative flex h-full cursor-pointer flex-col overflow-hidden rounded-3xl transition-all duration-300 ${
                      darkMode
                        ? "shadow-sm hover:shadow-sm hover:-translate-y-1"
                        : "shadow-sm shadow-slate-200/50 hover:shadow-sm hover:shadow-slate-200/50 hover:-translate-y-1"
                    } ${
                      navigatingToWorkspace === workspace.id
                        ? "opacity-60 pointer-events-none"
                        : ""
                    }`}
                    style={darkMode ? {
                      background: `linear-gradient(152deg, rgb(42, 46, 50), rgb(28, 31, 35))`,
                    } : {
                      background: `linear-gradient(152deg, rgb(237, 242, 255), rgb(230, 235, 250))`,
                    }}
                    onClick={() => handleOpenWorkspace(workspace.id)}
                    onMouseMove={(e) => {
                      const target = e.target as HTMLElement;
                      const deleteButton =
                        e.currentTarget.querySelector(
                          "[data-delete-button]"
                        ) as HTMLButtonElement;
                      // Only apply styles if not hovering over delete button
                      if (!deleteButton?.contains(target) && target !== deleteButton) {
                        const openButton =
                          e.currentTarget.querySelector(
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
                          <span 
                            style={darkMode ? {
                              background: `linear-gradient(152deg, rgb(42, 46, 50), rgb(35, 39, 43))`,
                              color: theme.textPrimary,
                              borderColor: theme.border,
                            } : undefined}
                            className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold tracking-[0.2em] uppercase border shadow-sm ${
                              darkMode ? '' : 'bg-white/90 text-slate-600 border-slate-200 shadow-slate-200/50'
                            }`}
                          >
                            Session
                          </span>
                          <h3 className={`text-xl font-semibold leading-tight line-clamp-1 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                            {workspace.name}
                          </h3>
                        </div>
                        <span className={`text-xs font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                          {formatDate(lastEdited)}
                        </span>
                      </div>
                      {workspace.description && (
                        <p className={`text-sm leading-relaxed line-clamp-2 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                          {workspace.description}
                        </p>
                      )}
                    </div>
                    <div className="relative px-6 pb-4">
                      <div 
                        style={darkMode ? {
                          borderColor: theme.border,
                          background: `linear-gradient(152deg, rgb(39, 43, 47), rgb(35, 39, 43))`,
                        } : { 
                          background: `linear-gradient(152deg, rgb(255, 255, 255), rgb(250, 252, 255))`
                        }}
                        className={`rounded-2xl border p-3 h-32 sm:h-36 ${
                          darkMode ? '' : 'border-slate-200 shadow-inner'
                        }`}
                      >
                        {workspace.nodes && workspace.nodes.length > 0 ? (
                          <div className="grid grid-cols-3 gap-2 h-full">
                            {workspace.nodes.slice(0, 6).map((node) => (
                              <div
                                key={node.id}
                                style={darkMode ? {
                                  background: `linear-gradient(152deg, rgb(42, 46, 50), rgb(35, 39, 43))`,
                                } : undefined}
                                className={`rounded-lg overflow-hidden flex items-center justify-center ${
                                  darkMode ? '' : 'bg-slate-50'
                                }`}
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
                                  <span className={`text-xs p-1 text-center truncate w-full ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                                    {node.data?.label || 'Part'}
                                  </span>
                                )}
                              </div>
                            ))}
                            {workspace.nodes.length > 6 && (
                              <div className={`rounded-lg flex items-center justify-center text-xs font-semibold ${
                                darkMode ? 'bg-slate-800/70 text-slate-200' : 'bg-slate-100 text-slate-600'
                              }`}>
                                +{workspace.nodes.length - 6}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex h-full flex-col items-center justify-center gap-2">
                            <div 
                              style={darkMode ? {
                                background: `linear-gradient(152deg, rgb(42, 46, 50), rgb(35, 39, 43))`,
                              } : undefined}
                              className={`p-3 rounded-full ${darkMode ? '' : 'bg-sky-50'}`}
                            >
                              <Map style={darkMode ? { color: theme.textMuted } : undefined} className={`w-7 h-7 ${darkMode ? '' : 'text-sky-500'}`} />
                            </div>
                            <span className={`text-xs font-medium ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                              Empty workspace
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className={`relative px-6 pb-6 pt-4 mt-auto border-t ${
                      darkMode ? 'border-slate-800/60' : 'border-slate-200'
                    }`}
                    style={darkMode ? {} : { 
                      background: `linear-gradient(152deg, rgb(255, 255, 255), rgb(250, 252, 255))`
                    }}
                    >
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <span 
                          className={`inline-flex items-center gap-2 text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}
                        >
                          <User className="w-4 h-4" />
                          <span style={darkMode ? {} : { padding: '2px 5px', background: 'rgb(237, 242, 255)', borderRadius: '6px' }}>
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
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium uppercase overflow-hidden ${
                              darkMode 
                                ? 'text-slate-200 hover:text-white border border-slate-700/60 transition-colors' 
                                : 'text-slate-700 border border-slate-200'
                            }`}
                            style={{ 
                              textTransform: 'uppercase', 
                              backgroundColor: 'transparent'
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
                                  openButton.style.backgroundColor = "transparent";
                                  openButton.style.backgroundClip = "padding-box";
                                  openButton.style.webkitBackgroundClip = "padding-box";
                                  openButton.style.color = "white";
                                  openButton.style.borderColor = "transparent";
                                }
                              }
                            }}
                            className={`inline-flex items-center justify-center rounded-full p-2 transition-colors ${
                              darkMode
                                ? "text-slate-400 hover:text-rose-200 hover:bg-rose-500/20"
                                : "text-slate-500 hover:text-rose-500 hover:bg-rose-50"
                            }`}
                            title="Delete session"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {navigatingToWorkspace === workspace.id && (
                      <div className={`absolute inset-0 flex items-center justify-center rounded-3xl ${
                        darkMode ? 'bg-slate-950/80' : 'bg-white/80'
                      }`}>
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
