"use client";

import { Sparkles } from "lucide-react";
import { useTheme } from "@/features/workspace/hooks/useTheme";
import { useThemeContext } from "@/state/context/ThemeContext";

interface StudioSparkleInputProps {
  placeholder?: string;
  onClick?: () => void;
  className?: string;
}

export default function StudioSparkleInput({
  placeholder = "Ask the Studio Assistant",
  onClick,
  className = "",
}: StudioSparkleInputProps) {
  const theme = useTheme();
  const { darkMode } = useThemeContext();
  
  return (
    <button
      onClick={onClick}
      className={`px-5 py-2 rounded-full border-0 shadow-sm transition-all duration-200 hover:opacity-90 text-center flex items-center justify-center gap-2 ${className}`}
      style={{
        width: '320px',
        backgroundColor: darkMode ? theme.surface : "#ffffff",
      }}
    >
      <Sparkles className="w-4 h-4" style={{ color: '#be54fe' }} />
      <span
        style={{
          background: 'linear-gradient(90deg, #be54fe, #6366f1, #0ea5e9)',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
        }}
      >
        {placeholder}
      </span>
    </button>
  );
}
