import { Node } from "@xyflow/react";

import {
  NodeBackgroundColors,
  NodeColors,
  NodeTextColors,
} from "@/constants/Nodes";
import { ImpressionType } from "@/types/Impressions";
import { ReactElement, useRef, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import RightClickMenu from "../global/RightClickMenu";

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
}: {
  item: Node;
  type: ImpressionType;
}) => {
  const [menuVisible, setMenuVisible] = useState(false);
  const nodeRef = useRef<HTMLLIElement>(null);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (nodeRef.current) {
      setMenuVisible(true);
    }
  };

  return (
    <div className="text-right">
      <li
        ref={nodeRef}
        onContextMenu={handleContextMenu}
        className="text-white text-left bg-[#4ecdc4] rounded py-1 px-4 break-words relative"
        style={{ backgroundColor: NodeColors[type] }}
      >
        {String(item.data.label) || null}
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
              onClick: () => console.log("Delete node"),
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
}: {
  data: Node[];
  type: ImpressionType;
}) => (
  <PartImpressionContainer type={type}>
    {data.map((item) => {
      return (
        <PartImpressionNode
          item={item}
          type={type}
          key={`PartImpressionNode ${index++}`}
        />
      );
    })}
  </PartImpressionContainer>
);

export default PartImpressionList;
