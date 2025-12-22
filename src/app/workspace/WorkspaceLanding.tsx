"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, Heart, Map, BookOpen, ArrowLeft } from "lucide-react";

export default function WorkspaceNavigation() {
  const router = useRouter();
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const paths = [
    {
      id: "ai-chat",
      title: "AI Exploratory Session",
      description: "Start a guided conversation with our AI therapist to explore your internal parts and feelings",
      icon: MessageCircle,
      color: "from-blue-600 to-purple-600",
      route: "/workspace/ai-chat"
    },
    {
      id: "affirmations",
      title: "Trailhead Affirmations",
      description: "Begin your journey with curated affirmations designed to help you connect with your inner self",
      icon: Heart,
      color: "from-pink-500 to-rose-500",
      route: "/workspace/affirmations"
    },
    {
      id: "map",
      title: "Parts Map",
      description: "Open an existing map or create a new one to visualize and explore your internal parts",
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
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      <div className="container mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Welcome to Your Inner Journey
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Choose your path to self-discovery and healing. Each option offers a unique way to explore and understand your internal world.
          </p>
        </div>

        {/* Path Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {paths.map((path) => {
            const IconComponent = path.icon;
            return (
              <div
                key={path.id}
                className={`relative group cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                  hoveredCard === path.id ? "scale-105" : ""
                }`}
                onMouseEnter={() => setHoveredCard(path.id)}
                onMouseLeave={() => setHoveredCard(null)}
                onClick={() => router.push(path.route)}
              >
                {/* Card Background */}
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300 h-full">
                  {/* Gradient Overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${path.color} opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity duration-300`} />
                  
                  {/* Content */}
                  <div className="relative z-10">
                    {/* Icon */}
                    <div className={`inline-flex p-4 rounded-xl bg-gradient-to-br ${path.color} mb-6`}>
                      <IconComponent className="w-8 h-8 text-white" />
                    </div>
                    
                    {/* Title */}
                    <h3 className="text-2xl font-bold mb-4 text-white group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-400 group-hover:to-purple-400 group-hover:bg-clip-text transition-all duration-300">
                      {path.title}
                    </h3>
                    
                    {/* Description */}
                    <p className="text-gray-300 text-lg leading-relaxed mb-6">
                      {path.description}
                    </p>
                    
                    {/* Arrow Indicator */}
                    <div className="flex items-center text-blue-400 group-hover:text-blue-300 transition-colors duration-300">
                      <span className="text-sm font-medium mr-2">Get Started</span>
                      <ArrowLeft className="w-4 h-4 rotate-180 group-hover:translate-x-1 transition-transform duration-300" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="text-center mt-16">
          <p className="text-gray-400 text-sm">
            Remember: This is a tool for self-exploration, not a substitute for professional therapy.
          </p>
        </div>
      </div>
    </div>
  );
}
