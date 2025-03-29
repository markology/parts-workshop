import React, { Dispatch, SetStateAction } from "react";
import { SideBarItem } from "./SideBar";
import { NodeColors } from "../Nodes/constants";

const Impressions = ({
  items,
  setActiveSideBarNode,
}: {
  items: SideBarItem[];
  setActiveSideBarNode: Dispatch<SetStateAction<SideBarItem | null>>;
}) => {
  const onDragStart = (
    event: React.DragEvent<HTMLDivElement>,
    draggableId: string
  ) => {
    const activeSideBarNode = items.find((item) => item.id === draggableId);
    setActiveSideBarNode(activeSideBarNode || null);
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <>
      <h3 className="font-bold mb-2">Impression Vault</h3>
      <ul className="space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="sidebar-impression input"
            onDragStart={(event) => onDragStart(event, item.id)}
            draggable
            style={{ backgroundColor: NodeColors[item.type] }}
          >
            {item.label}
          </div>
        ))}
      </ul>
    </>
  );
};

export default Impressions;
