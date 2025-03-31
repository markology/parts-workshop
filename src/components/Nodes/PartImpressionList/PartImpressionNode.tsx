import { NodeColors } from "@/constants/Nodes";
import { ImpressionType } from "@/types/Impressions";
import { useMemo, useRef, useState } from "react";
import { ListRestart, Pencil, Trash2 } from "lucide-react";
import RightClickMenu from "../../global/RightClickMenu";
import { useFlowNodesContext } from "@/context/FlowNodesContext";
import { useSidebarStore } from "@/stores/Sidebar";
import { ImpressionNode } from "@/types/Nodes";

// let index = 0;
const PartImpressionNode = ({
  item,
  type,
  partId,
}: {
  item: ImpressionNode;
  type: ImpressionType;
  partId: string;
}) => {
  const [menuVisible, setMenuVisible] = useState(false);
  const nodeRef = useRef<HTMLLIElement>(null);
  const { detachImpressionFromPart } = useFlowNodesContext();
  const addImpression = useSidebarStore((s) => s.addImpression);
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (nodeRef.current) {
      setMenuVisible(true);
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
      label: item.data.label as string,
    });
  };

  const menuItems = useMemo(
    () => [
      {
        icon: <Pencil size={16} />,
        onClick: () => console.log("Edit node"),
      },
      {
        icon: <Trash2 size={16} />,
        onClick: () => detachImpressionFromPart(item.id, partId, type),
      },
      {
        icon: <ListRestart size={16} />,
        onClick: () => handleSendBackToSideBar(item.id, partId, type),
      },
    ],
    [item.id, partId, type]
  );

  return (
    <div className="text-right">
      <li
        ref={nodeRef}
        onContextMenu={handleContextMenu}
        className="text-white text-left bg-[#4ecdc4] rounded py-1 px-4 break-words relative"
        style={{ backgroundColor: NodeColors[type] }}
      >
        {(item.data.label as string) || null}
      </li>
      {menuVisible && <RightClickMenu items={menuItems} onClose={() => {}} />}
    </div>
  );
};

export default PartImpressionNode;
