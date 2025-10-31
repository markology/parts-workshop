import {
  NodeBackgroundColors,
  NodeTextColors,
} from "@/features/workspace/constants/Nodes";
import { useCallback, useMemo } from "react";
import { useFlowNodesContext } from "@/features/workspace/state/FlowNodesContext";
import { ListRestart, Trash2, BookOpen, Sparkles } from "lucide-react";
import RightClickMenu from "@/components/RightClickMenu";
import {
  ImpressionTextType,
  ImpressionType,
} from "@/features/workspace/types/Impressions";
import useContextMenu from "@/features/workspace/hooks/useContextMenu";
import detachImpressionFromPart from "../../state/updaters/detachImpressionFromPart";
import { useJournalStore } from "@/features/workspace/state/stores/Journal";
import { useWorkingStore } from "../../state/stores/useWorkingStore";
import { useThemeContext } from "@/state/context/ThemeContext";

const ImpressionNode = ({
  id,
  label,
  type,
}: {
  id: string;
  label: string;
  type: ImpressionType;
}) => {
  const { deleteNode } = useFlowNodesContext();
  const { setJournalTarget } = useJournalStore();
  const { darkMode } = useThemeContext();

  const { handleContextMenu, showContextMenu, nodeRef, menuItems } =
    useContextMenu({
      id,
      menuItems: useMemo(
        () => [
          {
            icon: <Trash2 size={16} />,
            onClick: () => deleteNode(id),
          },
          {
            icon: <ListRestart size={16} />,
            onClick: () => handleSendBackToSideBar(id, type),
          },
        ],
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [detachImpressionFromPart, id]
      ),
    });

  const handleSendBackToSideBar = useCallback(
    (id: string, type: ImpressionType) => {
      deleteNode(id);
      useWorkingStore.getState().addImpression({
        id,
        type,
        label,
      });
    },
    [deleteNode, label]
  );

  const accent = NodeBackgroundColors[type];
  const textColor = NodeTextColors[type];

  return (
    <div className="node impression-node">
      <div
        ref={nodeRef}
        onContextMenu={handleContextMenu}
        className={`relative w-[260px] rounded-[20px] border transition-all duration-200 cursor-pointer ${
          darkMode
            ? "bg-slate-950/75 border-slate-800/70 text-slate-100 shadow-[0_18px_38px_rgba(8,15,30,0.45)] hover:-translate-y-[2px] hover:shadow-[0_24px_48px_rgba(8,15,30,0.55)]"
            : "bg-white/95 border-slate-200/80 text-slate-900 shadow-[0_18px_35px_rgba(15,23,42,0.12)] hover:-translate-y-[2px] hover:shadow-[0_24px_55px_rgba(15,23,42,0.16)]"
        }`}
      >
        <div className="absolute inset-0 pointer-events-none rounded-[20px]" style={{ background: `linear-gradient(135deg, ${accent}12, transparent 65%)` }} />
        <div className="relative p-5 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em]"
                style={{
                  backgroundColor: `${accent}18`,
                  color: textColor,
                }}
              >
                {ImpressionTextType[type]}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() =>
                  setJournalTarget({
                    type: "node",
                    nodeId: id,
                    nodeType: type,
                    title: label,
                  })
                }
                className={`inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                  darkMode ? "hover:bg-slate-900/70 text-slate-200" : "hover:bg-slate-100 text-slate-500"
                }`}
                title="Open Journal"
              >
                <BookOpen size={16} />
              </button>
              <button
                onClick={() => handleSendBackToSideBar(id, type)}
                className={`inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                  darkMode ? "hover:bg-slate-900/70 text-slate-200" : "hover:bg-slate-100 text-slate-500"
                }`}
                title="Return to sidebar"
              >
                <ListRestart size={15} />
              </button>
            </div>
          </div>

          <p className={`text-sm leading-relaxed ${darkMode ? "text-slate-200" : "text-slate-600"}`}>
            {label || "No label provided"}
          </p>

          <div className="flex items-center justify-between">
            <span className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide ${
              darkMode ? "bg-slate-900/60 text-slate-300" : "bg-slate-100 text-slate-500"
            }`}>
              <Sparkles className="w-3 h-3" />
              Impression
            </span>
            <button
              onClick={() => deleteNode(id)}
              className={`inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                darkMode ? "hover:bg-slate-900/70 text-slate-200" : "hover:bg-slate-100 text-slate-500"
              }`}
              title="Delete"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      </div>
      {showContextMenu && <RightClickMenu items={menuItems} />}
    </div>
  );
};

export default ImpressionNode;
