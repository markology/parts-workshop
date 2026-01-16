"use client";

import { X, LucideIcon } from "lucide-react";

export interface Notification {
  id: string;
  message: string;
  link?: string;
  icon: LucideIcon;
  backgroundColor?: string;
  textColor?: string;
}

interface NotificationBannerProps {
  notifications: Notification[];
  onDismiss: (id: string) => void;
}

export default function NotificationBanner({
  notifications,
  onDismiss,
}: NotificationBannerProps) {
  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="mb-6 space-y-3">
      {notifications.map((notification) => {
        const Icon = notification.icon;
        return (
          <div
            key={notification.id}
            className={`flex items-center justify-between gap-4 rounded-xl px-4 py-3 shadow-sm ${
              !notification.backgroundColor
                ? "bg-white/90 dark:bg-slate-950/40"
                : ""
            }`}
            style={{
              backgroundColor: notification.backgroundColor || undefined,
            }}
          >
            <div className="flex items-center gap-3 flex-1">
              <div className="flex-shrink-0">
                <Icon
                  className={`w-5 h-5 ${
                    !notification.textColor
                      ? "text-slate-600 dark:text-slate-400"
                      : ""
                  }`}
                  style={{
                    color: notification.textColor || undefined,
                  }}
                />
              </div>
              <div className="flex-1">
                <p
                  className={`text-sm ${
                    !notification.textColor
                      ? "text-slate-700 dark:text-slate-300"
                      : ""
                  }`}
                  style={{
                    color: notification.textColor || undefined,
                  }}
                >
                  {notification.message}
                </p>
              </div>
              {notification.link && (
                <a
                  href={notification.link}
                  className={`text-sm font-medium transition-colors ${
                    !notification.textColor
                      ? "text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
                      : "hover:opacity-80"
                  }`}
                  style={{
                    color: notification.textColor || undefined,
                  }}
                >
                  Visit →
                </a>
              )}
            </div>
            <button
              onClick={() => onDismiss(notification.id)}
              className={`flex-shrink-0 p-1 rounded-lg transition-colors ${
                !notification.textColor
                  ? "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400"
                  : "hover:opacity-70"
              }`}
              style={{
                color: notification.textColor || undefined,
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
