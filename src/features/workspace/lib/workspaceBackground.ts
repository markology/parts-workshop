"use client";

const STORAGE_KEY = "workspace-bg-color";

export const getWorkspaceBgColor = (fallback = "#f8fafc") => {
  if (typeof window === "undefined") return fallback;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored || fallback;
};

export const setWorkspaceBgColor = (color: string) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, color);
  window.dispatchEvent(new CustomEvent("workspace-bg-color-changed", { detail: color }));
};

