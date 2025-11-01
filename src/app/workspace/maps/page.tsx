"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Map, Calendar, Trash2, Edit3, Play } from "lucide-react";
import { createEmptyImpressionGroups } from "@/features/workspace/state/stores/useWorkingStore";
import PageLoader from "@/components/PageLoader";

interface MapData {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  lastModified: Date;
  partCount: number;
  thumbnail?: string;
}


export default function MapSelectionPage() {
  const router = useRouter();
  const [maps, setMaps] = useState<MapData[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newMapName, setNewMapName] = useState("");
  const [newMapDescription, setNewMapDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load maps from API
  useEffect(() => {
    const loadMaps = async () => {
      try {
        const response = await fetch("/api/maps");
        if (!response.ok) {
          throw new Error("Failed to fetch maps");
        }
        const apiMaps = await response.json();
        
        // Convert API maps to MapData format
        const formattedMaps: MapData[] = apiMaps.map((map: any) => ({
          id: map.id,
          name: map.title,
          description: map.description || undefined,
          createdAt: new Date(map.createdAt),
          lastModified: new Date(map.updatedAt),
          partCount: map.nodes?.length || 0
        }));
        
        setMaps(formattedMaps);
      } catch (err) {
        console.error("Failed to load workspaces:", err);
        setError("Failed to load workspaces");
      } finally {
        setLoading(false);
      }
    };

    loadMaps();
  }, []);

  const handleCreateMap = async () => {
    if (!newMapName.trim()) return;

    try {
      const response = await fetch("/api/maps", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: newMapName.trim(),
          description: newMapDescription.trim() || undefined,
          nodes: [],
          edges: [],
          sidebarImpressions: createEmptyImpressionGroups()
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create workspace");
      }

      const newMap = await response.json();
      
      // Add the new workspace to the list
      const formattedMap: MapData = {
        id: newMap.id,
        name: newMap.title,
        description: newMap.description || undefined,
        createdAt: new Date(newMap.createdAt),
        lastModified: new Date(newMap.updatedAt),
        partCount: 0
      };
      
      setMaps(prev => [formattedMap, ...prev]);
      setNewMapName("");
      setNewMapDescription("");
      setShowCreateForm(false);
    } catch (err) {
      console.error("Failed to create workspace:", err);
      setError("Failed to create workspace");
    }
  };

  const handleOpenMap = (mapId: string) => {
    router.push(`/workspace/${mapId}`);
  };

  const handleDeleteMap = (mapId: string) => {
    if (confirm("Are you sure you want to delete this workspace? This action cannot be undone.")) {
      setMaps(prev => prev.filter(map => map.id !== mapId));
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white flex items-center justify-center px-6 py-12">
        <PageLoader
          withBackground={false}
          fullHeight={false}
          className="max-w-xl"
          title="Loading workspace maps"
          subtitle="Gathering your saved Studio canvases and sessions."
          message="Preparing your maps..."
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      {/* Header */}
      <div className="bg-gray-900/50 backdrop-blur-sm border-b border-gray-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-600 rounded-lg">
              <Map className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">My Workspaces</h1>
              <p className="text-sm text-gray-400">Select or create a workspace</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
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

        {/* Create Workspace Form */}
        {!loading && !error && showCreateForm && (
          <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50 mb-8">
            <h2 className="text-xl font-semibold mb-4">Create New Workspace</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Workspace Name</label>
                <input
                  type="text"
                  value={newMapName}
                  onChange={(e) => setNewMapName(e.target.value)}
                  placeholder="Enter a name for your workspace"
                  className="w-full bg-gray-700 text-white placeholder-gray-400 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description (Optional)</label>
                <textarea
                  value={newMapDescription}
                  onChange={(e) => setNewMapDescription(e.target.value)}
                  placeholder="Describe what this workspace will explore"
                  rows={3}
                  className="w-full bg-gray-700 text-white placeholder-gray-400 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateMap}
                  disabled={!newMapName.trim()}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                  Create Workspace
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Workspaces Grid */}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* New Workspace Card */}
            <div
              onClick={() => setShowCreateForm(true)}
              className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-dashed border-green-500/50 hover:border-green-500 hover:bg-gray-800/70 transition-all duration-300 cursor-pointer group flex flex-col items-center justify-center min-h-[280px]"
            >
              <div className="p-4 bg-green-600/20 rounded-xl mb-4 group-hover:bg-green-600/30 transition-colors">
                <Plus className="w-12 h-12 text-green-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">New Workspace</h3>
              <p className="text-sm text-gray-400 text-center">Create a new workspace to start exploring</p>
            </div>

            {/* Existing Workspaces */}
            {maps.map((map) => (
              <div
                key={map.id}
                className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 hover:border-green-500/50 transition-all duration-300 group"
              >
                {/* Workspace Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white group-hover:text-green-300 transition-colors mb-1">
                      {map.name}
                    </h3>
                    {map.description && (
                      <p className="text-sm text-gray-400 line-clamp-2">
                        {map.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-1 ml-4">
                    <button
                      onClick={() => handleDeleteMap(map.id)}
                      className="p-1 hover:bg-red-600/20 rounded transition-colors"
                      title="Delete workspace"
                    >
                      <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-400" />
                    </button>
                  </div>
                </div>

                {/* Workspace Stats */}
                <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
                  <div className="flex items-center space-x-4">
                    <span className="flex items-center space-x-1">
                      <Map className="w-4 h-4" />
                      <span>{map.partCount} parts</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(map.lastModified)}</span>
                    </span>
                  </div>
                </div>

                {/* Workspace Thumbnail Placeholder */}
                <div className="bg-gray-700/50 rounded-lg h-24 mb-4 flex items-center justify-center">
                  <Map className="w-8 h-8 text-gray-500" />
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleOpenMap(map.id)}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                  >
                    <Play className="w-4 h-4" />
                    <span>Open</span>
                  </button>
                  <button
                    className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                    title="Edit workspace details"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-12 bg-gray-800/30 rounded-2xl p-6 border border-gray-700/30">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => router.push('/workspace/ai-chat')}
              className="p-4 bg-blue-600/20 hover:bg-blue-600/30 rounded-lg border border-blue-500/30 transition-colors text-left"
            >
              <h4 className="font-medium text-blue-200 mb-1">Start with AI</h4>
              <p className="text-sm text-blue-300">Let AI help you discover your parts</p>
            </button>
            <button
              onClick={() => router.push('/workspace/body-mapping')}
              className="p-4 bg-purple-600/20 hover:bg-purple-600/30 rounded-lg border border-purple-500/30 transition-colors text-left"
            >
              <h4 className="font-medium text-purple-200 mb-1">Body Mapping</h4>
              <p className="text-sm text-purple-300">Create visual part avatars</p>
            </button>
            <button
              onClick={() => router.push('/workspace/journal-analysis')}
              className="p-4 bg-orange-600/20 hover:bg-orange-600/30 rounded-lg border border-orange-500/30 transition-colors text-left"
            >
              <h4 className="font-medium text-orange-200 mb-1">Journal Analysis</h4>
              <p className="text-sm text-orange-300">Analyze your writing for insights</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
