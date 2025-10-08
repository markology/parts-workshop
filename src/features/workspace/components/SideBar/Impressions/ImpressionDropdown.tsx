"use client";

import { useState } from "react";
import { NodeBackgroundColors } from "@/features/workspace/constants/Nodes";
import { Minus, Plus } from "lucide-react"; // optional: use any icon library
import { ImpressionType } from "@/features/workspace/types/Impressions";
import { SidebarImpression } from "@/features/workspace/types/Sidebar";
import { useWorkingStore } from "@/features/workspace/state/stores/useWorkingStore";

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
      <hr className="pb-2 text-black" />
      <div className="flex flex-col gap-[6px]">
        {open &&
          filteredImpressions &&
          Object.values(filteredImpressions).map((item) => (
            <div
              key={item.id}
              className="sidebar-impression text-white input draggable rounded-lg px-3 py-1 cursor-grab flex justify-between items-center shadow-md"
              onDragStart={(event) => onDragStart(event, item.id, item.type)}
              draggable
              style={{
                background: NodeBackgroundColors[item.type],
              }}
            >
              <span>{item.label}</span>
              <button
                className={`px-1`}
                onClick={() =>
                  useWorkingStore
                    .getState()
                    .removeImpression({ type: item.type, id: item.id })
                }
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