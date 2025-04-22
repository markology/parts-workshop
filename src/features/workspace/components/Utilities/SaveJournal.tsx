import ToolTipWrapper from "@/components/ToolTipWrapper";
import { Save, SaveAll } from "lucide-react";
import { useState } from "react";

const SaveJournal = ({ handleClick }: { handleClick: () => void }) => {
  const [isHovering, setIsHovering] = useState(false);
  return (
    <ToolTipWrapper message="Save Journal Entry">
      <button
        className="w-15 h-15 rounded-lg flex items-center justify-center cursor-pointer z-50 bg-black/25"
        id="save-progress"
        onMouseOver={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onClick={handleClick}
      >
        {isHovering ? (
          <SaveAll color="white" strokeWidth={2} size={30} />
        ) : (
          <Save color="white" strokeWidth={2} size={30} />
        )}
      </button>
    </ToolTipWrapper>
  );
};

export default SaveJournal;
