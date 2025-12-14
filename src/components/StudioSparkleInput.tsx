"use client";

import { Sparkles } from "lucide-react";
import { useTheme } from "@/features/workspace/hooks/useTheme";

interface StudioSparkleInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  onFocus?: () => void;
  onClick?: () => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  className?: string;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}

export default function StudioSparkleInput({
  value,
  onChange,
  placeholder = "Ask the Studio Assistant",
  onFocus,
  onClick,
  onKeyDown,
  className = "",
  inputRef
}: StudioSparkleInputProps) {
  const theme = useTheme();
  
  return (
    <div className={`relative ${className}`}>
      <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400 z-10" />
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        type="text"
        value={value}
        onFocus={onFocus}
        onClick={onClick}
        onKeyDown={onKeyDown}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full pl-9 pr-5 py-2 rounded-full focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 focus:border-transparent border border-transparent shadow-sm"
        style={{
          backgroundColor: theme.surface,
          borderColor: theme.border,
          color: theme.textPrimary,
        }}
      />
    </div>
  );
}

