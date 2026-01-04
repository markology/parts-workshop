"use client";

import { Sparkles } from "lucide-react";

interface StudioAssistantButtonProps {
  placeholder?: string;
  onClick?: () => void;
  className?: string;
}

export default function StudioAssistantButton({
  placeholder = "Ask the Studio Assistant",
  onClick,
  className = "",
}: StudioAssistantButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`w-[320] px-5 py-2 rounded-full border-0 shadow-sm transition-all duration-200 hover:opacity-90 text-center flex items-center justify-center gap-2 ${className} bg-[var(--theme-assistant-button-bg)]`}
    >
      <Sparkles className="w-4 h-4" style={{ color: "#be54fe" }} />
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
