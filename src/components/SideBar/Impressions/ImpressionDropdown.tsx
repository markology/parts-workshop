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
      {open &&
        Object.values(filteredImpressions).map((item) => (
          <div
            key={item.id}
            className="sidebar-impression input"
            onDragStart={(event) => onDragStart(event, item.id, item.type)}
            draggable
            style={{
              backgroundColor: NodeColors[item.type],
              borderRadius: 8,
              padding: "15px",
              paddingLeft: 0,
              paddingRight: 0,
            }}
          >
            {item.label}
          </div>
        ))}
    </div>
  );
};

export default ImpressionDropdown;
