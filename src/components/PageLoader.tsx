"use client";

import { ReactNode } from "react";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useThemeContext } from "@/state/context/ThemeContext";

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
  const { darkMode } = useThemeContext();

  const backgroundClasses = withBackground
    ? darkMode
      ? "bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white"
      : "bg-gradient-to-br from-indigo-50 via-white to-sky-50 text-slate-900"
    : "";

  const containerHeight = fullHeight ? "min-h-screen w-full" : "h-full w-full";

  return (
    <div
      className={`${backgroundClasses} ${containerHeight} flex items-center justify-center px-6 py-12 ${className}`.trim()}
    >
      <div className="relative overflow-visible rounded-[32px] px-10 py-12">
        <div 
          className="pointer-events-none absolute top-1/2 left-1/2 h-48 w-48 rounded-full bg-purple-500/25 blur-3xl" 
          style={{ 
            transformOrigin: 'center',
            animation: 'rotateOrbit 5s linear infinite'
          }} 
        />
        <div 
          className="pointer-events-none absolute top-1/2 left-1/2 h-52 w-52 rounded-full bg-sky-400/25 blur-3xl"
          style={{ 
            transformOrigin: 'center',
            animation: 'rotateOrbit 6s linear infinite reverse'
          }} 
        />

        <div className="relative flex flex-col items-center text-center gap-4">
          {/* <LoadingSpinner variant={spinnerVariant} size="lg" message="" /> */}
          {title && (
            <h2 className={`text-2xl font-semibold ${darkMode ? "text-slate-100" : "text-slate-800"}`}>
              {title}
            </h2>
          )}
          {/* {subtitle && (
            <p className="max-w-md text-base leading-relaxed text-black">
              {subtitle}
            </p>
          )} */}
          {message && (
            <p className={`text-sm ${darkMode ? "text-slate-500" : "text-slate-500/90"}`}>
              {message}
            </p>
          )}
          {children && <div className="mt-4 flex flex-col items-center gap-3">{children}</div>}
        </div>
      </div>
    </div>
  );
}

