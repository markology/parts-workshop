import { Check, LoaderCircle, Save } from "lucide-react";
import useSaveMap from "../../state/useSaveMap";
import { SaveMapArgs } from "@/types/api/map";

const SaveProgress = ({ saveMapData }: { saveMapData: SaveMapArgs }) => {
  const { handleSaveMap, saveCheck, isSavingMap } = useSaveMap(saveMapData);

  return (
    <button
      className="w-15 h-15 rounded-lg flex items-center justify-center cursor-pointer z-50 bg-black/25"
      id="save-progress"
      onClick={handleSaveMap}
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
      ) : (
        <Save color="white" strokeWidth={2} size={30} />
      )}
    </button>
  );
};

export default SaveProgress;
