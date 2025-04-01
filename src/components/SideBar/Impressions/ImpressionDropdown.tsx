import { useState } from "react";
import { SidebarImpression } from "@/types/Sidebar";
import { NodeType } from "@/types/Nodes";
import { NodeBackgroundColors, NodeColors } from "@/constants/Nodes";
import { ChevronDown, ChevronUp } from "lucide-react"; // optional: use any icon library
import { ImpressionType } from "@/types/Impressions";

const ImpressionDropdown = ({
  type,
  filteredImpressions,
  onDragStart,
}: {
  type: NodeType;
  filteredImpressions: Record<string, SidebarImpression>;
  onDragStart: (
    event: React.DragEvent<HTMLDivElement>,
    draggableId: string,
    type: ImpressionType
  ) => void;
}) => {
  const [open, toggleOpen] = useState(true);

  return (
    <div className="mb-2">
      <button
        className={`capitalize flex items-center justify-between w-full p-2 text-left font-semibold rounded hover:bg-["${NodeBackgroundColors[type]}"]`}
        onClick={() => toggleOpen(!open)}
        style={{
          color: NodeColors[type],
        }}
      >
        <p>{type}</p>
        {open ? (
          <ChevronUp size={16} strokeWidth={3} />
        ) : (
          <ChevronDown size={16} strokeWidth={3} />
        )}
      </button>
      <hr />
      <div className="flex flex-col gap-[6px]">
        {open &&
          Object.values(filteredImpressions).map((item) => (
            <div
              key={item.id}
              className="sidebar-impression text-white input draggable rounded-lg px-3 py-1 cursor-grab"
              onDragStart={(event) => onDragStart(event, item.id, item.type)}
              draggable
              style={{
                background: NodeColors[item.type],
              }}
            >
              {item.label}
            </div>
          ))}
      </div>
    </div>
  );
};

export default ImpressionDropdown;
