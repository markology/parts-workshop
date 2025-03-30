import { ImpressionList } from "@/constants/Impressions";
import ImpressionDropdown from "./ImpressionDropdown";

import { useSidebarStore } from "@/stores/Sidebar";
import { ImpressionType } from "@/types/Impressions";

const Impressions = () => {
  const { impressions, setActiveSidebarNode } = useSidebarStore();
  const onDragStart = (
    event: React.DragEvent<HTMLDivElement>,
    draggableId: string,
    type: ImpressionType
  ) => {
    const activeSideBarNode = impressions[type][draggableId];
    setActiveSidebarNode(activeSideBarNode.id || null, type);
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <div className={`overflow-auto overscroll-x-none`}>
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
