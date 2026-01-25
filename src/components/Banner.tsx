"use client";

import { useState, useEffect } from "react";
import { X, LucideIcon } from "lucide-react";

export interface Banner {
  id: string;
  message: string;
  link?: string;
  icon: LucideIcon;
  backgroundColor?: string;
  textColor?: string;
  dismissible?: boolean;
}

interface BannerProps {
  banners: Banner[];
  onDismiss: (id: string) => void;
}

export default function Banner({ banners, onDismiss }: BannerProps) {
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Detect dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains("dark"));
    };

    checkDarkMode();
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  if (banners.length === 0) {
    return null;
  }

  return (
    <div className="mb-6 space-y-3">
      {banners.map((banner) => {
        const Icon = banner.icon;
        return (
          <div
            key={banner.id}
            className={`flex items-center justify-between gap-4 rounded-xl px-4 py-3 ${
              !banner.backgroundColor ? "" : ""
            }`}
            style={
              banner.backgroundColor
                ? { background: banner.backgroundColor }
                : isDarkMode
                  ? {
                      background:
                        "linear-gradient(354deg, rgba(30, 30, 35, 0.95), rgba(35, 35, 40, 0.95), rgba(30, 30, 35, 0.95))",
                      boxShadow: "rgba(0, 0, 0, 0.4) 4px 3px 6px -7px",
                      borderWidth: "1.5px 1px 1px 1.5px",
                      borderStyle: "solid",
                      borderColor:
                        "rgba(60, 60, 70, 0.8) rgba(100, 120, 140, 0.3) rgba(100, 120, 140, 0.3) rgba(60, 60, 70, 0.8)",
                    }
                  : {
                      background:
                        "linear-gradient(354deg, rgb(253 238 238 / 94%), rgba(255, 246, 244, 0.94), rgb(255 236 236 / 94%))",
                      boxShadow: "rgba(170, 228, 243, 0.33) 4px 3px 6px -7px",
                      borderWidth: "1.5px 1px 1px 1.5px",
                      borderStyle: "solid",
                      borderColor:
                        "rgb(255, 247, 234) rgba(170, 228, 243, 0.33) rgb(253 230 230) rgb(255, 247, 234)",
                    }
            }
          >
            <div className="flex items-center gap-3 flex-1">
              <div className="flex-shrink-0">
                <Icon
                  className={`w-5 h-5 ${
                    !banner.textColor ? "dark:text-slate-400" : ""
                  }`}
                  style={{
                    color: banner.textColor
                      ? banner.textColor
                      : isDarkMode
                        ? "#c4b4de"
                        : "#ffa6b5",
                  }}
                />
              </div>
              <div className="flex-1">
                <p
                  className={`text-sm font-medium ${
                    !banner.textColor ? "dark:text-slate-300" : ""
                  }`}
                  style={{
                    color: banner.textColor
                      ? banner.textColor
                      : isDarkMode
                        ? "#c4b4de"
                        : "#ffa6b5",
                  }}
                >
                  {banner.message}
                </p>
              </div>
              {banner.link && (
                <a
                  href={banner.link}
                  className={`text-sm font-medium transition-colors ${
                    !banner.textColor
                      ? "dark:text-purple-400 hover:opacity-80"
                      : "hover:opacity-80"
                  }`}
                  style={{
                    color: banner.textColor
                      ? banner.textColor
                      : isDarkMode
                        ? "#a78bfa"
                        : "#ffa6b5",
                  }}
                >
                  Visit →
                </a>
              )}
            </div>
            {banner.dismissible !== false && (
              <button
                onClick={() => onDismiss(banner.id)}
                className={`flex-shrink-0 p-1 rounded-lg transition-colors ${
                  !banner.textColor
                    ? "hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-400"
                    : "hover:opacity-70"
                }`}
                style={{
                  color: banner.textColor
                    ? banner.textColor
                    : isDarkMode
                      ? "#c4b4de"
                      : "#ffa6b5",
                }}
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
