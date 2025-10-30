import { ImpressionList } from "@/features/workspace/constants/Impressions";
import ImpressionDropdown from "./ImpressionDropdown";

import { useSidebarStore } from "@/features/workspace/state/stores/Sidebar";
import { ImpressionType } from "@/features/workspace/types/Impressions";
import { useWorkingStore } from "@/features/workspace/state/stores/useWorkingStore";
import { useUIStore } from "@/features/workspace/state/stores/UI";

const Impressions = () => {
  const { setActiveSidebarNode } = useSidebarStore();
  const impressions = useWorkingStore((s) => s.sidebarImpressions);
  const setShowImpressionModal = useUIStore((s) => s.setShowImpressionModal);
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
    const activeSideBarNode = impressions[type]?.[draggableId];
    setActiveSidebarNode(activeSideBarNode?.id || null, type);
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header with title and + button */}
      <div className="flex items-center justify-between px-3 py-2 mb-2 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800">Impressions</h2>
        <button
          onClick={() => {
            setShowImpressionModal(true);
          }}
          className="h-8 px-3 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors text-sm font-medium text-gray-700"
          title="Add Impression"
        >
          Add
        </button>
      </div>
      <div
        id="impression-dropdown-container"
        className={`flex-1 pr-3 overflow-auto overscroll-x-none`}
      >
        <ul className="space-y-2">
          {ImpressionList.map((type) => (
            <ImpressionDropdown
              key={type}
              type={type}
              filteredImpressions={impressions[type] || {}}
              onDragStart={onDragStart}
            />
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Impressions;
