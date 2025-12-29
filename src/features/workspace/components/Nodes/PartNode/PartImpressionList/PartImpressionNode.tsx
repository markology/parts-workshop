import { useMemo } from "react";
import { ListRestart, Trash2 } from "lucide-react";
import { useFlowNodesContext } from "@/features/workspace/state/FlowNodesContext";
import { ImpressionNode } from "@/features/workspace/types/Nodes";
import RightClickMenu from "@/components/RightClickMenu";
import { ImpressionType } from "@/features/workspace/types/Impressions";
import useContextMenu from "@/features/workspace/hooks/useContextMenu";
import { useJournalStore } from "@/features/workspace/state/stores/Journal";
import { useWorkingStore } from "@/features/workspace/state/stores/useWorkingStore";
import { getImpressionBaseColors, getImpressionPillFontColor } from "@/features/workspace/constants/ImpressionColors";
import { useThemeContext } from "@/state/context/ThemeContext";

const PartImpressionNode = ({
  item,
  type,
  partId,
}: {
  item: ImpressionNode;
  type: ImpressionType;
  partId: string;
}) => {
  const { detachImpressionFromPart } = useFlowNodesContext();
  const { setJournalTarget } = useJournalStore();
  const { darkMode } = useThemeContext();
  const baseColorsMap = getImpressionBaseColors(darkMode);
  const baseColors = (type in baseColorsMap ? baseColorsMap[type as keyof typeof baseColorsMap] : null) || baseColorsMap.emotion;
  const pillFontColor = getImpressionPillFontColor(type, darkMode);

  const { handleContextMenu, showContextMenu, nodeRef, menuItems } =
    useContextMenu({
      id: item.id,
      menuItems: useMemo(
        () => [
          {
            icon: <Trash2 size={16} />,
            onClick: () => detachImpressionFromPart(item.id, partId, type),
          },
          {
            icon: <ListRestart size={16} />,
            onClick: () => handleSendBackToSideBar(item.id, partId, type),
          },
        ],
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [detachImpressionFromPart, item.id, partId, type]
      ),
    });

  const handleSendBackToSideBar = (
    id: string,
    partId: string,
    type: ImpressionType
  ) => {
    detachImpressionFromPart(id, partId, type);
    useWorkingStore.getState().addImpression({
      id,
      type,
      label: item.data.label,
    });
  };

  return (
    <div ref={nodeRef} className="part-impression-node text-right">
      <li
        onContextMenu={handleContextMenu}
        className="text-white text-left rounded py-1 px-4 break-words relative"
        style={{
          backgroundColor: baseColors.background,
          color: pillFontColor,
          boxShadow: "0px 1px 4px 0px rgb(0, 0, 0)",
          border: 'none',
        }}
      >
        {item.data.label}
      </li>
      {showContextMenu && <RightClickMenu style="dropdown" items={menuItems} />}
    </div>
  );
};

export default PartImpressionNode;
