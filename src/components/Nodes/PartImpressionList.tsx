import { Node } from "@xyflow/react";

import {
  NodeBackgroundColors,
  NodeColors,
  NodeTextColors,
  PartDataLabels,
} from "@/constants/Nodes";
import { ImpressionType } from "@/types/Impressions";
import { ReactElement, useRef, useState } from "react";
import { ListRestart, Pencil, Trash2 } from "lucide-react";
import RightClickMenu from "../global/RightClickMenu";
import { useFlowNodesContext } from "@/context/FlowNodesContext";
import { useSidebarStore } from "@/stores/Sidebar";
import { ImpressionNode } from "@/types/Nodes";

let index = 0;
const PartImpressionContainer = ({
  type,
  children,
}: {
  type: ImpressionType;
  children: ReactElement[];
}) => {
  return (
    <div
      key={`PartImpressionWrapper ${index++}`}
      style={{
        backgroundColor: NodeBackgroundColors[type],
        position: "relative",
        padding: "16px",
        borderRadius: "8px",
        marginBottom: "16px",
      }}
      className="mb-3 part-impression-container flex-1 justify-items-center max-w-[140px]"
    >
      <strong
        className="text-sm  part-impression-container flex-1 justify-items-center"
        style={{ color: NodeTextColors[type] }}
      >
        {`${type}:`}
      </strong>
      <ul className="list-none w-full pt-2">{children}</ul>
    </div>
  );
};

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
  const { setNodes } = useFlowNodesContext();
  const addImpression = useSidebarStore((s) => s.addImpression);
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (nodeRef.current) {
      setMenuVisible(true);
    }
  };

  const handleDeleteImpressionNode = (
    id: string,
    partId: string,
    type: ImpressionType
  ) => {
    setNodes((prevNodes) => {
      return prevNodes.reduce((acc: Node[], node: Node) => {
        if (node.id === id) {
          // Skip the impression node we're deleting
          return acc;
        }

        if (node.id === partId) {
          // Update the parent node by removing the impression from its data
          const updatedImpressions = (node.data[PartDataLabels[type]] as Node[]) // fix typescript
            .filter((impression) => impression.id !== id);
          const updatedNode = {
            ...node,
            data: {
              ...node.data,
              [PartDataLabels[type]]: updatedImpressions,
            },
          };

          acc.push(updatedNode);
        } else {
          // All other nodes remain unchanged
          acc.push(node);
        }

        return acc;
      }, []);
    });
  };

  const handleSendBackToSideBar = (
    id: string,
    partId: string,
    type: ImpressionType
  ) => {
    handleDeleteImpressionNode(id, partId, type);

    addImpression({
      id,
      type,
      label: item.data.label as string,
    });
  };

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
      {menuVisible && (
        <RightClickMenu
          items={[
            {
              icon: <Pencil size={16} />,
              onClick: () => console.log("Edit node"),
            },
            {
              icon: <Trash2 size={16} />,
              onClick: () => handleDeleteImpressionNode(item.id, partId, type),
            },
            {
              icon: <ListRestart size={16} />,
              onClick: () => handleSendBackToSideBar(item.id, partId, type),
            },
          ]}
          onClose={() => {}}
        />
      )}
    </div>
  );
};

const PartImpressionList = ({
  data,
  type,
  partId,
}: {
  data: ImpressionNode[];
  type: ImpressionType;
  partId: string;
}) => (
  <PartImpressionContainer type={type}>
    {data.map((item) => {
      return (
        <PartImpressionNode
          item={item}
          type={type}
          key={`PartImpressionNode ${index++}`}
          partId={partId}
        />
      );
    })}
  </PartImpressionContainer>
);

export default PartImpressionList;
