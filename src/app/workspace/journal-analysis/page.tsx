"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, BookOpen, Sparkles, Send } from "lucide-react";
import JournalEditor from "@/features/workspace/components/Journal/JournalEditor";

export default function JournalAnalysisPage() {
  const router = useRouter();
  const [journalContent, setJournalContent] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [hasContent, setHasContent] = useState(false);

  const handleSave = (content: string) => {
    setJournalContent(content);
    setHasContent(content.trim().length > 0);
  };

  const handleAnalyze = async () => {
    if (!journalContent.trim()) return;

    setIsAnalyzing(true);
    try {
      const response = await fetch("/api/ai/ifs-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userMessage: `Please analyze this journal entry for parts work and IFS insights. Here's the entry:\n\n${journalContent}`,
          mapContext: {}
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get analysis");
      }

      const data = await response.json();
      setAnalysis(data.response_text);
    } catch (error) {
      console.error("Error analyzing journal:", error);
      setAnalysis("I'm sorry, I couldn't analyze your journal entry right now. Please try again in a moment.");
    } finally {
      setIsAnalyzing(false);
    }
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
              <div className="p-2 bg-orange-600 rounded-lg">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-semibold">Journal Analysis</h1>
                <p className="text-sm text-gray-400">Write freely, then explore insights</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Journal Editor */}
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
                Free Writing Space
              </h2>
              <p className="text-gray-400">
                Write whatever comes to mind. Don't worry about structure or grammar - just let your thoughts flow.
              </p>
            </div>

            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50">
              <JournalEditor
                initialContent=""
                onSave={handleSave}
                title="Journal Entry"
                isLoading={false}
              />
            </div>

            {hasContent && (
              <div className="text-center">
                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-8 py-3 rounded-lg transition-colors flex items-center space-x-2 mx-auto"
                >
                  {isAnalyzing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Analyze Entry</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Analysis Results */}
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                AI Insights
              </h2>
              <p className="text-gray-400">
                Discover patterns, parts, and connections in your writing
              </p>
            </div>

            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 min-h-[400px]">
              {!analysis ? (
                <div className="p-8 text-center">
                  <div className="p-4 bg-gray-700/50 rounded-xl inline-block mb-4">
                    <Sparkles className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-gray-300">
                    {hasContent ? "Ready for Analysis" : "Write Something First"}
                  </h3>
                  <p className="text-gray-400">
                    {hasContent 
                      ? "Click 'Analyze Entry' to discover insights about your writing"
                      : "Start writing in the journal to unlock AI analysis"
                    }
                  </p>
                </div>
              ) : (
                <div className="p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-blue-600 rounded-lg">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-semibold">Analysis Results</h3>
                  </div>
                  <div className="prose prose-invert max-w-none">
                    <p className="text-gray-200 leading-relaxed whitespace-pre-wrap">
                      {analysis}
                    </p>
                  </div>
                  
                  {analysis && (
                    <div className="mt-6 pt-6 border-t border-gray-700">
                      <div className="flex justify-center space-x-4">
                        <button
                          onClick={() => router.push("/workspace/ai-chat")}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors text-sm"
                        >
                          Continue Conversation
                        </button>
                        <button
                          onClick={() => router.push("/workspace/map")}
                          className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors text-sm"
                        >
                          Create Map
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
