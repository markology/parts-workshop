import React from "react";
import { Notebook, X } from "lucide-react";
import { useJournalStore } from "@/state/Journal";

const JournalToggle: React.FC = () => {
  const { closeJournal, isOpen, setJournalTarget } = useJournalStore();
  return (
    <>
      <button
        className="fixed top-85 right-5 w-15 h-15 rounded-lg flex items-center justify-center cursor-pointer z-50 bg-black/25"
        id="open-journal"
        onClick={() =>
          isOpen ? closeJournal() : setJournalTarget({ type: "global" })
        }
      >
        {isOpen ? (
          <X color="white" strokeWidth={2} size={30} />
        ) : (
          <Notebook color="white" strokeWidth={2} size={30} />
        )}
      </button>
    </>
  );
};

export default JournalToggle;
