"use client";

import { Sparkles } from "lucide-react";

interface StudioAssistantButtonProps {
  placeholder?: string;
  onClick?: () => void;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export default function StudioAssistantButton({
  placeholder = "Ask the Studio Assistant",
  onClick,
  className = "",
  size = "md",
}: StudioAssistantButtonProps) {
  const sizeClasses = {
    sm: {
      button: "px-3 py-1.5 text-xs",
      icon: "w-3.5 h-3.5",
      gap: "gap-1.5",
    },
    md: {
      button: "px-5 py-2 text-sm",
      icon: "w-4 h-4",
      gap: "gap-2",
    },
    lg: {
      button: "px-6 py-2.5 text-base",
      icon: "w-5 h-5",
      gap: "gap-2.5",
    },
  };

  const currentSize = sizeClasses[size];

  return (
    <button
      onClick={onClick}
      className={`w-[320] ${currentSize.button} rounded-full border-0 transition-all duration-200 hover:opacity-90 text-center flex items-center justify-center ${currentSize.gap} ${className} bg-[var(--theme-assistant-button-bg)]`}
    >
      <Sparkles className={currentSize.icon} style={{ color: "#be54fe" }} />
      <span
        style={{
          background: "linear-gradient(90deg, #be54fe, #6366f1, #0ea5e9)",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
        }}
      >
        {placeholder}
      </span>
    </button>
  );
}
