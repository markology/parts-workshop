"use client";

import { useState } from "react";
import {
  NodeBackgroundColors,
  NodeTextColors,
} from "@/features/workspace/constants/Nodes";
import { Minus, Plus } from "lucide-react"; // optional: use any icon library
import { ImpressionType } from "@/types/Impressions";
import { SidebarImpression } from "@/types/Sidebar";
import { useSidebarStore } from "@/state/Sidebar";

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
  const removeImpression = useSidebarStore((s) => s.removeImpression);
  const isImpressionsEmpty = !Object.keys(filteredImpressions).length;
  const emptyOpacityStyle = isImpressionsEmpty ? 0.4 : 1;
  return (
    <div className="mb-2">
      <button
        className={`capitalize flex items-center justify-between w-full p-2 text-left font-semibold rounded hover:bg-["${NodeBackgroundColors[type]}"]`}
        disabled={isImpressionsEmpty}
        onClick={() => toggleOpen(!open)}
        style={{
          color: NodeBackgroundColors[type],
          opacity: emptyOpacityStyle,
        }}
      >
        <p
          style={{
            color: NodeBackgroundColors[type],
          }}
        >
          {type}
        </p>
        {open ? (
          <Minus
            style={{
              opacity: emptyOpacityStyle,
            }}
            size={16}
            strokeWidth={3}
          />
        ) : (
          <Plus
            style={{
              opacity: emptyOpacityStyle,
            }}
            size={16}
            strokeWidth={3}
          />
        )}
      </button>
      <hr className="pb-2" />
      <div className="flex flex-col gap-[6px]">
        {open &&
          Object.values(filteredImpressions).map((item) => (
            <div
              key={item.id}
              className="sidebar-impression text-white input draggable rounded-lg px-3 py-1 cursor-grab flex justify-between items-center"
              onDragStart={(event) => onDragStart(event, item.id, item.type)}
              draggable
              style={{
                background: NodeBackgroundColors[item.type],
              }}
            >
              <span>{item.label}</span>
              <button
                className="px-1"
                style={{ color: NodeTextColors[item.type] }}
                onClick={() => removeImpression(item.type, item.id)}
              >
                x
              </button>
            </div>
          ))}
      </div>
    </div>
  );
};

export default ImpressionDropdown;
