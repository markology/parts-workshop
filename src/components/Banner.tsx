"use client";

import { X, LucideIcon } from "lucide-react";

export interface Banner {
  id: string;
  message: string;
  link?: string;
  icon: LucideIcon;
  backgroundColor?: string;
  textColor?: string;
}

interface BannerProps {
  banners: Banner[];
  onDismiss: (id: string) => void;
}

export default function Banner({ banners, onDismiss }: BannerProps) {
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
            style={{
              background: banner.backgroundColor
                ? banner.backgroundColor
                : "linear-gradient(145deg, rgba(124, 135, 169, 0.94), #9f75dd, rgba(124, 135, 169, 0.94))",
              boxShadow: "rgba(170, 228, 243, 0.33) 4px 3px 6px -7px",
              borderTop: "#fff4f6 1.5px solid",
              borderLeft: "#ffffff 1.5px solid",
              borderRight: "rgba(170, 228, 243, 0.33) 1px solid",
              borderBottom: "rgba(170, 228, 243, 0.33) 1px solid",
            }}
          >
            <div className="flex items-center gap-3 flex-1">
              <div className="flex-shrink-0">
                <Icon
                  className={`w-5 h-5 ${
                    !banner.textColor ? "dark:text-slate-400" : ""
                  }`}
                  style={{
                    color: banner.textColor || "rgb(255 255 255 / 72%)",
                  }}
                />
              </div>
              <div className="flex-1">
                <p
                  className={`text-sm ${
                    !banner.textColor ? "dark:text-slate-300" : ""
                  }`}
                  style={{
                    color: banner.textColor || "rgb(255 255 255 / 72%)",
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
                    color: banner.textColor || "rgb(255 255 255 / 72%)",
                  }}
                >
                  Visit →
                </a>
              )}
            </div>
            <button
              onClick={() => onDismiss(banner.id)}
              className={`flex-shrink-0 p-1 rounded-lg transition-colors ${
                !banner.textColor
                  ? "hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-400"
                  : "hover:opacity-70"
              }`}
              style={{
                color: banner.textColor || "rgb(255 255 255 / 72%)",
              }}
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
