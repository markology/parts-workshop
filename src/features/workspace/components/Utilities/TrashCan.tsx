import React, { useState } from "react";
import { Trash, Trash2 } from "lucide-react";
import ToolTipWrapper from "@/components/ToolTipWrapper";
import { useWorkingStore } from "../../state/stores/useWorkingStore";
import { SidebarImpression } from "@/features/workspace/types/Sidebar";

const TrashCan: React.FC = () => {
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
      const item: SidebarImpression = JSON.parse(sidebarData);
      useWorkingStore
        .getState()
        .removeImpression({ type: item.type, id: item.id });
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  return (
    <ToolTipWrapper message="Drag Here to Delete">
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
    </ToolTipWrapper>
  );
};

export default TrashCan;
