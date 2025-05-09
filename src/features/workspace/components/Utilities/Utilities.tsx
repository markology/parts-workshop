import { useJournalStore } from "@/features/workspace/state/stores/Journal";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { useState } from "react";

import JournalToggle from "./JournalToggle";
import Logout from "./Logout";
import SaveProgress from "./SaveProgress";
import ThemeToggle from "./ThemeToggle";
import TrashCan from "./TrashCan";
import ToolTipWrapper from "@/components/ToolTipWrapper";
import { useIsMobile } from "@/hooks/useIsMobile";
import Feedback from "./Feedback";

export default function Utilities({ full }: { full?: boolean }) {
  const [visible, setVisible] = useState(true);
  const [hoveringHide, setHoveringHide] = useState(false);
  const isOpen = useJournalStore((s) => s.isOpen);
  const isMobile = useIsMobile();
  return (
    <div
      className={`fixed top-4 right-4 z-50 flex flex-col items-end gap-2.5 ${
        !full ? "z-[51]" : "z-[1]"
      }`}
    >
      {/* Toggle Button */}
      {full && (
        <ToolTipWrapper
          message={visible ? "Hide Utilities" : "Reveal Utilities"}
        >
          <button
            id="toggle-utilities"
            className="w-15 h-8 flex items-center justify-center rounded shadow bg-black/25 text-white"
            onClick={() => setVisible(!visible)}
            aria-label="Toggle Utilities"
            onMouseOver={() => setHoveringHide(true)}
            onMouseLeave={() => setHoveringHide(false)}
          >
            {visible ? (
              hoveringHide ? (
                <ChevronsRight className="text-xl" />
              ) : (
                <ChevronRight className="text-xl" />
              )
            ) : hoveringHide ? (
              <ChevronsLeft className="text-xl" />
            ) : (
              <ChevronLeft className="text-xl" />
            )}
          </button>
        </ToolTipWrapper>
      )}

      {/* Animated Toolset Container */}
      <div
        className={`flex flex-col gap-2.5 transform transition-transform duration-300 ${
          visible ? "translate-x-0" : "translate-x-20"
        }`}
      >
        {isMobile ? (
          <>
            <Logout />
            <ThemeToggle />
            <JournalToggle />
          </>
        ) : (
          <>
            {full && <Logout />}
            <ThemeToggle />
            <JournalToggle />
            {!isOpen && full && (
              <>
                <SaveProgress />
                <TrashCan />
              </>
            )}
            {!isOpen && <Feedback />}
          </>
        )}
      </div>
    </div>
  );
}
