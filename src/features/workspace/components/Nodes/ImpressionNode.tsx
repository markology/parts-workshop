import { useCallback, useMemo } from "react";
import { useFlowNodesContext } from "@/features/workspace/state/FlowNodesContext";
import { ListRestart, Trash2, BookOpen } from "lucide-react";
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
import { useTheme } from "@/features/workspace/hooks/useTheme";
import { getImpressionBaseColors, getPartNodeImpressionTypeFont, getImpressionPillFontColor } from "@/features/workspace/constants/ImpressionColors";

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
  const theme = useTheme();

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

  const baseColorsMap = getImpressionBaseColors(darkMode);
  const baseColors = (type in baseColorsMap ? baseColorsMap[type as keyof typeof baseColorsMap] : null) || baseColorsMap.emotion;
  const typeLabelFont = getPartNodeImpressionTypeFont(type, darkMode);
  const pillFontColor = getImpressionPillFontColor(type, darkMode);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData(
      "parts-workshop/canvas-impression",
      JSON.stringify({ id, type, label })
    );
    e.dataTransfer.effectAllowed = "move";
  };

  return (
    <div className="node impression-node text-right overflow-hidden">
      <div
        ref={nodeRef}
        onContextMenu={handleContextMenu}
        onDragStart={handleDragStart}
        draggable
        className="text-left rounded-xl px-3 pt-2 pb-3 text-sm font-medium shadow-sm break-words min-w-[180px] max-w-[300px] flex flex-col gap-2 relative overflow-hidden cursor-grab active:cursor-grabbing"
        style={{
          backgroundColor: baseColors.background,
          color: pillFontColor,
        }}
      >
        <div className="flex items-center justify-between gap-2">
          <strong 
            className="text-sm font-semibold"
            style={{
              color: typeLabelFont,
            }}
          >
            {`${ImpressionTextType[type]}`}
          </strong>
          <button
            onClick={() =>
              setJournalTarget({
                type: "node",
                nodeId: id,
                nodeType: type,
                title: label,
              })
            }
            className="journal-icon-button inline-flex h-9 w-9 items-center justify-center rounded-lg transition-colors flex-shrink-0"
            style={{
              boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
              ...(!darkMode ? { color: pillFontColor } : {}),
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundImage = 'none';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundImage = 'none';
            }}
            title="Open Journal"
          >
            <BookOpen size={16} />
          </button>
        </div>

        <div className="text-sm leading-relaxed mt-2">
          {label || "No label provided"}
        </div>
      </div>
      
      {showContextMenu && <RightClickMenu items={menuItems} />}
    </div>
  );
};

export default ImpressionNode;
