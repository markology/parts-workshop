"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Map, Calendar, Trash2, Play, Clock, ArrowUpDown, ChevronDown, User, Settings, Moon, Sun, LogOut, Loader2, MailPlus, HelpCircle, Sparkles } from "lucide-react";
import { createEmptyImpressionGroups } from "@/features/workspace/state/stores/useWorkingStore";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import { useUIStore } from "@/features/workspace/state/stores/UI";
import { useThemeContext } from "@/state/context/ThemeContext";
import Modal from "@/components/Modal";
import FeedbackForm from "@/components/FeedbackForm";
import StudioSparkleInput from "@/components/StudioSparkleInput";
import LoadingSpinner from "@/components/LoadingSpinner";
import PageLoader from "@/components/PageLoader";

interface PartNode {
  id: string;
  data: {
    label: string;
    image?: string;
  };
}

interface WorkspaceData {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  lastModified: Date;
  partCount: number;
  thumbnail?: string;
  nodes: any[];
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}


type SortOption = 'edited' | 'created' | 'name';

export default function WorkspacesPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { darkMode, toggleDarkMode } = useThemeContext();
  const showFeedbackModal = useUIStore((s) => s.showFeedbackModal);
  const setShowFeedbackModal = useUIStore((s) => s.setShowFeedbackModal);
  const [workspaces, setWorkspaces] = useState<WorkspaceData[]>([]);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('edited');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "assistant-initial",
      role: "assistant",
      content: "Hi! I'm here to help you navigate Parts Studio. Ask me anything."
    }
  ]);
  const [isChatSending, setIsChatSending] = useState(false);
  const [navigatingToWorkspace, setNavigatingToWorkspace] = useState<string | null>(null);
  const [profileDropdownPosition, setProfileDropdownPosition] = useState<{ top: number; right: number } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const searchBoxRef = useRef<HTMLDivElement>(null);
  const expandedInputRef = useRef<HTMLTextAreaElement>(null);
  const chatMessagesEndRef = useRef<HTMLDivElement>(null);

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
        const formattedWorkspaces: WorkspaceData[] = apiWorkspaces.map((workspace: any) => {
          // Filter to get only part nodes
          const partNodes = (workspace.nodes || []).filter((node: any) => node.type === 'part');
          
          return {
            id: workspace.id,
            name: workspace.title,
            description: workspace.description || undefined,
            createdAt: new Date(workspace.createdAt),
            lastModified: new Date(workspace.updatedAt),
            partCount: partNodes.length,
            thumbnail: workspace.thumbnail || undefined,
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
    if (!isSearchExpanded) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(event.target as Node)) {
        setIsSearchExpanded(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsSearchExpanded(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isSearchExpanded]);

  useEffect(() => {
    if (!isSearchExpanded) {
      return;
    }

    requestAnimationFrame(() => {
      chatMessagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    });
  }, [chatMessages, isSearchExpanded]);

  const handleSendChat = async () => {
    const trimmedMessage = searchInput.trim();
    if (!trimmedMessage || isChatSending) {
      return;
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmedMessage
    };

    const assistantMessageId = `assistant-${Date.now()}-${Math.random().toString(16).slice(2)}`;

    setChatMessages(prev => [
      ...prev,
      userMessage,
      {
        id: assistantMessageId,
        role: "assistant",
        content: ""
      }
    ]);

    setSearchInput("");
    setIsChatSending(true);

    try {
      const response = await fetch("/api/ai/ifs-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          userMessage: trimmedMessage
        })
      });

      if (!response.ok) {
        throw new Error("Failed to reach assistant");
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body");
      }

      const decoder = new TextDecoder();
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        fullContent += decoder.decode(value, { stream: true });

        const content = fullContent;
        setChatMessages(prev =>
          prev.map(message =>
            message.id === assistantMessageId ? { ...message, content } : message
          )
        );
      }

      setChatMessages(prev =>
        prev.map(message =>
          message.id === assistantMessageId ? { ...message, content: fullContent } : message
        )
      );
    } catch (error) {
      console.error("Chat error:", error);
      setChatMessages(prev =>
        prev.map(message =>
          message.id === assistantMessageId
            ? {
                ...message,
                content:
                  "I'm sorry, I'm having trouble responding right now. Please try again in a moment."
              }
            : message
        )
      );
    } finally {
      setIsChatSending(false);
    }
  };

  const handleStartSession = async () => {
    // Allow starting with or without a name

    try {
      const title = newWorkspaceName.trim() || `Session ${new Date().toLocaleDateString()}`;
      
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
    ? 'bg-transparent supports-[backdrop-filter]:backdrop-blur-xl border-b border-transparent'
    : darkMode
      ? 'bg-slate-950/80 border-b border-slate-800/60 supports-[backdrop-filter]:backdrop-blur-xl'
      : 'bg-white/75 border-b border-slate-200/70 supports-[backdrop-filter]:backdrop-blur-xl shadow-[0_18px_42px_rgba(15,23,42,0.08)]';

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
        const dropdownMenu = (profileDropdownRef.current as any).dropdownMenu;
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
  const recentlyEditedWorkspace = sortedWorkspaces[0];
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
        message="Preparing your Studio overview..."
      />
    );
  }

  return (
    <div className={`min-h-screen ${darkMode 
      ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white' 
      : 'bg-[#e6f8ff] text-gray-900'
    }`}>
      <div
        className={`fixed inset-0 pointer-events-none transition-opacity duration-300 ${
          isSearchExpanded ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          backgroundColor: isSearchExpanded ? 'rgba(0,0,0,0.35)' : 'transparent',
          backdropFilter: isSearchExpanded ? 'blur(2px)' : 'none',
          WebkitBackdropFilter: isSearchExpanded ? 'blur(2px)' : 'none',
          zIndex: 40
        }}
      />
      {/* Header */}
      <header
        className={`sticky top-0 z-[65] transition-[background-color,backdrop-filter] duration-300 ${headerBackgroundClass}`}
      >
        <div className="relative max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="inline-flex flex-col">
              <span className={`text-xs uppercase tracking-[0.28em] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Parts Studio
              </span>
              <span className={`text-2xl font-semibold leading-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                Workspace Library
              </span>
            </Link>
          </div>

          {/* Search Input - Absolutely positioned, centered */}
          <div className="absolute left-1/2 -translate-x-1/2 top-4 w-full max-w-md px-6 pointer-events-none" style={{ zIndex: 60 }}>
            <div
              ref={searchBoxRef}
              className={`relative pointer-events-auto transition-all duration-300 ease-out border-none ${
                isSearchExpanded
                  ? 'h-[60vh] h-auto max-h-[600px] rounded-3xl overflow-hidden border flex flex-col bg-white border-gray-200 shadow-[0_18px_35px_rgba(105,99,255,0.18)]'
                  : ''
              }`}
            >
              {isSearchExpanded ? (
   <div
//    ref={searchBoxRef}
//    className="fixed w-[320px] pointer-events-auto z-[80]"
   style={{
    //  top: `${chatboxPosition.top}px`,
    //  left: `${chatboxPosition.left}px`
   }}
 >
   <div className="relative w-full h-[60vh] max-h-[600px] rounded-3xl overflow-hidden border flex flex-col bg-white border-gray-200 shadow-[0_18px_35px_rgba(105,99,255,0.18)]">
     <button
    //    onClick={handleSearchClose}
       className={`absolute top-2 right-2 p-1.5 rounded-lg transition-colors z-10 ${
         darkMode
           ? "hover:bg-gray-700 text-gray-400 hover:text-white"
           : "hover:bg-gray-100 text-gray-500 hover:text-gray-900"
       }`}
     >
       <X className="w-4 h-4" />
     </button>

     <div className="flex-1 px-6 pt-6 pb-4 flex flex-col min-h-0">
       <div>
         <p className={`text-[11px] tracking-[0.32em] uppercase ${darkMode ? "text-purple-500/80" : "text-purple-500/70"}`}>
           Studio Assistant
         </p>
         <p className={`mt-3 text-sm leading-relaxed ${darkMode ? "text-gray-600" : "text-gray-500"}`}>
           Ask for guidance, shortcuts, or reflections tailored to your Parts Studio flow.
         </p>
       </div>

       <div className="mt-5 space-y-3 flex-1 overflow-y-auto pr-1 min-h-0">
         {chatMessages.map((message) => (
           <div
             key={message.id}
             className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
           >
             <div
               className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                 message.role === "user"
                   ? "bg-purple-500 text-white"
                   : "bg-gray-100 text-gray-800 border border-gray-200"
               }`}
             >
               {message.content.trim().length > 0 ? message.content : "..."}
             </div>
           </div>
         ))}
         <div ref={chatMessagesEndRef} />
       </div>
     </div>

     <div className="px-6 pb-6 border-t border-gray-100 bg-gray-50/80">
       <div className="relative">
         <textarea
           ref={expandedInputRef}
           autoFocus
           value={searchInput}
           onChange={(e) => setSearchInput(e.target.value)}
           onKeyDown={(e) => {
             if (e.key === "Escape") {
               e.preventDefault();
            //    handleSearchClose();
             } else if (e.key === "Enter" && !e.shiftKey) {
               e.preventDefault();
               handleSendChat();
             }
           }}
           placeholder="Ask me anything..."
           className="w-full min-h-[56px] resize-none rounded-xl px-5 py-2 text-sm leading-5 focus:outline-none focus:ring-2 focus:ring-purple-400/60 focus:border-transparent bg-white border border-gray-200 text-gray-900 placeholder-gray-400"
         />
       </div>
     </div>
   </div>
 </div>
              ) : (
                <StudioSparkleInput
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onFocus={() => setIsSearchExpanded(true)}
                  onClick={() => setIsSearchExpanded(true)}
                  placeholder="Ask the Studio Assistant"
                />
              )}
            </div>
          </div>

          {/* Contact Button and Profile Dropdown */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setShowFeedbackModal(true)}
              className={`hidden sm:inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
                darkMode
                  ? 'bg-gradient-to-r from-purple-500/70 to-sky-500/70 text-white hover:from-purple-500 hover:to-sky-500'
                  : 'bg-gradient-to-r from-purple-500 to-sky-500 text-white hover:brightness-110'
              }`}
              title="Contact"
            >
              <MailPlus className="w-4 h-4" />
              <span>Contact</span>
            </button>
            <button
              onClick={() => setShowFeedbackModal(true)}
              className={`sm:hidden inline-flex items-center justify-center w-10 h-10 rounded-full transition-colors ${
                darkMode
                  ? 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                  : 'bg-white text-slate-700 hover:bg-slate-100'
              }`}
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
                      (profileDropdownRef.current as any).dropdownMenu = el;
                    }
                  }}
                  className={`fixed rounded-lg shadow-lg z-[100] ${
                    darkMode
                      ? 'bg-gray-800 border border-gray-700'
                      : 'bg-white border border-gray-200'
                  }`}
                  style={{
                    minWidth: '160px',
                    top: `${profileDropdownPosition.top}px`,
                    right: `${profileDropdownPosition.right}px`
                  }}
                >
                  <button
                    onClick={() => {
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
                      toggleDarkMode(!darkMode);
                      setProfileDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${
                      darkMode
                        ? 'hover:bg-gray-700 text-white'
                        : 'hover:bg-gray-100 text-gray-900'
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
            <div className={`relative overflow-hidden rounded-[28px] border transition-all duration-300 ${
              darkMode
                ? 'bg-gradient-to-r from-slate-950 via-slate-900/80 to-slate-900/40 border-slate-800/60 shadow-[0_40px_80px_rgba(2,6,23,0.55)]'
                : 'bg-gradient-to-r from-sky-50 via-indigo-50 to-rose-50 border-slate-200 shadow-[0_35px_80px_rgba(89,81,255,0.12)]'
            }`}>
              <div className="absolute -top-28 -right-36 h-72 w-72 rounded-full bg-gradient-to-br from-purple-400/30 via-sky-400/20 to-transparent blur-3xl" />
              <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-gradient-to-tr from-sky-500/30 via-emerald-400/20 to-transparent blur-3xl" />
              <div className="relative grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] items-start p-8 lg:p-12">
                <div className="space-y-6">
                  <div className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.3em] ${
                    darkMode ? 'bg-slate-900/85 text-slate-200 border border-slate-800/70' : 'bg-white/90 text-slate-600 border border-white/80 shadow-sm'
                  }`}>
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
                        className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${
                          darkMode ? 'border-slate-800/70 bg-slate-900/50' : 'border-slate-200 bg-white/80 shadow-sm'
                        }`}
                      >
                        <div className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-full ${
                          darkMode ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-600'
                        }`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="space-y-1">
                          <p className={`font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{label}</p>
                          <p className={`${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>{description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-2">
                    <button
                      onClick={handleStartSession}
                      className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-purple-500 via-indigo-500 to-sky-500 shadow-[0_22px_48px_rgba(124,58,237,0.28)] hover:shadow-[0_28px_60px_rgba(124,58,237,0.32)] transition-all duration-200 hover:-translate-y-[2px]"
                    >
                      <Play className="w-4 h-4" />
                      Start a fresh map
                    </button>
                    <button
                      onClick={() => setIsSearchExpanded(true)}
                      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                        darkMode
                          ? 'text-slate-200 border border-slate-700 hover:bg-slate-800/70'
                          : 'text-slate-700 border border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      <HelpCircle className="w-4 h-4" />
                      Ask the assistant
                    </button>
                  </div>
                </div>
                <div className="relative">
                  <div className={`rounded-2xl border p-6 lg:p-7 space-y-5 ${
                    darkMode ? 'bg-slate-950/50 border-slate-800/60' : 'bg-white/90 border-slate-200 shadow-xl'
                  }`}>
                    <div className="grid grid-cols-2 gap-4">
                      <div className={`rounded-xl border px-4 py-3 ${
                        darkMode ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-slate-50/70'
                      }`}>
                        <p className={`text-xs uppercase tracking-[0.28em] mb-2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Sessions</p>
                        <p className={`text-2xl font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{workspaces.length}</p>
                        <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Saved journeys</p>
                      </div>
                      <div className={`rounded-xl border px-4 py-3 ${
                        darkMode ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-slate-50/70'
                      }`}>
                        <p className={`text-xs uppercase tracking-[0.28em] mb-2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Parts</p>
                        <p className={`text-2xl font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{totalParts}</p>
                        <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Mapped across sessions</p>
                      </div>
                    </div>
                    <div className={`rounded-xl border px-4 py-4 ${
                      darkMode ? 'border-slate-800 bg-slate-900/45' : 'border-slate-200 bg-slate-50/80'
                    }`}>
                      <p className={`text-xs uppercase tracking-[0.28em] mb-2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Latest activity</p>
                      {recentlyEditedWorkspace ? (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-2">
                            <p className={`font-semibold text-sm ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                              {recentlyEditedWorkspace.name}
                            </p>
                            <span className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                              {formatDate(
                                recentlyEditedWorkspace.createdAt.getTime() === recentlyEditedWorkspace.lastModified.getTime()
                                  ? recentlyEditedWorkspace.createdAt
                                  : recentlyEditedWorkspace.lastModified
                              )}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {recentlyEditedWorkspace.nodes.slice(0, 3).map((node: any) => (
                              <span
                                key={node.id}
                                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                                  darkMode ? 'bg-slate-800/80 text-slate-200' : 'bg-white text-slate-600 shadow-sm'
                                }`}
                              >
                                {node.data?.label || 'Part'}
                              </span>
                            ))}
                            {recentlyEditedWorkspace.nodes.length > 3 && (
                              <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                                darkMode ? 'bg-slate-800/80 text-slate-200' : 'bg-white text-slate-600 shadow-sm'
                              }`}>
                                +{recentlyEditedWorkspace.nodes.length - 3}
                              </span>
                            )}
                            {recentlyEditedWorkspace.nodes.length === 0 && (
                              <span className={`text-xs italic ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                No parts added yet
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                          Your next mapped journey will appear here once you create a session.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Empty State */}
        {!loading && !error && workspaces.length === 0 && (
          <div className={`relative overflow-hidden rounded-[24px] border px-8 py-16 text-center ${
            darkMode ? 'border-slate-800/60 bg-slate-950/40' : 'border-slate-200 bg-white/90 shadow-[0_30px_70px_rgba(15,23,42,0.1)]'
          }`}>
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-purple-400/10 via-transparent to-sky-400/20" />
            <div className="relative flex flex-col items-center gap-4">
              <div className={`${darkMode ? 'bg-slate-900/60' : 'bg-slate-100'} p-5 rounded-full`}>
                <Map className={`w-14 h-14 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`} />
              </div>
              <h3 className={`text-2xl font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Your canvas is ready</h3>
              <p className={`${darkMode ? 'text-slate-400' : 'text-slate-600'} max-w-md`}>
                Kick off your first session to start mapping parts, impressions, and relationships. We'll keep everything saved as you go.
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
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold ${
                  darkMode ? 'bg-slate-900/60 text-slate-200 border border-slate-800/60' : 'bg-white text-slate-600 border border-slate-200 shadow-sm'
                }`}>
                  <Clock className="w-3.5 h-3.5" />
                  {workspaces.length} {workspaces.length === 1 ? 'session' : 'sessions'}
                </span>
                <span className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold ${
                  darkMode ? 'bg-slate-900/60 text-slate-200 border border-slate-800/60' : 'bg-white text-slate-600 border border-slate-200 shadow-sm'
                }`}>
                  <Map className="w-3.5 h-3.5" />
                  {totalParts} {totalParts === 1 ? 'part' : 'parts'} catalogued
                </span>
              </div>
              <div className="flex items-center gap-2">
                <ArrowUpDown className={`w-4 h-4 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`} />
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium ${
                      darkMode ? 'border-slate-700 text-white hover:border-slate-500' : 'border-slate-300 text-slate-700 hover:border-slate-400'
                    }`}
                  >
                    {sortBy === 'edited' && 'Recently Edited'}
                    {sortBy === 'created' && 'Recently Created'}
                    {sortBy === 'name' && 'Name'}
                    <ChevronDown className={`w-4 h-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {dropdownOpen && (
                    <div
                      className={`absolute right-0 mt-3 w-40 rounded-xl border shadow-xl overflow-hidden ${
                        darkMode ? 'bg-slate-900/95 border-slate-700/70' : 'bg-white border-slate-200'
                      }`}
                    >
                      {sortBy !== 'edited' && (
                        <button
                          onClick={() => {
                            setSortBy('edited');
                            setDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2 text-sm transition-colors first:rounded-t-xl ${
                            darkMode ? 'hover:bg-slate-800 text-white' : 'hover:bg-slate-100 text-slate-900'
                          }`}
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
                          className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                            darkMode ? 'hover:bg-slate-800 text-white' : 'hover:bg-slate-100 text-slate-900'
                          }`}
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
                          className={`w-full text-left px-4 py-2 text-sm transition-colors last:rounded-b-xl ${
                            darkMode ? 'hover:bg-slate-800 text-white' : 'hover:bg-slate-100 text-slate-900'
                          }`}
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
                    className={`relative flex h-full cursor-pointer flex-col overflow-hidden rounded-3xl border transition-all duration-300 ${
                      darkMode
                        ? 'border-slate-800/60 bg-slate-950/40 hover:border-purple-400/70 hover:shadow-[0_32px_70px_rgba(8,15,30,0.55)]'
                        : 'border-slate-200 bg-white/90 backdrop-blur-sm hover:border-purple-300 hover:shadow-[0_35px_80px_rgba(124,58,237,0.14)]'
                    } ${navigatingToWorkspace === workspace.id ? 'opacity-60 pointer-events-none' : 'hover:-translate-y-[6px]'}`}
                    onClick={() => handleOpenWorkspace(workspace.id)}
                  >
                    <div className="absolute inset-0 pointer-events-none opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-gradient-to-br from-purple-500/10 via-transparent to-sky-400/10" />
                    <div className="relative p-6 pb-4 space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-2">
                          <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${
                            darkMode ? 'bg-slate-900/70 text-slate-200 border border-slate-800/60' : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}>
                            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                            Session
                          </span>
                          <h3 className={`text-xl font-semibold leading-tight line-clamp-1 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                            {workspace.name}
                          </h3>
                        </div>
                        <span className={`text-xs font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                          Edited {formatDate(lastEdited)}
                        </span>
                      </div>
                      {workspace.description && (
                        <p className={`text-sm leading-relaxed line-clamp-2 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                          {workspace.description}
                        </p>
                      )}
                    </div>
                    <div className="relative px-6 pb-4">
                      <div className={`rounded-2xl border p-3 h-32 sm:h-36 ${
                        darkMode ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-slate-50/70'
                      }`}>
                        {workspace.nodes && workspace.nodes.length > 0 ? (
                          <div className="grid grid-cols-3 gap-2 h-full">
                            {workspace.nodes.slice(0, 6).map((node: any) => (
                              <div
                                key={node.id}
                                className={`rounded-lg overflow-hidden flex items-center justify-center ${
                                  darkMode ? 'bg-slate-800/70' : 'bg-white'
                                }`}
                              >
                                {node.data?.image ? (
                                  <img
                                    src={node.data.image}
                                    alt={node.data.label || 'Part'}
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
                                darkMode ? 'bg-slate-800/70 text-slate-200' : 'bg-white text-slate-600'
                              }`}>
                                +{workspace.nodes.length - 6}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex h-full flex-col items-center justify-center gap-2">
                            <div className={`${darkMode ? 'bg-slate-900/60' : 'bg-white'} p-3 rounded-full`}>
                              <Map className={`w-7 h-7 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`} />
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
                    }`}>
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <span className={`inline-flex items-center gap-2 text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                          <User className="w-4 h-4" />
                          {workspace.partCount} {workspace.partCount === 1 ? 'part' : 'parts'}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteWorkspace(workspace.id);
                            }}
                            className={`inline-flex items-center justify-center rounded-full p-2 transition-colors ${
                              darkMode ? 'text-slate-400 hover:text-rose-200 hover:bg-rose-500/20' : 'text-slate-500 hover:text-rose-500 hover:bg-rose-50'
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
