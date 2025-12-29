"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, BookOpen, Sparkles } from "lucide-react";
import { useThemeContext } from "@/state/context/ThemeContext";

export default function JournalAnalysisPage() {
  const router = useRouter();
  const { darkMode } = useThemeContext();
  const editorRef = useRef<HTMLDivElement>(null);
  
  const [journalContent, setJournalContent] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [hasContent, setHasContent] = useState(false);
  const [hasEditorMounted, setHasEditorMounted] = useState(false);
  
  const [formats, setFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    unorderedList: false,
  });

  const updateFormatState = useCallback(() => {
    const selection = document.getSelection();
    if (selection && selection.rangeCount > 0) {
      setFormats({
        bold: document.queryCommandState("bold"),
        italic: document.queryCommandState("italic"),
        underline: document.queryCommandState("underline"),
        unorderedList: document.queryCommandState("insertUnorderedList"),
      });
    }
  }, []);

  const exec = useCallback(
    (command: string, value?: string) => {
      editorRef.current?.focus();
      document.execCommand(command, false, value);
      setJournalContent(editorRef.current?.innerHTML || "");
      updateFormatState();
    },
    [updateFormatState]
  );

  const ToolbarButton = ({
    label,
    command,
    active,
    children,
  }: {
    label: string;
    command: string;
    children?: React.ReactNode;
    active?: boolean;
  }) => (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault();
        exec(command);
      }}
      className={`px-3 py-2 rounded text-sm transition ${
        active
          ? darkMode
            ? "bg-gray-100 text-black"
            : "bg-black text-white"
          : "hover:bg-gray-300 text-gray-700"
      }`}
      title={label}
    >
      {children || label}
    </button>
  );

  useEffect(() => {
    if (!hasEditorMounted && editorRef?.current) {
      setHasEditorMounted(true);
    }
  }, [editorRef?.current]);

  useEffect(() => {
    if (!editorRef.current) return;

    const editor = editorRef.current;
    const handleCursorChange = () => {
      requestAnimationFrame(updateFormatState);
    };

    editor.addEventListener("keyup", handleCursorChange);
    editor.addEventListener("mousedown", () => {
      document.addEventListener("mouseup", handleCursorChange, { once: true });
    });

    return () => {
      editor.removeEventListener("keyup", handleCursorChange);
      editor.removeEventListener("mousedown", () => {
        document.removeEventListener("mouseup", handleCursorChange);
      });
    };
  }, [hasEditorMounted, updateFormatState]);

  const handleAnalyze = async () => {
    if (!journalContent.trim()) return;

    setIsAnalyzing(true);
    setAnalysis(""); // Clear previous analysis
    
    try {
      const response = await fetch("/api/ai/journal-analysis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          journalContent: journalContent
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get analysis");
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body");
      }

      const decoder = new TextDecoder();
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        fullContent += chunk;
        
        // Update analysis in real-time as it streams
        setAnalysis(fullContent);
      }
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
              onClick={() => router.push("/dashboard")}
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

            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6">
              {/* Custom Journal Editor */}
              <div className="space-y-4">
                {/* Toolbar */}
                <div className="flex flex-wrap items-center gap-2 border-b border-gray-600 pb-3">
                  <ToolbarButton label="Bold" command="bold" active={formats.bold}>
                    <b>B</b>
                  </ToolbarButton>
                  <ToolbarButton label="Italic" command="italic" active={formats.italic}>
                    <i>I</i>
                  </ToolbarButton>
                  <ToolbarButton label="Underline" command="underline" active={formats.underline}>
                    <u>U</u>
                  </ToolbarButton>
                  <ToolbarButton label="List" command="insertUnorderedList" active={formats.unorderedList}>
                    • List
                  </ToolbarButton>
                </div>

                {/* Editor Area */}
                <div className="relative">
                  <div
                    ref={editorRef}
                    contentEditable
                    suppressContentEditableWarning
                    className="min-h-[400px] border border-gray-600 rounded-lg p-4 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-gray-900/50 text-white"
                    style={{ whiteSpace: "pre-wrap" }}
                    onInput={() => {
                      const content = editorRef.current?.innerHTML || "";
                      setJournalContent(content);
                      setHasContent(content.trim().length > 0);
                    }}
                  />
                  {journalContent === "" && (
                    <div className="absolute top-4 left-4 text-gray-400 pointer-events-none">
                      Start writing your journal entry...
                    </div>
                  )}
                </div>

                {/* Analysis Button */}
                {hasContent && (
                  <div className="text-center pt-4">
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
            </div>
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
              {!analysis && !isAnalyzing ? (
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
              ) : isAnalyzing && !analysis ? (
                <div className="p-8 text-center">
                  <div className="p-4 bg-gray-700/50 rounded-xl inline-block mb-4">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                      <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                      <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-gray-300">
                    Analyzing Your Entry...
                  </h3>
                  <p className="text-gray-400">
                    Discovering insights and patterns in your writing
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
                  
                  {analysis && !isAnalyzing && (
                    <div className="mt-6 pt-6 border-t border-gray-700">
                      <div className="flex justify-center space-x-4">
                        <button
                          onClick={() => router.push("/workspace/ai-chat")}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors text-sm"
                        >
                          Continue Conversation
                        </button>
                        <button
                          onClick={() => router.push("/dashboard")}
                          className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors text-sm"
                        >
                          Back to Workspaces
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
