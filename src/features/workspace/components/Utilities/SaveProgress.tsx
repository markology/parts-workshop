import { Check, LoaderCircle, Save, SaveAll } from "lucide-react";
import ToolTipWrapper from "@/components/ToolTipWrapper";
import { useState } from "react";
import { useSaveMap } from "../../state/hooks/useSaveMap";

const SaveProgress = () => {
  const [isHovering, setIsHovering] = useState(false);
  const { mutate, isPending, isSuccess } = useSaveMap();

  return (
    <ToolTipWrapper message="Save Map">
      <button
        className="w-15 h-15 rounded-lg flex items-center justify-center cursor-pointer z-50 bg-black/25"
        id="save-progress"
        onClick={() => mutate()}
        onMouseOver={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {isPending && !isSuccess ? (
          <LoaderCircle
            className="animate-spin"
            color="white"
            strokeWidth={2}
            size={30}
          />
        ) : isSuccess ? (
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
