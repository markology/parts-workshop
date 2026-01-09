"use client";

import Image from "next/image";
import Link from "next/link";
import { useThemeContext } from "@/state/context/ThemeContext";
import { useTheme } from "@/features/workspace/hooks/useTheme";

interface PartsStudioLogoProps {
  showText?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const PartsStudioLogo = ({ 
  showText = true, 
  size = "md",
  className = "" 
}: PartsStudioLogoProps) => {
  const { isDark: darkMode } = useThemeContext();
  const theme = useTheme();

  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-12 h-12"
  };

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-lg",
    lg: "text-xl"
  };

  return (
    <Link 
      href="/" 
      className={`inline-flex items-center gap-2.5 group ${className}`}
    >
      <div className={`${sizeClasses[size]} relative transition-all group-hover:scale-105`}>
        <Image
          src="/official_logo_complete.svg"
          alt="Parts Studio Logo"
          width={size === "sm" ? 24 : size === "md" ? 32 : 48}
          height={size === "sm" ? 24 : size === "md" ? 32 : 48}
          className="object-contain"
          style={{
            filter: darkMode ? 'brightness(0) invert(1)' : 'none',
          }}
          priority
        />
      </div>
      {showText && (
        <span
          className={`font-semibold ${textSizeClasses[size]} tracking-tight`}
          style={{
            color: darkMode ? theme.textPrimary : "#0f172a",
          }}
        >
          Parts Studio
        </span>
      )}
    </Link>
  );
};

export default PartsStudioLogo;

