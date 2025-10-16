"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Heart, Sparkles } from "lucide-react";

const affirmations = [
  {
    category: "Self-Compassion",
    items: [
      "I am worthy of love and kindness, especially from myself.",
      "I treat myself with the same compassion I would show a dear friend.",
      "I forgive myself for past mistakes and learn from them.",
      "I am enough exactly as I am in this moment."
    ]
  },
  {
    category: "Inner Strength",
    items: [
      "I have the strength to face whatever comes my way.",
      "I trust my inner wisdom to guide me through challenges.",
      "I am resilient and can recover from difficult experiences.",
      "I have overcome challenges before and I can do it again."
    ]
  },
  {
    category: "Self-Discovery",
    items: [
      "I am open to learning more about myself.",
      "I welcome all parts of myself with curiosity and acceptance.",
      "I trust the process of my inner journey.",
      "I am becoming more aware of my authentic self each day."
    ]
  },
  {
    category: "Healing",
    items: [
      "I am healing and growing stronger every day.",
      "I release what no longer serves me with love.",
      "I am creating space for peace and joy in my life.",
      "I honor my feelings as valid and important."
    ]
  },
  {
    category: "Connection",
    items: [
      "I am connected to something greater than myself.",
      "I have meaningful relationships that support my growth.",
      "I am not alone in my journey.",
      "I attract people who see and appreciate my true self."
    ]
  }
];

export default function AffirmationsPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedAffirmation, setSelectedAffirmation] = useState<string | null>(null);

  const handleAffirmationSelect = (affirmation: string) => {
    setSelectedAffirmation(affirmation);
    // Here you could trigger a trailhead exploration or redirect to a specific path
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      {/* Header */}
      <div className="bg-gray-900/50 backdrop-blur-sm border-b border-gray-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push("/workspace")}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-pink-600 rounded-lg">
                <Heart className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-semibold">Trailhead Affirmations</h1>
                <p className="text-sm text-gray-400">Choose an affirmation to begin your exploration</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {!selectedCategory ? (
          <>
            {/* Category Selection */}
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-pink-400 to-rose-400 bg-clip-text text-transparent">
                Choose Your Starting Point
              </h2>
              <p className="text-lg text-gray-300 max-w-2xl mx-auto">
                Select a category that resonates with where you are in your journey right now. 
                Each affirmation can serve as a trailhead for deeper exploration.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {affirmations.map((category, index) => (
                <div
                  key={category.category}
                  className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 hover:border-pink-500/50 transition-all duration-300 cursor-pointer group"
                  onClick={() => setSelectedCategory(category.category)}
                >
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-gradient-to-br from-pink-500 to-rose-500 rounded-lg">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-white group-hover:text-pink-300 transition-colors">
                      {category.category}
                    </h3>
                  </div>
                  <p className="text-gray-400 text-sm">
                    {category.items.length} affirmations available
                  </p>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            {/* Affirmation Selection */}
            <div className="mb-8">
              <button
                onClick={() => setSelectedCategory(null)}
                className="text-gray-400 hover:text-white transition-colors mb-4"
              >
                ← Back to categories
              </button>
              <h2 className="text-3xl font-bold mb-2">{selectedCategory}</h2>
              <p className="text-gray-400">Choose an affirmation that speaks to you</p>
            </div>

            <div className="space-y-4">
              {affirmations
                .find(cat => cat.category === selectedCategory)
                ?.items.map((affirmation, index) => (
                  <div
                    key={index}
                    className={`p-6 rounded-xl border transition-all duration-300 cursor-pointer ${
                      selectedAffirmation === affirmation
                        ? "bg-pink-600/20 border-pink-500 text-pink-100"
                        : "bg-gray-800/50 border-gray-700 hover:border-pink-500/50 hover:bg-gray-800/70"
                    }`}
                    onClick={() => handleAffirmationSelect(affirmation)}
                  >
                    <p className="text-lg leading-relaxed">{affirmation}</p>
                  </div>
                ))}
            </div>

            {selectedAffirmation && (
              <div className="mt-8 text-center">
                <div className="bg-gradient-to-r from-pink-600/20 to-rose-600/20 rounded-2xl p-8 border border-pink-500/30">
                  <h3 className="text-2xl font-bold mb-4 text-pink-200">Your Chosen Affirmation</h3>
                  <p className="text-xl mb-6 italic text-pink-100">"{selectedAffirmation}"</p>
                  <div className="space-y-4">
                    <p className="text-gray-300">
                      Take a moment to sit with this affirmation. How does it feel in your body? 
                      What thoughts or feelings arise?
                    </p>
                    <div className="flex justify-center space-x-4">
                      <button
                        onClick={() => router.push("/workspace/ai-chat")}
                        className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 rounded-lg transition-colors"
                      >
                        Explore with AI
                      </button>
                      <button
                        onClick={() => router.push("/workspace/journal-analysis")}
                        className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg transition-colors"
                      >
                        Journal About This
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
