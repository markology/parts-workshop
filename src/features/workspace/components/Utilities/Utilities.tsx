import { useJournalStore } from "@/state/Journal";
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
import { WorkshopNode } from "@/types/Nodes";
import { Edge } from "@xyflow/react";
import { SidebarImpression } from "@/types/Sidebar";
import { ImpressionType } from "@/types/Impressions";
import SaveJournal from "./SaveJournal";
import ToolTipWrapper from "@/components/ToolTipWrapper";

export default function Utilities({
  saveMapData,
}: {
  saveMapData?: {
    mapId: string;
    nodes: WorkshopNode[];
    edges: Edge[];
    sidebarImpressions: Record<
      ImpressionType,
      Record<string, SidebarImpression>
    >;
  };
}) {
  const [visible, setVisible] = useState(true);
  const [hoveringHide, setHoveringHide] = useState(false);
  const isOpen = useJournalStore((s) => s.isOpen);
  return (
    <div
      className={`fixed top-4 right-4 z-50 flex flex-col items-end gap-2.5 ${
        !saveMapData ? "z-[51]" : "z-[1]"
      }`}
    >
      {/* Toggle Button */}
      {saveMapData && (
        <ToolTipWrapper
          message={visible ? "Hide Utilities" : "Reveal Utilities"}
        >
          <button
            id="toggle-utilities"
            className="w-15 h-8 flex items-center justify-center rounded shadow bg-black/25"
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
        {saveMapData && <Logout />}
        <ThemeToggle />
        {isOpen && <SaveJournal />}
        <JournalToggle />
        {!isOpen && saveMapData && (
          <>
            <SaveProgress saveMapData={saveMapData} />
            <TrashCan />
          </>
        )}
      </div>
    </div>
  );
}
