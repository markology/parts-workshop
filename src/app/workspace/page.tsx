"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Plus, Map, Calendar, Trash2, Edit3, Play, Clock, ArrowUpDown, ChevronDown, User, Settings, Moon, Sun, LogOut, Mail, Sparkles, Loader2, MailPlus, HelpCircle } from "lucide-react";
import { createEmptyImpressionGroups } from "@/features/workspace/state/stores/useWorkingStore";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import { useUIStore } from "@/features/workspace/state/stores/UI";
import { useThemeContext } from "@/state/context/ThemeContext";
import Modal from "@/components/Modal";
import FeedbackForm from "@/components/FeedbackForm";

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


type SortOption = 'edited' | 'created' | 'name';

export default function WorkspacePage() {
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
  const [navigatingToWorkspace, setNavigatingToWorkspace] = useState<string | null>(null);
  const [profileDropdownPosition, setProfileDropdownPosition] = useState<{ top: number; right: number } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className={`min-h-screen ${darkMode 
      ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white' 
      : 'bg-[#e6f8ff] text-gray-900'
    }`}>
      {/* Header */}
      <div className={`relative z-40 ${
        darkMode 
          ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-black' 
          : 'bg-[#e6f8ff]'
      }`}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <Link href="/" className="inline-block">
            <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Parts Studio
            </h1>
          </Link>
          
          {/* Search Input */}
          <div className="flex-1 max-w-md relative">
            <Sparkles className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-purple-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Ask me anything..."
              className={`w-full pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                darkMode 
                  ? 'bg-gray-800/50 border border-gray-700 text-white placeholder-gray-400' 
                  : 'bg-white border border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
            />
          </div>
          
          {/* Contact Button and Profile Dropdown */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFeedbackModal(true)}
              className={`group relative flex items-center justify-center w-10 h-10 rounded-full ${
                darkMode 
                  ? 'bg-gray-700' 
                  : 'bg-white'
              }`}
              title="Contact"
            >
              <MailPlus className={`w-5 h-5 ${darkMode ? 'text-gray-300' : 'text-gray-700'} opacity-0 group-hover:opacity-100 absolute`} />
              <Mail className={`w-5 h-5 ${darkMode ? 'text-gray-300' : 'text-gray-700'} opacity-100 group-hover:opacity-0`} />
            </button>
            
            {/* Profile Dropdown */}
            <div className="relative" ref={profileDropdownRef}>
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors overflow-hidden ${
                darkMode 
                  ? 'bg-gray-700 hover:bg-gray-600' 
                  : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              {session?.user?.image ? (
                <Image
                  src={session.user.image}
                  alt={session.user.name || "User"}
                  width={40}
                  height={40}
                  className="rounded-full"
                />
              ) : (
                <User className={`w-5 h-5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`} />
              )}
            </button>
            
            {profileDropdownOpen && profileDropdownPosition && (
              <div 
                ref={(el) => {
                  if (el && profileDropdownRef.current) {
                    // Store reference to dropdown menu for click-outside detection
                    (profileDropdownRef.current as any).dropdownMenu = el;
                  }
                }}
                className={`fixed rounded-lg shadow-lg z-[100] ${
                  darkMode 
                    ? 'bg-gray-800 border border-gray-700' 
                    : 'bg-white border border-gray-200'
                }`}
                style={{ 
                  minWidth: '150px',
                  top: `${profileDropdownPosition.top}px`,
                  right: `${profileDropdownPosition.right}px`
                }}
              >
                <button
                  onClick={() => {
                    // Navigate to account settings
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
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className={darkMode ? "text-gray-400" : "text-gray-600"}>Loading workspaces...</div>
          </div>
        )}

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
          <div className="mb-8">
            <div className={`border rounded-2xl p-6 backdrop-blur-sm ${
              darkMode 
                ? 'bg-gradient-to-r from-blue-600/20 via-indigo-600/20 to-purple-600/20 border-blue-500/30' 
                : 'bg-gradient-to-r from-blue-100 via-indigo-100 to-purple-100 border-blue-300 shadow-sm'
            }`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
                    <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      Ready to start a session?
                    </h2>
                  </div>
                  <p className={`text-sm leading-relaxed mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Starting a session creates a safe space for you to explore and map your internal parts.
                    There's no pressure—you can take your time and explore at your own pace.
                  </p>
                </div>
                <button
                  onClick={handleStartSession}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl transition-all duration-200 font-semibold flex items-center gap-2 text-base hover:scale-105 disabled:opacity-50 disabled:cursor-wait shrink-0 text-white"
                >
                  <Play className="w-5 h-5" />
                  <span>Start</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && workspaces.length === 0 && (
          <div className="text-center py-12">
            <div className={`inline-flex p-6 rounded-2xl mb-4 ${
              darkMode ? 'bg-gray-800/30' : 'bg-gray-100'
            }`}>
              <Map className={`w-16 h-16 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
            </div>
            <h3 className={`text-xl font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Ready when you are</h3>
            <p className={darkMode ? "text-gray-400" : "text-gray-600"}>Click Start above to begin your first session</p>
          </div>
        )}

        {/* Workspaces Grid */}
        {!loading && !error && workspaces.length > 0 && (
          <>
            {/* Sort Controls */}
            <div className="mb-4 flex items-center justify-between">
              <h3 className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{workspaces.length} {workspaces.length === 1 ? 'session' : 'sessions'}</h3>
              <div className="flex items-center gap-2">
                <ArrowUpDown className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className={`text-sm focus:outline-none cursor-pointer flex items-center gap-1 ${
                      darkMode ? 'text-white' : 'text-gray-900'
                    }`}
                  >
                    {sortBy === 'edited' && 'Recently Edited'}
                    {sortBy === 'created' && 'Recently Created'}
                    {sortBy === 'name' && 'Name'}
                    <ChevronDown className={`w-4 h-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {dropdownOpen && (
                    <div 
                      className={`absolute right-0 mt-2 rounded-lg shadow-lg z-50 ${
                        darkMode 
                          ? 'bg-gray-800 border border-gray-700' 
                          : 'bg-white border border-gray-200'
                      }`}
                      style={{ minWidth: 0, width: '157px' }}
                    >
                      {sortBy !== 'edited' && (
                        <button
                          onClick={() => {
                            setSortBy('edited');
                            setDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2 text-sm transition-colors first:rounded-t-lg ${
                            darkMode 
                              ? 'hover:bg-gray-700 text-white' 
                              : 'hover:bg-gray-100 text-gray-900'
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
                            darkMode 
                              ? 'hover:bg-gray-700 text-white' 
                              : 'hover:bg-gray-100 text-gray-900'
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
                          className={`w-full text-left px-4 py-2 text-sm transition-colors last:rounded-b-lg ${
                            darkMode 
                              ? 'hover:bg-gray-700 text-white' 
                              : 'hover:bg-gray-100 text-gray-900'
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Existing Workspaces */}
              {sortedWorkspaces.map((workspace) => (
              <div
                key={workspace.id}
                className={`relative group rounded-xl overflow-hidden border-2 backdrop-blur-sm cursor-pointer ${navigatingToWorkspace === workspace.id ? 'opacity-50 pointer-events-none' : ''} ${
                  darkMode 
                    ? 'border-gray-700/50 hover:border-blue-500 bg-gray-800/50' 
                    : 'border-gray-300 hover:border-blue-400 bg-white/80'
                }`}
                onClick={() => handleOpenWorkspace(workspace.id)}
              >
                {/* Workspace Preview - Grid of Parts */}
                <div className={`h-40 bg-gradient-to-br relative overflow-hidden p-3 ${
                  darkMode 
                    ? 'from-gray-700 to-gray-800' 
                    : 'from-blue-50 to-indigo-50'
                }`}>
                  {workspace.nodes && workspace.nodes.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2 h-full">
                      {workspace.nodes.slice(0, 6).map((node: any) => (
                        <div
                          key={node.id}
                          className={`rounded-lg overflow-hidden flex items-center justify-center ${
                            darkMode ? 'bg-gray-800/50' : 'bg-white'
                          }`}
                        >
                          {node.data?.image ? (
                            <img 
                              src={node.data.image} 
                              alt={node.data.label || 'Part'}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className={`text-xs p-1 text-center truncate w-full ${
                              darkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                              {node.data?.label || 'Part'}
                            </div>
                          )}
                        </div>
                      ))}
                      {workspace.nodes.length > 6 && (
                        <div className={`rounded-lg flex items-center justify-center text-xs ${
                          darkMode 
                            ? 'bg-gray-800/50 text-gray-400' 
                            : 'bg-white text-gray-600'
                        }`}>
                          +{workspace.nodes.length - 6}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                      <div className={`p-3 rounded-full ${
                        darkMode ? 'bg-gray-800/30' : 'bg-white/70'
                      }`}>
                        <Map className={`w-8 h-8 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                      </div>
                      <span className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Empty workspace</span>
                    </div>
                  )}
                  
                  {/* Loading Overlay */}
                  {navigatingToWorkspace === workspace.id && (
                    <div className={`absolute inset-0 flex items-center justify-center ${
                      darkMode ? 'bg-gray-900/80' : 'bg-white/80'
                    }`}>
                      <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
                    </div>
                  )}
                </div>

                <div className="p-5">
                  {/* Workspace Title */}
                  <h3 className={`text-xl font-semibold mb-1 line-clamp-1 ${
                    darkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {workspace.name}
                  </h3>

                  {/* Workspace Description */}
                  {workspace.description && (
                    <p className={`text-sm line-clamp-2 mb-3 ${
                      darkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {workspace.description}
                    </p>
                  )}

                  {/* Dates */}
                  <div className={`flex flex-col gap-2 text-xs mb-4 ${
                    darkMode ? 'text-gray-500' : 'text-gray-500'
                  }`}>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Created {formatDate(workspace.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Edited {formatDate(workspace.createdAt.getTime() === workspace.lastModified.getTime() ? workspace.createdAt : workspace.lastModified)}</span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className={`flex items-center justify-between pt-3 border-t ${
                    darkMode ? 'border-gray-700/50' : 'border-gray-200'
                  }`}>
                    <span className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-600'}`}>
                      {workspace.partCount} {workspace.partCount === 1 ? 'part' : 'parts'}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteWorkspace(workspace.id);
                        }}
                        className="p-1.5 rounded transition-colors group"
                        style={{ '--hover-bg': '#bb6262' } as React.CSSProperties}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#bb6262'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        title="Delete session"
                      >
                        <Trash2 className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              ))}
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
