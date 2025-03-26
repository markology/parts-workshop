import React, { Dispatch, SetStateAction, useState } from "react";
import { NodeType } from "./WorkshopNode";
// import { useWorkshopContext } from "../context/WorkshopContext";

export type SideBarItem = {
  id: string;
  label: string;
  type: NodeType;
};

const nodeTypes: NodeType[] = [
  "emotion",
  "thought",
  "sensation",
  "behavior",
  "conflict",
  "part",
  "self",
  "other",
];

const SideBar = ({
  setActiveSideBarNode,
}: {
  setActiveSideBarNode: Dispatch<SetStateAction<SideBarItem | null>>;
}) => {
  const [items, setItems] = useState<SideBarItem[]>([]);
  const [traitInput, setTraitInput] = useState("");
  const [selectedType, setSelectedType] = useState<NodeType | null>(null);

  const onDragStart = (
    event: React.DragEvent<HTMLDivElement>,
    draggableId: string
  ) => {
    const activeSideBarNode = items.find((item) => item.id === draggableId);
    console.log({ draggableId, activeSideBarNode });
    setActiveSideBarNode(activeSideBarNode || null);
    event.dataTransfer.effectAllowed = "move";
  };

  const createSideBarNode = (e: { key: string }) => {
    if (e.key === "Enter" && selectedType !== null) {
      console.log("Creating Node", traitInput, selectedType);
      setItems([
        ...items,
        { id: `${Date.now()}`, label: traitInput, type: selectedType },
      ]);
      setTraitInput("");
    }
  };

  return (
    <aside>
      <input
        type="text"
        value={traitInput}
        onChange={(e) => setTraitInput(e.target.value)}
        onKeyDown={createSideBarNode}
        placeholder="Add impression"
        className="w-full p-2 mb-2 border rounded"
      />

      {/* Pill-based Type Selector */}
      <div className="flex flex-wrap gap-2 mb-4">
        {nodeTypes.map((type) => (
          <button
            key={type}
            onClick={() => setSelectedType(type)}
            className={`px-3 py-1 rounded-full text-sm ${
              selectedType === type
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Unlabeled Impressions List */}
      <h3 className="font-bold mb-2">Unlabeled Impressions</h3>
      <ul className="space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="dndnode input"
            onDragStart={(event) => onDragStart(event, item.id)}
            draggable
          >
            {item.label}
          </div>
        ))}
      </ul>
    </aside>
  );
};

export default SideBar;
