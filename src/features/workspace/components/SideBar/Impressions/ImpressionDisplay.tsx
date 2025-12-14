import { ImpressionList } from "@/features/workspace/constants/Impressions";
import ImpressionDropdown from "./ImpressionDropdown";

import { useSidebarStore } from "@/features/workspace/state/stores/Sidebar";
import { ImpressionType } from "@/features/workspace/types/Impressions";
import { useWorkingStore } from "@/features/workspace/state/stores/useWorkingStore";
import { useUIStore } from "@/features/workspace/state/stores/UI";
import { useFlowNodesContext } from "@/features/workspace/state/FlowNodesContext";
import { Plus } from "lucide-react";
import { useThemeContext } from "@/state/context/ThemeContext";

const Impressions = () => {
  const { setActiveSidebarNode } = useSidebarStore();
  const impressions = useWorkingStore((s) => s.sidebarImpressions);
  const setShowImpressionModal = useUIStore((s) => s.setShowImpressionModal);
  const { deleteNode } = useFlowNodesContext();
  const { darkMode } = useThemeContext();
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

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    // Check if this is a canvas impression being dropped
    const data = e.dataTransfer.getData("parts-workshop/canvas-impression");
    if (!data) {
      // Also try to get it from types array (sometimes getData doesn't work during drop)
      if (e.dataTransfer.types.includes("parts-workshop/canvas-impression")) {
        // Try to get from a global store or check the drag source
        return;
      }
      return;
    }

    try {
      const parsed = JSON.parse(data) as { id: string; type: ImpressionType; label: string };
      
      // Add impression back to sidebar
      useWorkingStore.getState().addImpression({
        id: parsed.id,
        type: parsed.type,
        label: parsed.label,
      });

      // Delete the node from canvas
      deleteNode(parsed.id);
    } catch (error) {
      console.error("Failed to parse drag data:", error);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only allow drop if it's a canvas impression
    if (e.dataTransfer.types.includes("parts-workshop/canvas-impression")) {
      e.dataTransfer.dropEffect = "move";
      // Add visual feedback that this is a valid drop zone
      e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.02)';
    } else {
      e.dataTransfer.dropEffect = "none";
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    // Remove visual feedback
    e.currentTarget.style.backgroundColor = '';
  };

  return (
    <div 
      className="flex h-full flex-col"
      style={darkMode ? { background: "#212529" } : undefined}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <div className="mx-1 mt-1 flex items-center justify-between rounded-2xl px-3 py-2.5">
        <div className="space-y-1">
          <p className={`text-[11px] uppercase tracking-[0.28em] ${darkMode ? "text-white" : "text-black"}`}>Impressions</p>
          <h2 className={`text-base font-semibold ${darkMode ? "text-white" : "text-black"}`}>Library</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full border px-2 py-[2px] text-[11px] font-medium ${darkMode ? "border-white/20 text-white" : "border-slate-300 text-black"}`}>
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
      <div
        id="impression-dropdown-container"
        className="flex-1 space-y-2 overflow-auto px-2 py-2 overscroll-x-none"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
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
    </div>
  );
};

export default Impressions;
