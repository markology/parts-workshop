import { ImpressionList } from "@/features/workspace/constants/Impressions";
import ImpressionDropdown from "./ImpressionDropdown";

import { useSidebarStore } from "@/state/Sidebar";
import { ImpressionType } from "@/types/Impressions";

const Impressions = () => {
  const { impressions, setActiveSidebarNode } = useSidebarStore();

  const onDragStart = (
    event: React.DragEvent<HTMLDivElement>,
    draggableId: string,
    type: ImpressionType
  ) => {
    event.stopPropagation(); // critical if React Flow is interfering
    // in order to pass to TrashCan
    event.dataTransfer.setData(
      "parts-workshop/sidebar-impression",
      JSON.stringify({ type, id: draggableId })
    );

    // set ActiveSideBarNode
    const activeSideBarNode = impressions[type][draggableId];
    setActiveSidebarNode(activeSideBarNode.id || null, type);
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <div
      className={`h-[calc(100vw-100px)] pr-3 overflow-auto overscroll-x-none`}
    >
      <ul className="space-y-2">
        {ImpressionList.map((type) => (
          <ImpressionDropdown
            key={type}
            type={type}
            filteredImpressions={impressions[type]}
            onDragStart={onDragStart}
          />
        ))}
      </ul>
    </div>
  );
};

export default Impressions;
