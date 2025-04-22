import { Check, LoaderCircle, Save, SaveAll } from "lucide-react";
import useSaveMap from "../../state/useSaveMap";
import { SaveMapArgs } from "@/types/api/map";
import ToolTipWrapper from "@/components/ToolTipWrapper";
import { useState } from "react";

const SaveProgress = ({ saveMapData }: { saveMapData: SaveMapArgs }) => {
  const { handleSaveMap, saveCheck, isSavingMap } = useSaveMap(saveMapData);
  const [isHovering, setIsHovering] = useState(false);

  return (
    <ToolTipWrapper message="Save Map">
      <button
        className="w-15 h-15 rounded-lg flex items-center justify-center cursor-pointer z-50 bg-black/25"
        id="save-progress"
        onClick={handleSaveMap}
        onMouseOver={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {isSavingMap && !saveCheck ? (
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
