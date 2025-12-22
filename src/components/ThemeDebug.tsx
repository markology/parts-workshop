"use client";

import { useThemeContext } from "@/state/context/ThemeContext";
import { useEffect, useState } from "react";

export default function ThemeDebug() {
  const { themeName, darkMode, setThemeName } = useThemeContext();
  const [isVisible, setIsVisible] = useState(false);
  const [browserPref, setBrowserPref] = useState<string>("");
  const [savedTheme, setSavedTheme] = useState<string>("");
  const [themeGlobal, setThemeGlobal] = useState<string>("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setBrowserPref(prefersDark ? "dark" : "light");
    
    const saved = localStorage.getItem("themeName");
    const global = localStorage.getItem("themeGlobal");
    setSavedTheme(saved || "none");
    setThemeGlobal(global || "none");
  }, [themeName]);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 z-[9999] bg-purple-600 text-white px-3 py-2 rounded-lg text-xs shadow-lg"
      >
        Show Theme Debug
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-[9999] bg-white dark:bg-slate-900 border-2 border-purple-500 rounded-lg p-4 shadow-2xl max-w-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white">Theme Debug</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        >
          ✕
        </button>
      </div>
      
      <div className="space-y-2 text-xs">
        <div className="flex justify-between">
          <span className="text-slate-600 dark:text-slate-400">Current Theme:</span>
          <span className="font-mono font-bold text-purple-600 dark:text-purple-400">{themeName}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-slate-600 dark:text-slate-400">Dark Mode:</span>
          <span className="font-mono font-bold">{darkMode ? "true" : "false"}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-slate-600 dark:text-slate-400">Browser Pref:</span>
          <span className="font-mono">{browserPref}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-slate-600 dark:text-slate-400">Saved Theme:</span>
          <span className="font-mono">{savedTheme}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-slate-600 dark:text-slate-400">Global Flag:</span>
          <span className="font-mono">{themeGlobal}</span>
        </div>
        
        <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Quick Toggle:</p>
          <div className="flex gap-2">
            <button
              onClick={() => setThemeName("light", true)}
              className="px-2 py-1 bg-blue-500 text-white rounded text-xs"
            >
              Light (Global)
            </button>
            <button
              onClick={() => setThemeName("dark", true)}
              className="px-2 py-1 bg-gray-800 text-white rounded text-xs"
            >
              Dark (Global)
            </button>
            <button
              onClick={() => {
                localStorage.removeItem("themeGlobal");
                localStorage.removeItem("themeName");
                window.location.reload();
              }}
              className="px-2 py-1 bg-red-500 text-white rounded text-xs"
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

