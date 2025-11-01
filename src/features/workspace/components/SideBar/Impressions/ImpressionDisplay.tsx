import { ImpressionList } from "@/features/workspace/constants/Impressions";
import ImpressionDropdown from "./ImpressionDropdown";

import { useSidebarStore } from "@/features/workspace/state/stores/Sidebar";
import { ImpressionType } from "@/features/workspace/types/Impressions";
import { useWorkingStore } from "@/features/workspace/state/stores/useWorkingStore";
import { useUIStore } from "@/features/workspace/state/stores/UI";
import { Plus } from "lucide-react";

const Impressions = () => {
  const { setActiveSidebarNode } = useSidebarStore();
  const impressions = useWorkingStore((s) => s.sidebarImpressions);
  const setShowImpressionModal = useUIStore((s) => s.setShowImpressionModal);
  const totalImpressions = ImpressionList.reduce(
    (acc, type) => acc + Object.keys(impressions[type] || {}).length,
    0
  );

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
    <div className="flex h-full flex-col">
      <div className="mx-1 mt-1 flex items-center justify-between rounded-2xl px-3 py-2.5">
        <div className="space-y-1">
          <p className="text-[11px] uppercase tracking-[0.28em] text-black">Impressions</p>
          <h2 className="text-base font-semibold text-black">Library</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-slate-300 px-2 py-[2px] text-[11px] font-medium text-black">
            {totalImpressions} saved
          </span>
          <button
            onClick={() => setShowImpressionModal(true)}
            className="inline-flex items-center gap-1 rounded-full border border-slate-400 bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-white transition-colors hover:bg-slate-900"
            title="Add Impression"
          >
            <Plus className="h-4 w-4" />
            Add
          </button>
        </div>
      </div>
      {totalImpressions > 0 && (
        <div
          id="impression-dropdown-container"
          className="flex-1 space-y-2 overflow-auto px-2 py-2 overscroll-x-none"
        >
          {ImpressionList.map((type) => (
            <ImpressionDropdown
              key={type}
              type={type}
              filteredImpressions={impressions[type] || {}}
              onDragStart={onDragStart}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Impressions;
