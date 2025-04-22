import React, { useState } from "react";
import { Notebook, NotebookPen, X } from "lucide-react";
import { useJournalStore } from "@/state/Journal";
import ToolTipWrapper from "@/components/ToolTipWrapper";

const JournalToggle: React.FC = () => {
  const { closeJournal, isOpen, setJournalTarget } = useJournalStore();
  const [isHovering, setIsHovering] = useState(false);

  return (
    <ToolTipWrapper message={isOpen ? "Close Journal" : "Open Journal"}>
      <button
        className=" w-15 h-15 rounded-lg flex items-center justify-center cursor-pointer z-50 bg-black/25"
        id="open-journal"
        onClick={() =>
          isOpen ? closeJournal() : setJournalTarget({ type: "global" })
        }
        onMouseOver={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {isOpen ? (
          <X color="white" strokeWidth={2} size={30} />
        ) : isHovering ? (
          <NotebookPen color="white" strokeWidth={2} size={30} />
        ) : (
          <Notebook color="white" strokeWidth={2} size={30} />
        )}
      </button>
    </ToolTipWrapper>
  );
};

export default JournalToggle;
