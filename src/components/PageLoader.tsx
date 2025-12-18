"use client";

import { ReactNode, useState, useEffect } from "react";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useThemeContext } from "@/state/context/ThemeContext";
import { useTheme } from "@/features/workspace/hooks/useTheme";
import { getThemeByName, ThemeName } from "@/features/workspace/constants/theme";

interface PageLoaderProps {
  title?: string;
  subtitle?: string;
  message?: string;
  spinnerVariant?: "spinner" | "sparkles" | "dots";
  fullHeight?: boolean;
  withBackground?: boolean;
  className?: string;
  children?: ReactNode;
}

// Helper to get MODE (dark/light) immediately from DOM/localStorage (before React hydrates)
// IMPORTANT: PageLoader should ALWAYS use MODE (dark/light), never workspace themes (like "red"/"cherry")
// It determines mode from: 1) Global saved preference, 2) Browser preference, 3) HTML class
function getInitialThemeSync(): { themeName: ThemeName; darkMode: boolean; theme: ReturnType<typeof getThemeByName> } {
  if (typeof window === "undefined") {
    return { themeName: "light", darkMode: false, theme: getThemeByName("light") };
  }

  try {
    // Check if HTML already has dark class (set by blocking script)
    const htmlHasDark = document.documentElement.classList.contains("dark");
    const htmlHasLight = document.documentElement.classList.contains("light");
    
    // Check localStorage for saved GLOBAL preference (not workspace theme)
    const savedThemeName = localStorage.getItem("themeName") as ThemeName | null;
    const themeGlobal = localStorage.getItem("themeGlobal");
    
    console.log('[PageLoader] Mode detection:', {
      htmlHasDark,
      htmlHasLight,
      savedThemeName,
      themeGlobal,
      htmlClasses: document.documentElement.className
    });
    
    let darkMode = false;
    let themeName: ThemeName = "light";
    
    // Determine MODE (dark/light) - ignore workspace themes completely
    if (themeGlobal === "1" && savedThemeName && ["light", "dark"].includes(savedThemeName)) {
      // User has manually set a global theme (only light/dark are global)
      darkMode = savedThemeName === "dark";
      themeName = savedThemeName;
      console.log('[PageLoader] Using saved global MODE:', darkMode ? 'dark' : 'light');
    } else if (htmlHasDark) {
      // HTML class was set by blocking script based on browser preference
      darkMode = true;
      themeName = "dark";
      console.log('[PageLoader] Using HTML dark class (MODE: dark)');
    } else if (htmlHasLight) {
      // HTML class was set to light
      darkMode = false;
      themeName = "light";
      console.log('[PageLoader] Using HTML light class (MODE: light)');
    } else {
      // Fallback to browser preference
      darkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;
      themeName = darkMode ? "dark" : "light";
      console.log('[PageLoader] Using browser preference (MODE):', darkMode ? 'dark' : 'light');
    }
    
    // Always use light or dark theme, never red/cherry
    const finalThemeName: ThemeName = darkMode ? "dark" : "light";
    console.log('[PageLoader] Final MODE (always light/dark):', { themeName: finalThemeName, darkMode });
    return { themeName: finalThemeName, darkMode, theme: getThemeByName(finalThemeName) };
  } catch (error) {
    console.error('[PageLoader] Error detecting mode:', error);
    return { themeName: "light", darkMode: false, theme: getThemeByName("light") };
  }
}

export default function PageLoader({
  title = "Loading",
  subtitle,
  message = "This will only take a moment.",
  spinnerVariant = "sparkles",
  fullHeight = true,
  withBackground = true,
  className = "",
  children,
}: PageLoaderProps) {
  // Get initial theme synchronously (before React context is ready)
  const [initialTheme] = useState(() => getInitialThemeSync());
  
  // Once React context is ready, use it (for updates)
  const contextTheme = useThemeContext();
  const contextThemeColors = useTheme();
  
  // Use initial sync values first, then update when context is ready
  const [darkMode, setDarkMode] = useState(initialTheme.darkMode);
  const [theme, setTheme] = useState(initialTheme.theme);
  
  // Update when context is ready OR when HTML class changes (for immediate updates)
  // IMPORTANT: PageLoader should ALWAYS use MODE (dark/light), never workspace themes
  // Extract darkMode from context or HTML class, but always use light or dark theme, never red/cherry
  useEffect(() => {
    // Re-check HTML class in case it was updated (e.g., when leaving workspace)
    const htmlHasDark = document.documentElement.classList.contains("dark");
    const htmlHasLight = document.documentElement.classList.contains("light");
    const htmlDarkMode = htmlHasDark || (!htmlHasLight && window.matchMedia("(prefers-color-scheme: dark)").matches);
    
    // Check localStorage for global preference
    const savedThemeName = localStorage.getItem("themeName") as ThemeName | null;
    const themeGlobal = localStorage.getItem("themeGlobal");
    
    // Determine the correct mode
    let correctDarkMode = false;
    if (themeGlobal === "1" && savedThemeName && ["light", "dark"].includes(savedThemeName)) {
      correctDarkMode = savedThemeName === "dark";
    } else {
      correctDarkMode = htmlDarkMode;
    }
    
    // Also check context if it's ready
    let contextDarkMode = correctDarkMode;
    let contextThemeName: ThemeName = correctDarkMode ? "dark" : "light";
    
    if (contextTheme.darkMode !== undefined) {
      const ctxDarkMode = contextTheme.darkMode;
      const ctxThemeName = contextTheme.themeName;
      
      // If context has a workspace-only theme (red/cherry), extract the darkMode but use light/dark theme
      if (ctxThemeName === "red") {
        contextDarkMode = ctxDarkMode;
        contextThemeName = ctxDarkMode ? "dark" : "light";
        console.log('[PageLoader] Context has workspace theme "red", using MODE only:', contextDarkMode ? 'dark' : 'light');
      } else if (["light", "dark"].includes(ctxThemeName)) {
        contextDarkMode = ctxDarkMode;
        contextThemeName = ctxThemeName;
      }
    }
    
    // Use the most authoritative source: context if available and valid, otherwise HTML/localStorage
    const finalDarkMode = contextTheme.darkMode !== undefined ? contextDarkMode : correctDarkMode;
    const finalThemeName: ThemeName = finalDarkMode ? "dark" : "light";
    
    // If the mode has changed, update immediately
    if (finalDarkMode !== darkMode) {
      console.log('[PageLoader] Mode changed, updating to:', finalDarkMode ? 'dark' : 'light');
      setDarkMode(finalDarkMode);
      setTheme(getThemeByName(finalThemeName));
    }
  }, [contextTheme.darkMode, contextTheme.themeName, darkMode]);

  const containerHeight = fullHeight ? "min-h-screen w-full" : "h-full w-full";

  return (
    <div
      className={`${containerHeight} flex items-center justify-center px-6 py-12 ${className}`.trim()}
      style={withBackground ? {
        backgroundColor: theme.workspace,
        color: theme.textPrimary,
      } : undefined}
    >
      <div className="relative overflow-visible rounded-[32px] px-10 py-12">
        <div 
          className="pointer-events-none absolute top-1/2 left-1/2 h-48 w-48 rounded-full blur-3xl" 
          style={{ 
            backgroundColor: darkMode ? 'rgba(168, 85, 247, 0.25)' : 'rgba(168, 85, 247, 0.3)',
            transformOrigin: 'center',
            animation: 'rotateOrbit 5s linear infinite'
          }} 
        />
        <div 
          className="pointer-events-none absolute top-1/2 left-1/2 h-52 w-52 rounded-full blur-3xl"
          style={{ 
            backgroundColor: darkMode ? `${theme.info}40` : 'rgba(59, 130, 246, 0.3)',
            transformOrigin: 'center',
            animation: 'rotateOrbit 6s linear infinite reverse'
          }} 
        />

        <div className="relative flex flex-col items-center text-center gap-4">
          {/* <LoadingSpinner variant={spinnerVariant} size="lg" message="" /> */}
          {title && (
            <h2 className="text-2xl font-semibold" style={{ color: theme.textPrimary }}>
              {title}
            </h2>
          )}
          {/* {subtitle && (
            <p className="max-w-md text-base leading-relaxed" style={{ color: theme.textSecondary }}>
              {subtitle}
            </p>
          )} */}
          {message && (
            <p className="text-sm" style={{ color: theme.textMuted }}>
              {message}
            </p>
          )}
          {children && <div className="mt-4 flex flex-col items-center gap-3">{children}</div>}
        </div>
      </div>
    </div>
  );
}

