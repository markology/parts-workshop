import { Check, LoaderCircle, Save, SaveAll } from "lucide-react";
import ToolTipWrapper from "@/components/ToolTipWrapper";
import { useState } from "react";
import { useAutoSave } from "../../state/hooks/useAutoSave";
import { cleanupOrphanedJournalEntriesFromMap } from "@/features/workspace/state/lib/cleanupOrphanedJournalEntriesFromMap";
import { useWorkingStore } from "../../state/stores/useWorkingStore";
import { toast } from "react-hot-toast";

const SaveProgress = () => {
  const [isHovering, setIsHovering] = useState(false);
  const { saveNow, isSaving, saveCheck } = useAutoSave();

  const handleSaveAndCleanup = async () => {
    await saveNow();
    const nodeIds = useWorkingStore.getState().nodes.map((n) => n.id);
    await cleanupOrphanedJournalEntriesFromMap(nodeIds);
    toast.success("Orphaned journal entries cleaned up.");
  };

  return (
    <ToolTipWrapper message="Save Map">
      <button
        className="w-15 h-15 rounded-lg flex items-center justify-center cursor-pointer z-50 bg-black/25"
        id="save-progress"
        onClick={() => handleSaveAndCleanup()}
        onMouseOver={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {isSaving && !saveCheck ? (
          <LoaderCircle
            className="animate-spin"
            color="white"
            strokeWidth={2}
            size={30}
          />
        ) : saveCheck ? (
          <Check color="white" strokeWidth={2} size={30} />
        ) : isHovering ? (
          <SaveAll color="white" strokeWidth={2} size={30} />
        ) : (
          <Save color="white" strokeWidth={2} size={30} />
        )}
      </button>
    </ToolTipWrapper>
  );
};

export default SaveProgress;
