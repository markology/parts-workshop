import { useState } from "react";
import JournalToggle from "./JournalToggle";
import Logout from "./Logout";
import SaveProgress from "./SaveProgress";
import ThemeToggle from "./ThemeToggle";
import TrashCan from "./TrashCan";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useJournalStore } from "@/state/Journal";

export default function Utilities({ saveMap }: { saveMap: () => void }) {
  const [visible, setVisible] = useState(true);
  const isOpen = useJournalStore((s) => s.isOpen);
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col items-end gap-2.5">
      {/* Toggle Button */}
      <button
        id="toggle-utilities"
        className="w-15 h-8 flex items-center justify-center rounded shadow bg-black/25"
        onClick={() => setVisible(!visible)}
        aria-label="Toggle Utilities"
      >
        {visible ? (
          <ChevronRight className="text-xl" />
        ) : (
          <ChevronLeft className="text-xl" />
        )}
      </button>

      {/* Animated Toolset Container */}
      <div
        className={`flex flex-col gap-2.5 transform transition-transform duration-300 ${
          visible ? "translate-x-0" : "translate-x-20"
        }`}
      >
        <Logout />
        <ThemeToggle />
        <JournalToggle />
        {!isOpen && (
          <>
            <SaveProgress saveMap={saveMap} />
            <TrashCan />
          </>
        )}
      </div>
    </div>
  );
}
