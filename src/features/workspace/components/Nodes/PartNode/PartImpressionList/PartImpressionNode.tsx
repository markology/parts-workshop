import { NodeTextColors } from "@/features/workspace/constants/Nodes";
import { useMemo, useRef } from "react";
import { ListRestart, Trash2 } from "lucide-react";
import { useFlowNodesContext } from "@/features/workspace/state/FlowNodesContext";
import { useSidebarStore } from "@/state/Sidebar";
import { ImpressionNode } from "@/types/Nodes";
import { useUIStore } from "@/state/UI";
import RightClickMenu from "@/components/RightClickMenu";
import { ImpressionType } from "@/types/Impressions";

const PartImpressionNode = ({
  item,
  type,
  partId,
}: {
  item: ImpressionNode;
  type: ImpressionType;
  partId: string;
}) => {
  const nodeRef = useRef<HTMLLIElement>(null);
  const { detachImpressionFromPart } = useFlowNodesContext();

  // store vars
  const addImpression = useSidebarStore((s) => s.addImpression);
  const contextMenuParentNodeId = useUIStore((s) => s.contextMenuParentNodeId);
  const setContextMenuParentNodeId = useUIStore(
    (s) => s.setContextMenuParentNodeId
  );

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (nodeRef.current) {
      setContextMenuParentNodeId(item.id);
    }
  };

  const handleSendBackToSideBar = (
    id: string,
    partId: string,
    type: ImpressionType
  ) => {
    detachImpressionFromPart(id, partId, type);
    addImpression({
      id,
      type,
      label: item.data.label,
    });
  };

  const menuItems = useMemo(
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
  );

  return (
    <div className="node part-impression-node text-right">
      <li
        ref={nodeRef}
        onContextMenu={handleContextMenu}
        className="text-white text-left bg-[#4ecdc4] rounded py-1 px-4 break-words relative"
        style={{
          backgroundColor: NodeTextColors[type],
          boxShadow: "0px 1px 4px 0px rgba(0, 0, 0, 0.35)",
        }}
      >
        {item.data.label}
      </li>
      {contextMenuParentNodeId === item.id && (
        <RightClickMenu items={menuItems} />
      )}
    </div>
  );
};

export default PartImpressionNode;
