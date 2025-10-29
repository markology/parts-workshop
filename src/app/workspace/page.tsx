"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Plus, Map, Calendar, Trash2, Edit3, Play, Clock, ArrowUpDown, ChevronDown, User, Settings, Moon, Sun, LogOut, Mail, Sparkles, Loader2 } from "lucide-react";
import { createEmptyImpressionGroups } from "@/features/workspace/state/stores/useWorkingStore";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";

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
  const [workspaces, setWorkspaces] = useState<WorkspaceData[]>([]);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('edited');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [navigatingToWorkspace, setNavigatingToWorkspace] = useState<string | null>(null);
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
      
      // Add the new workspace to the list
      const formattedWorkspace: WorkspaceData = {
        id: newWorkspace.id,
        name: newWorkspace.title,
        description: newWorkspace.description || undefined,
        createdAt: new Date(newWorkspace.createdAt),
        lastModified: new Date(newWorkspace.updatedAt),
        partCount: 0,
        nodes: []
      };
      
      setWorkspaces(prev => [formattedWorkspace, ...prev]);
      setNewWorkspaceName("");
    } catch (err) {
      console.error("Failed to create workspace:", err);
      setError("Failed to create workspace");
    }
  };

  const handleOpenWorkspace = (workspaceId: string) => {
    setNavigatingToWorkspace(workspaceId);
    router.push(`/workspace/${workspaceId}`);
  };

  const handleDeleteWorkspace = (workspaceId: string) => {
    if (confirm("Are you sure you want to delete this workspace? This action cannot be undone.")) {
      setWorkspaces(prev => prev.filter(workspace => workspace.id !== workspaceId));
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric'
    });
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      {/* Header */}
      <div className="bg-gray-900/50 backdrop-blur-sm border-b border-gray-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <Link href="/" className="inline-block">
            <h1 className="text-2xl font-bold text-white">
              Parts Workshop
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
              className="w-full pl-10 pr-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          
          {/* Profile Dropdown */}
          <div className="relative" ref={profileDropdownRef}>
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors overflow-hidden"
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
                <User className="w-5 h-5 text-gray-300" />
              )}
            </button>
            
            {profileDropdownOpen && (
              <div 
                className="absolute right-0 mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10"
                style={{ minWidth: '150px' }}
              >
                <button
                  onClick={() => {
                    // Navigate to account settings
                    setProfileDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-700 transition-colors text-white flex items-center gap-2 first:rounded-t-lg"
                >
                  <Settings className="w-4 h-4" />
                  Account
                </button>
                <button
                  onClick={() => {
                    // Toggle dark mode (implementation needed)
                    setProfileDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-700 transition-colors text-white flex items-center gap-2"
                >
                  <Moon className="w-4 h-4" />
                  Dark Mode
                </button>
                <button
                  onClick={() => {
                    // Handle contact
                    setProfileDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-700 transition-colors text-white flex items-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  Contact
                </button>
                <button
                  onClick={async () => {
                    await signOut({ callbackUrl: '/login' });
                    setProfileDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-700 transition-colors text-white flex items-center gap-2 last:rounded-b-lg"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="text-gray-400">Loading workspaces...</div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <div className="text-red-400 mb-4">{error}</div>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Start Session Section */}
        {!loading && !error && (
          <div className="mb-8">
            {/* Informational Text */}
            <div className="bg-blue-600/10 border border-blue-600/30 rounded-xl p-5 mb-6">
              <h2 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                Ready to start a session?
              </h2>
              <p className="text-sm text-gray-300 leading-relaxed">
                Starting a session creates a safe space for you to explore and map your internal parts. 
                You can name your session anything that feels right to you, or simply click Start to begin. 
                There's no pressure—you can take your time and explore at your own pace.
              </p>
            </div>

            {/* Start Form */}
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <input
                  type="text"
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleStartSession()}
                  placeholder="Name your session (optional)"
                  className="w-full bg-gray-800 text-white placeholder-gray-500 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1 ml-1">
                  You can always change this later
                </p>
              </div>
              <button
                onClick={handleStartSession}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors font-medium flex items-center gap-2 text-base disabled:opacity-50 disabled:cursor-wait"
              >
                <Play className="w-5 h-5" />
                <span>Start</span>
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && workspaces.length === 0 && (
          <div className="text-center py-12">
            <div className="inline-flex p-6 bg-gray-800/30 rounded-2xl mb-4">
              <Map className="w-16 h-16 text-gray-600" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Ready when you are</h3>
            <p className="text-gray-400">Click Start above to begin your first session</p>
          </div>
        )}

        {/* Workspaces Grid */}
        {!loading && !error && workspaces.length > 0 && (
          <>
            {/* Sort Controls */}
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm text-gray-400">{workspaces.length} {workspaces.length === 1 ? 'session' : 'sessions'}</h3>
              <div className="flex items-center gap-2">
                <ArrowUpDown className="w-4 h-4 text-gray-400" />
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="text-white text-sm focus:outline-none cursor-pointer flex items-center gap-1"
                  >
                    {sortBy === 'edited' && 'Recently Edited'}
                    {sortBy === 'created' && 'Recently Created'}
                    {sortBy === 'name' && 'Name'}
                    <ChevronDown className={`w-4 h-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {dropdownOpen && (
                    <div 
                      className="absolute right-0 mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10"
                      style={{ minWidth: 0, width: '157px' }}
                    >
                      {sortBy !== 'edited' && (
                        <button
                          onClick={() => {
                            setSortBy('edited');
                            setDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm hover:bg-gray-700 transition-colors text-white first:rounded-t-lg"
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
                          className="w-full text-left px-4 py-2 text-sm hover:bg-gray-700 transition-colors text-white"
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
                          className="w-full text-left px-4 py-2 text-sm hover:bg-gray-700 transition-colors text-white last:rounded-b-lg"
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
                className={`bg-gray-800/50 backdrop-blur-sm rounded-xl overflow-hidden border border-gray-700/50 hover:border-blue-500 transition-all duration-200 cursor-pointer relative ${navigatingToWorkspace === workspace.id ? 'opacity-50 pointer-events-none' : ''}`}
                onClick={() => handleOpenWorkspace(workspace.id)}
              >
                {/* Workspace Preview - Grid of Parts */}
                <div className="h-40 bg-gradient-to-br from-gray-700 to-gray-800 relative overflow-hidden p-3">
                  {workspace.nodes && workspace.nodes.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2 h-full">
                      {workspace.nodes.slice(0, 6).map((node: any) => (
                        <div
                          key={node.id}
                          className="bg-gray-800/50 rounded-lg overflow-hidden flex items-center justify-center"
                        >
                          {node.data?.image ? (
                            <img 
                              src={node.data.image} 
                              alt={node.data.label || 'Part'}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="text-xs text-gray-400 p-1 text-center truncate w-full">
                              {node.data?.label || 'Part'}
                            </div>
                          )}
                        </div>
                      ))}
                      {workspace.nodes.length > 6 && (
                        <div className="bg-gray-800/50 rounded-lg flex items-center justify-center text-gray-400 text-xs">
                          +{workspace.nodes.length - 6}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                      <div className="p-3 bg-gray-800/30 rounded-full">
                        <Map className="w-8 h-8 text-gray-500" />
                      </div>
                      <span className="text-gray-400 text-sm font-medium">Empty workspace</span>
                    </div>
                  )}
                  
                  {/* Loading Overlay */}
                  {navigatingToWorkspace === workspace.id && (
                    <div className="absolute inset-0 bg-gray-900/80 flex items-center justify-center">
                      <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
                    </div>
                  )}
                </div>

                <div className="p-5">
                  {/* Workspace Title */}
                  <h3 className="text-xl font-semibold text-white mb-1 line-clamp-1">
                    {workspace.name}
                  </h3>

                  {/* Workspace Description */}
                  {workspace.description && (
                    <p className="text-sm text-gray-400 line-clamp-2 mb-3">
                      {workspace.description}
                    </p>
                  )}

                  {/* Dates */}
                  <div className="flex flex-col gap-2 text-xs text-gray-500 mb-4">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Created {formatDate(workspace.createdAt)}</span>
                    </div>
                    {workspace.createdAt.getTime() !== workspace.lastModified.getTime() && (
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Edited {formatDate(workspace.lastModified)}</span>
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-700/50">
                    <span className="text-sm text-gray-500">
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
    </div>
  );
}
