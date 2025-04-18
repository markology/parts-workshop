import {
  NodeColors,
  NodeTextColors,
} from "@/features/workspace/constants/Nodes";
import { useCallback, useMemo, useRef } from "react";
import { useFlowNodesContext } from "@/features/workspace/state/FlowNodesContext";
import { useSidebarStore } from "@/state/Sidebar";
import { ListRestart, Trash2 } from "lucide-react";
import RightClickMenu from "@/components/RightClickMenu";
import { ImpressionTextType, ImpressionType } from "@/types/Impressions";
import { useUIStore } from "@/state/UI";

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
  const addImpression = useSidebarStore((s) => s.addImpression);
  const nodeRef = useRef<HTMLDivElement>(null);
  const contextMenuParentNodeId = useUIStore((s) => s.contextMenuParentNodeId);
  const setContextMenuParentNodeId = useUIStore(
    (s) => s.setContextMenuParentNodeId
  );
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (nodeRef.current) {
      setContextMenuParentNodeId(id);
    }
  };

  const handleSendBackToSideBar = useCallback(
    (id: string, type: ImpressionType) => {
      deleteNode(id);
      addImpression({
        id,
        type,
        label,
      });
    },
    [addImpression, deleteNode, label]
  );

  const menuItems = useMemo(
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
    [deleteNode, handleSendBackToSideBar, id, type]
  );

  return (
    <div className="node impression-node text-right">
      <div
        className="text-white text-left bg-[#4ecdc4] rounded break-words px-5 py-2 pb-6 min-w-[100px] flex flex-col gap-[10px]"
        style={{ backgroundColor: NodeColors[type] }}
        ref={nodeRef}
        onContextMenu={handleContextMenu}
      >
        <strong
          className="text-sm flex-1 justify-items-center"
          style={{ color: NodeTextColors[type] }}
        >
          {`${ImpressionTextType[type]}:`}
        </strong>
        {label || null}
      </div>
      {contextMenuParentNodeId === id && <RightClickMenu items={menuItems} />}
    </div>
  );
};

export default ImpressionNode;
