"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, GripVertical, X } from "lucide-react";
import { ImpressionType } from "@/features/workspace/types/Impressions";
import { SidebarImpression } from "@/features/workspace/types/Sidebar";
import { useWorkingStore } from "@/features/workspace/state/stores/useWorkingStore";
import { useThemeContext } from "@/state/context/ThemeContext";
import { getImpressionBaseColors, getImpressionSidebarHeaderBg, getImpressionPillFontColor, getImpressionHeaderBorderColor } from "@/features/workspace/constants/ImpressionColors";

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
  const baseColors = getImpressionBaseColors(darkMode)[type];
  const sidebarHeaderBg = getImpressionSidebarHeaderBg(type, darkMode);

  return (
    <div className="mb-3">
      <button
        type="button"
        onClick={() => !isImpressionsEmpty && toggleOpen(!open)}
        disabled={isImpressionsEmpty}
        className={`w-full rounded-lg border px-3 py-1.5 text-left text-sm transition-all duration-200 ${
          open && !isImpressionsEmpty ? "shadow-[0_14px_28px_rgba(15,23,42,0.08)]" : !isImpressionsEmpty ? "hover:-translate-y-[1px]" : ""
        } ${isImpressionsEmpty ? "cursor-not-allowed" : "cursor-pointer"}`}
        style={{
          borderColor: isImpressionsEmpty 
            ? (darkMode ? "transparent" : getImpressionHeaderBorderColor(type, darkMode))
            : getImpressionHeaderBorderColor(type, darkMode),
          borderWidth: "2px",
          borderStyle: "solid",
          backgroundColor: isImpressionsEmpty && !darkMode ? "rgb(255, 255, 255)" : sidebarHeaderBg,
          color: darkMode ? "rgb(255, 255, 255)" : baseColors.font,
          opacity: isImpressionsEmpty ? 0.55 : 1,
        }}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.28em]"
              style={{ color: darkMode ? "rgb(255, 255, 255)" : baseColors.font }}
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
          {Object.values(filteredImpressions).map((item, index) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm font-medium shadow-sm transition-all duration-150 hover:-translate-y-[1px] cursor-grab relative"
              onDragStart={(event) => onDragStart(event, item.id, item.type)}
              draggable
              style={{
                backgroundColor: baseColors.background,
                border: 'none',
                color: getImpressionPillFontColor(item.type, darkMode),
                zIndex: index === 0 ? 10 : 1,
                marginTop: index === 0 ? '4px' : '0',
              }}
            >
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <GripVertical className="h-4 w-4 opacity-70" />
                <span className="break-words">{item.label}</span>
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
                  color: getImpressionPillFontColor(item.type, darkMode),
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