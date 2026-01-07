"use client";

import { ReactNode, useState, useEffect } from "react";
import Image from "next/image";
import LoadingSpinner from "@/components/LoadingSpinner";
import { ThemePref, useThemeContext } from "@/state/context/ThemeContext";
import { useTheme } from "@/features/workspace/hooks/useTheme";
import { getThemeWithMode } from "@/features/workspace/constants/theme";

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
// IMPORTANT: PageLoader should ALWAYS use MODE (dark/light), never workspace variants (like "red")
// It determines mode from: 1) Global saved themePref, 2) Browser preference, 3) HTML class
function getInitialThemeSync(): {
  darkMode: boolean;
  theme: ReturnType<typeof getThemeWithMode>;
} {
  if (typeof window === "undefined") {
    return { darkMode: false, theme: getThemeWithMode("default", false) };
  }

  try {
    // Check if HTML already has dark class (set by blocking script)
    const htmlHasDark = document.documentElement.classList.contains("dark");
    const htmlHasLight = document.documentElement.classList.contains("light");

    // Check localStorage for saved GLOBAL preference
    const savedThemePref = localStorage.getItem(
      "themePref"
    ) as ThemePref | null;
    const themePref: ThemePref = savedThemePref || "system";

    // console.log('[PageLoader] Mode detection:', {
    //   htmlHasDark,
    //   htmlHasLight,
    //   themePref,
    //   htmlClasses: document.documentElement.className
    // });

    let darkMode = false;

    // Determine MODE (dark/light) from themePref
    if (themePref === "dark") {
      darkMode = true;
    } else if (themePref === "light") {
      darkMode = false;
    } else if (htmlHasDark) {
      // HTML class was set by blocking script
      darkMode = true;
    } else if (htmlHasLight) {
      darkMode = false;
    } else {
      // Fallback to browser preference (system mode)
      darkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;
    }

    // Get theme colors (always use default variant for PageLoader)
    const theme = getThemeWithMode("default", darkMode);
    return { darkMode, theme };
  } catch (error) {
    console.error("[PageLoader] Error detecting mode:", error);
    return { darkMode: false, theme: getThemeWithMode("default", false) };
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

  // Use initial sync values first, then update when context is ready
  const [darkMode, setDarkMode] = useState(initialTheme.darkMode);
  const [theme, setTheme] = useState(initialTheme.theme);

  // Update when context is ready OR when HTML class changes (for immediate updates)
  // IMPORTANT: PageLoader should ALWAYS use MODE (dark/light), never workspace variants
  useEffect(() => {
    // Re-check HTML class in case it was updated (e.g., when leaving workspace)
    const htmlHasDark = document.documentElement.classList.contains("dark");
    const htmlHasLight = document.documentElement.classList.contains("light");
    const htmlDarkMode =
      htmlHasDark ||
      (!htmlHasLight &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);

    // Check localStorage for global preference
    const savedThemePref = localStorage.getItem(
      "themePref"
    ) as ThemePref | null;
    const themePref: ThemePref = savedThemePref || "system";

    // Determine the correct mode
    let correctDarkMode = false;
    if (themePref === "dark") {
      correctDarkMode = true;
    } else if (themePref === "light") {
      correctDarkMode = false;
    } else {
      correctDarkMode = htmlDarkMode;
    }

    // Use context if available, otherwise use computed value
    const finalDarkMode =
      contextTheme.isDark !== undefined ? contextTheme.isDark : correctDarkMode;

    // If the mode has changed, update immediately (always use default variant for PageLoader)
    if (finalDarkMode !== darkMode) {
      setDarkMode(finalDarkMode);
      setTheme(getThemeWithMode("default", finalDarkMode));
    }
  }, [contextTheme.isDark, darkMode]);

  const containerHeight = fullHeight ? "min-h-screen w-full" : "h-full w-full";

  return (
    <div
      className={`${containerHeight} flex items-center justify-center px-6 py-12 ${withBackground ? "bg-[#f8fafc] dark:bg-[#3D434B]" : ""} ${className}`.trim()}
    >
      <div className="relative overflow-visible">
        <div
          className="pointer-events-none absolute top-1/2 left-1/2 rounded-full blur-3xl"
          style={{
            height: "320px",
            width: "320px",
            backgroundColor: darkMode
              ? "rgba(168, 85, 247, 0.25)"
              : "rgba(168, 85, 247, 0.3)",
            transformOrigin: "center",
            transform: "translate(-50%, -50%) translateX(-80px)",
            animation: "rotateOrbit 5s linear infinite",
          }}
        />
        <div
          className="pointer-events-none absolute top-1/2 left-1/2 rounded-full blur-3xl"
          style={{
            height: "360px",
            width: "360px",
            backgroundColor: darkMode
              ? `${theme.info}40`
              : "rgba(59, 130, 246, 0.3)",
            transformOrigin: "center",
            transform: "translate(-50%, -50%) translateX(80px)",
            animation: "rotateOrbit 6s linear infinite reverse",
          }}
        />
        <div
          className="relative flex flex-col items-center text-center"
          style={{ gap: "10px" }}
        >
          <div className="relative h-[100px] w-[115px]">
            <Image
              src="/official_logo_complete.svg"
              alt="Parts Studio Logo"
              width={115}
              height={115}
              className="object-contain h-[115px] w-[115px] dark:brightness-0 dark:invert"
              priority
            />
          </div>
          {title && (
            <h2 className="text-xl font-semibold text-black dark:text-white">
              {title}
            </h2>
          )}
          {message && (
            <p className="text-sm text-black dark:text-white">{message}</p>
          )}
          {children && (
            <div className="mt-2 flex flex-col items-center gap-3">
              {children}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
