"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Map, Calendar, Trash2, Edit3, Play } from "lucide-react";

interface MapData {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  lastModified: Date;
  partCount: number;
  thumbnail?: string;
}

// Mock data - in real app, this would come from your database
const MOCK_MAPS: MapData[] = [
  {
    id: "1",
    name: "My First Parts Map",
    description: "Initial exploration of my internal parts",
    createdAt: new Date("2024-01-15"),
    lastModified: new Date("2024-01-20"),
    partCount: 5
  },
  {
    id: "2", 
    name: "Work Stress Parts",
    description: "Parts that emerge during work situations",
    createdAt: new Date("2024-01-10"),
    lastModified: new Date("2024-01-18"),
    partCount: 3
  },
  {
    id: "3",
    name: "Relationship Dynamics",
    description: "Parts that show up in my relationships",
    createdAt: new Date("2024-01-05"),
    lastModified: new Date("2024-01-12"),
    partCount: 7
  }
];

export default function MapSelectionPage() {
  const router = useRouter();
  const [maps, setMaps] = useState<MapData[]>(MOCK_MAPS);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newMapName, setNewMapName] = useState("");
  const [newMapDescription, setNewMapDescription] = useState("");

  const handleCreateMap = () => {
    if (!newMapName.trim()) return;

    const newMap: MapData = {
      id: Date.now().toString(),
      name: newMapName.trim(),
      description: newMapDescription.trim() || undefined,
      createdAt: new Date(),
      lastModified: new Date(),
      partCount: 0
    };

    setMaps(prev => [newMap, ...prev]);
    setNewMapName("");
    setNewMapDescription("");
    setShowCreateForm(false);
  };

  const handleOpenMap = (mapId: string) => {
    router.push(`/workspace/map/${mapId}`);
  };

  const handleDeleteMap = (mapId: string) => {
    if (confirm("Are you sure you want to delete this map? This action cannot be undone.")) {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      {/* Header */}
      <div className="bg-gray-900/50 backdrop-blur-sm border-b border-gray-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-600 rounded-lg">
                <Map className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-semibold">My Maps</h1>
                <p className="text-sm text-gray-400">Manage your parts maps</p>
              </div>
            </div>
          </div>
          
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Map</span>
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Create Map Form */}
        {showCreateForm && (
          <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50 mb-8">
            <h2 className="text-xl font-semibold mb-4">Create New Map</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Map Name</label>
                <input
                  type="text"
                  value={newMapName}
                  onChange={(e) => setNewMapName(e.target.value)}
                  placeholder="Enter a name for your map"
                  className="w-full bg-gray-700 text-white placeholder-gray-400 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description (Optional)</label>
                <textarea
                  value={newMapDescription}
                  onChange={(e) => setNewMapDescription(e.target.value)}
                  placeholder="Describe what this map will explore"
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
                  Create Map
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Maps Grid */}
        {maps.length === 0 ? (
          <div className="text-center py-16">
            <div className="p-4 bg-gray-800/50 rounded-xl inline-block mb-4">
              <Map className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-gray-300">No Maps Yet</h3>
            <p className="text-gray-400 mb-6">Create your first map to start exploring your internal parts</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg transition-colors flex items-center space-x-2 mx-auto"
            >
              <Plus className="w-5 h-5" />
              <span>Create Your First Map</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {maps.map((map) => (
              <div
                key={map.id}
                className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 hover:border-green-500/50 transition-all duration-300 group"
              >
                {/* Map Header */}
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
                      title="Delete map"
                    >
                      <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-400" />
                    </button>
                  </div>
                </div>

                {/* Map Stats */}
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

                {/* Map Thumbnail Placeholder */}
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
                    title="Edit map details"
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
