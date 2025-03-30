import { Handle, Position, Node } from "@xyflow/react";
import { PartNodeData } from "@/types/Nodes";
import { ImpressionList } from "@/constants/Impressions";
import {
  NodeBackgroundColors,
  NodeColors,
  NodeTextColors,
  PartDataLabels,
} from "@/constants/Nodes";
import { ImpressionType } from "@/types/Impressions";

const partImpressionNode = (data: Node[], type: ImpressionType) => {
  return (
    <div
      key={`part impressions ${type}`}
      style={{ backgroundColor: NodeBackgroundColors[type] }}
      className="mb-3 part-impression-container flex-1 justify-items-center max-w-[140px]"
    >
      <strong
        className="text-sm  part-impression-container flex-1 justify-items-center"
        style={{ color: NodeTextColors[type] }}
      >
        {`${type}:`}
      </strong>
      <ul className="list-none w-full pt-2">
        {data.map((item, index: number) => (
          <li
            className="text-white bg-[#4ecdc4] rounded py-1 px-4 break-words"
            style={{ backgroundColor: NodeColors[type] }}
            key={`${type} ${index}`}
          >
            {String(item.data.label) || null}
          </li>
        ))}
      </ul>
    </div>
  );
};

const PartNode = ({ data }: { data: PartNodeData }) => {
  console.log({ partData: data });
  return (
    <div
      className="bg-[#a3c1e591] shadow-md rounded p-10 w-80 border border-color-[white] flex flex-col w-[1000px] h-auto rounded-3xl"
      style={{ zIndex: -999 }}
    >
      {/* Title */}
      <h3 className="part-name font-semibold mb-2 text-gray-800 text-4xl pb-4">
        {data.label}
      </h3>
      <div
        className={
          "flex flex-row gap-4 flex-grow space-evenly flex gap-2 flex-col min-h-[300px]"
        }
      >
        {ImpressionList.map((impression) =>
          partImpressionNode(data[PartDataLabels[impression]], impression)
        )}
      </div>

      {/* Handles for edges */}
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};

export default PartNode;
