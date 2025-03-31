import PartNode from "./PartNode";
import {
  BaseNodeData,
  ConflictNodeData,
  NodeType,
  PartNodeData,
} from "@/types/Nodes";

import { NodeColors, NodeTextColors } from "@/constants/Nodes";
import { ImpressionType } from "@/types/Impressions";
import { useCallback, useMemo, useRef, useState } from "react";
import { useFlowNodesContext } from "@/context/FlowNodesContext";
import { useSidebarStore } from "@/stores/Sidebar";
import RightClickMenu from "../global/RightClickMenu";
import { ListRestart, Pencil, Trash2 } from "lucide-react";

const ImpressionNode = ({
  id,
  label,
  type,
}: {
  id: string;
  label: string;
  type: Exclude<ImpressionType, ["part", "conflict"]>;
}) => {
  const [menuVisible, setMenuVisible] = useState(false);
  const nodeRef = useRef<HTMLDivElement>(null);
  const { deleteNode } = useFlowNodesContext();
  const addImpression = useSidebarStore((s) => s.addImpression);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (nodeRef.current) {
      setMenuVisible(true);
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
        icon: <Pencil size={16} />,
        onClick: () => console.log("Edit node"),
      },
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
    <div key={`${id}`}>
      <div
        className="text-white bg-[#4ecdc4] rounded break-words px-5 py-2 pb-6 min-w-[100px] flex flex-col gap-[10px]"
        style={{ backgroundColor: NodeColors[type] }}
        ref={nodeRef}
        onContextMenu={handleContextMenu}
      >
        <strong
          className="text-sm flex-1 justify-items-center"
          style={{ color: NodeTextColors[type] }}
        >
          {`${type}:`}
        </strong>
        {label || null}
      </div>
      {menuVisible && <RightClickMenu items={menuItems} onClose={() => {}} />}
    </div>
  );
};

const NodeComponent = ({
  type,
  data,
  id,
}: {
  type: NodeType;
  data: BaseNodeData | ConflictNodeData;
  id: string;
}) => {
  if (type === "part")
    return <PartNode partId={id} data={data as PartNodeData} />;
  return <ImpressionNode type={type} id={id} label={data.label} />;
};

export default NodeComponent;

export const nodeTypes = {
  emotion: NodeComponent,
  thought: NodeComponent,
  sensation: NodeComponent,
  behavior: NodeComponent,
  // conflict: NodeComponent,
  part: NodeComponent,
  self: NodeComponent,
  other: NodeComponent,
};
