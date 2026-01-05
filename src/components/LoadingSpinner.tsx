"use client";

import { Loader2, Sparkles } from "lucide-react";

interface LoadingSpinnerProps {
  message?: string;
  size?: "sm" | "md" | "lg";
  variant?: "spinner" | "sparkles" | "dots";
  fullScreen?: boolean;
}

export default function LoadingSpinner({
  message = "Loading...",
  size = "md",
  variant = "spinner",
  fullScreen = false,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  const containerClasses = fullScreen
    ? "fixed inset-0 flex items-center justify-center z-50"
    : "flex flex-col items-center justify-center gap-3 py-12";

  if (variant === "dots") {
    return (
      <div className={containerClasses}>
        <div className="flex gap-2">
          <div
            className={`rounded-full ${sizeClasses[size]} bg-purple-600 dark:bg-purple-500 animate-pulse`}
            style={{
              animationDelay: "0ms",
              animationDuration: "1.4s",
            }}
          />
          <div
            className={`rounded-full ${sizeClasses[size]} bg-purple-600 dark:bg-purple-500 animate-pulse`}
            style={{
              animationDelay: "200ms",
              animationDuration: "1.4s",
            }}
          />
          <div
            className={`rounded-full ${sizeClasses[size]} bg-purple-600 dark:bg-purple-500 animate-pulse`}
            style={{
              animationDelay: "400ms",
              animationDuration: "1.4s",
            }}
          />
        </div>
        {message && (
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {message}
          </p>
        )}
      </div>
    );
  }

  if (variant === "sparkles") {
    return (
      <div className={containerClasses}>
        <div className="relative">
          <Sparkles
            className={`${sizeClasses[size]} text-purple-400 animate-pulse`}
            style={{ animationDuration: "1.5s" }}
          />
          <div className="absolute inset-0 rounded-full bg-purple-500 dark:bg-purple-400 animate-ping opacity-20" />
        </div>
        {message && (
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {message}
          </p>
        )}
      </div>
    );
  }

  // Default spinner
  return (
    <div className={containerClasses}>
      <Loader2
        className={`${sizeClasses[size]} text-purple-400 animate-spin`}
      />
      {message && (
        <p className="text-sm text-slate-600 dark:text-slate-400">{message}</p>
      )}
    </div>
  );
}
