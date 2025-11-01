"use client";

import { useState } from "react";
import { NodeBackgroundColors, NodeTextColors } from "@/features/workspace/constants/Nodes";
import { ChevronDown, ChevronUp, GripVertical, X } from "lucide-react";
import { ImpressionType } from "@/features/workspace/types/Impressions";
import { SidebarImpression } from "@/features/workspace/types/Sidebar";
import { useWorkingStore } from "@/features/workspace/state/stores/useWorkingStore";
import { useThemeContext } from "@/state/context/ThemeContext";

const toRgba = (hex: string, opacity: number) => {
  const sanitized = hex.replace("#", "");
  const bigint = parseInt(sanitized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

const ImpressionDropdown = ({
  type,
  filteredImpressions,
  onDragStart,
}: {
  type: ImpressionType;
  filteredImpressions: Record<string, SidebarImpression>;
  onDragStart: (
    event: React.DragEvent<HTMLDivElement>,
    draggableId: string,
    type: ImpressionType
  ) => void;
}) => {
  const [open, toggleOpen] = useState(true);
  const isImpressionsEmpty = !filteredImpressions || !Object.keys(filteredImpressions).length;
  const count = Object.keys(filteredImpressions || {}).length;
  const { darkMode } = useThemeContext();
  const accent = NodeBackgroundColors[type];
  const accentText = NodeTextColors[type] || accent;
  const cardBorder = toRgba(accent, darkMode ? 0.55 : 0.34);
  const cardBackground = isImpressionsEmpty
    ? darkMode
      ? "rgba(18,28,40,0.3)"
      : "rgba(248,250,252,0.7)"
    : toRgba(accent, darkMode ? 0.3 : 0.18);
  const disabledBackground = darkMode ? "rgba(18,28,40,0.24)" : "rgba(248,250,252,0.65)";
  const chipBackground = toRgba(accent, darkMode ? 0.45 : 0.24);
  const chipBorder = toRgba(accent, darkMode ? 0.65 : 0.32);
  const removeHover = toRgba(accent, 0.35);

  return (
    <div className="mb-3">
      <button
        type="button"
        onClick={() => !isImpressionsEmpty && toggleOpen(!open)}
        disabled={isImpressionsEmpty}
        className={`w-full rounded-lg border px-3 py-1.5 text-left text-sm transition-all duration-200 ${
          open && !isImpressionsEmpty ? "shadow-[0_14px_28px_rgba(15,23,42,0.08)]" : "hover:-translate-y-[1px]"
        } ${isImpressionsEmpty ? "cursor-not-allowed" : "cursor-pointer"}`}
        style={{
          borderColor: cardBorder,
          backgroundColor: isImpressionsEmpty ? disabledBackground : cardBackground,
          color: darkMode ? "#f8fafc" : accentText,
          opacity: isImpressionsEmpty ? 0.55 : 1,
        }}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.28em]"
              style={{ color: darkMode ? "#f8fafc" : accentText }}
            >
              {type}
            </p>
            <p className="text-[10px] uppercase tracking-[0.28em] text-slate-400 dark:text-slate-400">
              {count} items
            </p>
          </div>
          {!isImpressionsEmpty ? (
            open ? (
              <ChevronUp size={15} strokeWidth={2.4} />
            ) : (
              <ChevronDown size={15} strokeWidth={2.4} />
            )
          ) : null}
        </div>
      </button>

      {open && filteredImpressions && Object.values(filteredImpressions).length > 0 && (
        <div className="mt-2 space-y-2">
          {Object.values(filteredImpressions).map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-sm font-medium shadow-sm transition-all duration-150 hover:-translate-y-[1px] cursor-grab"
              onDragStart={(event) => onDragStart(event, item.id, item.type)}
              draggable
              style={{
                backgroundColor: chipBackground,
                borderColor: chipBorder,
                color: darkMode ? "rgba(255,255,255,0.92)" : accentText,
              }}
            >
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <GripVertical className="h-4 w-4 opacity-70" />
                <span className="truncate">{item.label}</span>
              </div>
              <button
                type="button"
                className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-xs transition-colors hover:bg-white/20"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  useWorkingStore
                    .getState()
                    .removeImpression({ type: item.type, id: item.id });
                }}
                style={{
                  color: darkMode ? "rgba(255,255,255,0.75)" : accentText,
                }}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImpressionDropdown;