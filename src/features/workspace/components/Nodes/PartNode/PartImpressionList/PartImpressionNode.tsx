import { NodeTextColors } from "@/features/workspace/constants/Nodes";
import { useMemo } from "react";
import { ListRestart, PencilIcon, Trash2 } from "lucide-react";
import { useFlowNodesContext } from "@/features/workspace/state/FlowNodesContext";
import { ImpressionNode } from "@/types/Nodes";
import RightClickMenu from "@/components/RightClickMenu";
import { ImpressionType } from "@/types/Impressions";
import useContextMenu from "@/hooks/useContextMenu";
import { useJournalStore } from "@/state/Journal";
import { useWorkingStore } from "@/features/workspace/state/useWorkingStore";

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
          {
            icon: <PencilIcon size={16} />,
            onClick: () => setJournalTarget({ type: "node", nodeId: item.id }),
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
        className="text-white text-left bg-[#4ecdc4] rounded py-1 px-4 break-words relative"
        style={{
          backgroundColor: NodeTextColors[type],
          boxShadow: "0px 1px 4px 0px rgba(0, 0, 0, 0.35)",
        }}
      >
        {item.data.label}
      </li>
      {showContextMenu && <RightClickMenu style="dropdown" items={menuItems} />}
    </div>
  );
};

export default PartImpressionNode;
