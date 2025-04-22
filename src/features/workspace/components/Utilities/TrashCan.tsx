import React, { useState } from "react";
import { Trash, Trash2 } from "lucide-react";
import { useSidebarStore } from "@/state/Sidebar";

//handleNodeDragStop triggers deletes from useFlowNodes

const TrashCan: React.FC = () => {
  const removeImpression = useSidebarStore((s) => s.removeImpression);
  const [isHoveringTrash, setIsHoveringTrash] = useState(false);

  const handleDragEnter = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setIsHoveringTrash(true);
  };

  const handleDragLeave = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setIsHoveringTrash(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const sidebarData = e.dataTransfer.getData(
      "parts-workshop/sidebar-impression"
    );

    if (sidebarData) {
      const item = JSON.parse(sidebarData);
      removeImpression(item.type, item.id);
      return;
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onMouseOver={() => setIsHoveringTrash(true)}
      onMouseLeave={() => setIsHoveringTrash(false)}
      className="w-15 h-15 rounded-lg flex items-center justify-center cursor-pointer z-50 bg-black/25"
      title="Drop here to delete"
      id="trash-bucket"
    >
      {!isHoveringTrash ? (
        <Trash color="white" strokeWidth={2} size={30} />
      ) : (
        <Trash2 color="white" strokeWidth={2} size={30} />
      )}
    </div>
  );
};

export default TrashCan;
