import { NodeColors } from "@/constants/Nodes";
import { ImpressionType } from "@/types/Impressions";
import { useMemo, useRef } from "react";
import { ListRestart, Trash2 } from "lucide-react";
import RightClickMenu from "../../global/RightClickMenu";
import { useFlowNodesContext } from "@/context/FlowNodesContext";
import { useSidebarStore } from "@/stores/Sidebar";
import { ImpressionNode } from "@/types/Nodes";
import { useUIStore } from "@/stores/UI";

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
  const isRightClickMenuOpen = useUIStore((s) => s.isRightClickMenuOpen);
  const setRightClickMenuOpen = useUIStore((s) => s.setRightClickMenuOpen);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (nodeRef.current) {
      setRightClickMenuOpen(true);
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
    <div className="text-right">
      <li
        ref={nodeRef}
        onContextMenu={handleContextMenu}
        className="text-white text-left bg-[#4ecdc4] rounded py-1 px-4 break-words relative"
        style={{ backgroundColor: NodeColors[type] }}
      >
        {item.data.label}
      </li>
      {isRightClickMenuOpen && <RightClickMenu items={menuItems} />}
    </div>
  );
};

export default PartImpressionNode;
