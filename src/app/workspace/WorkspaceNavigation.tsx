"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, Heart, Map, BookOpen, Palette, ArrowLeft, Box, Brain, Zap, Eye, Send } from "lucide-react";

export default function WorkspaceNavigation() {
  const router = useRouter();
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState("");

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatInput.trim()) {
      // Navigate to AI chat with the input as initial message
      router.push(`/workspace/ai-chat?message=${encodeURIComponent(chatInput.trim())}`);
    }
  };

  // Primary emotional support paths
  const emotionalPaths = [
    {
      id: "ai-chat",
      title: "I Need Support Right Now",
      description: "Feeling overwhelmed, anxious, or emotional? Let's talk through what's happening",
      icon: MessageCircle,
      color: "from-red-500 to-pink-500",
      route: "/workspace/ai-chat",
      urgent: true
    },
    {
      id: "affirmations",
      title: "I Need Grounding",
      description: "Feeling scattered or disconnected? Start with gentle affirmations to center yourself",
      icon: Heart,
      color: "from-pink-500 to-rose-500",
      route: "/workspace/affirmations",
      urgent: true
    }
  ];

  // Manual exploration paths
  const manualPaths = [
    {
      id: "body-mapping",
      title: "2D Body Mapping",
      description: "Create visual avatars for your parts by painting different colors on a body outline",
      icon: Palette,
      color: "from-purple-500 to-violet-500",
      route: "/workspace/body-mapping"
    },
    {
      id: "body-3d-mapping",
      title: "3D Body Mapping",
      description: "Draw on a rotatable 3D body to create immersive part avatars with depth and perspective",
      icon: Box,
      color: "from-indigo-500 to-purple-500",
      route: "/workspace/body-3d-mapping"
    },
    {
      id: "workspaces",
      title: "My Workspaces",
      description: "Open an existing workspace or create a new one to visualize and explore your internal parts",
      icon: Map,
      color: "from-green-500 to-emerald-500",
      route: "/dashboard"
    },
    {
      id: "journal",
      title: "Journal Analysis",
      description: "Write freely and let AI analyze your thoughts to create insights and map connections",
      icon: BookOpen,
      color: "from-orange-500 to-amber-500",
      route: "/workspace/journal-analysis"
    },
    {
      id: "composite-body-mapping",
      title: "Composite Body View",
      description: "View all your parts together on one 3D body to see the complete picture",
      icon: Eye,
      color: "from-cyan-500 to-blue-500",
      route: "/workspace/composite-body-mapping"
    }
  ];

  const renderPathCard = (path: any) => {
    const IconComponent = path.icon;
    return (
      <div
        key={path.id}
        className={`group cursor-pointer transition-all duration-200 hover:scale-102 ${
          hoveredCard === path.id ? "scale-102" : ""
        }`}
        onMouseEnter={() => setHoveredCard(path.id)}
        onMouseLeave={() => setHoveredCard(null)}
        onClick={() => router.push(path.route)}
      >
        {/* Card Background */}
        <div className={`bg-gray-800/30 backdrop-blur-sm rounded-lg p-4 border transition-all duration-200 ${
          path.urgent 
            ? 'border-red-500/40 hover:border-red-400/60' 
            : 'border-gray-700/30 hover:border-gray-600/50'
        }`}>
          {/* Urgent Badge */}
          {path.urgent && (
            <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium">
              <Zap className="w-3 h-3 inline mr-1" />
            </div>
          )}
          
          {/* Content */}
          <div className="flex items-center space-x-3">
            {/* Icon */}
            <div className={`flex-shrink-0 p-2 rounded-lg bg-gradient-to-br ${path.color}`}>
              <IconComponent className="w-5 h-5 text-white" />
            </div>
            
            {/* Text */}
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-white truncate">
                {path.title}
              </h3>
              <p className="text-xs text-gray-400 truncate">
                {path.description}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            What's On Your Mind?
          </h1>
          
          {/* Chat Input */}
          <form onSubmit={handleChatSubmit} className="max-w-2xl mx-auto mb-8">
            <div className="relative">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type what you're feeling or thinking..."
                className="w-full px-6 py-4 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>

        {/* Immediate Support Section */}
        <div className="mb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
            {emotionalPaths.map(renderPathCard)}
          </div>
        </div>

        {/* Manual Exploration Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-center text-gray-300">Manual Exploration</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto">
            {manualPaths.map(renderPathCard)}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-gray-500 text-xs">
            This is a tool for self-exploration, not a substitute for professional therapy.
          </p>
        </div>
      </div>
    </div>
  );
}
