import { Handle, Position } from "@xyflow/react";
import { PartNodeData } from "@/types/Nodes";
import { ImpressionList } from "@/constants/Impressions";
import { PartDataLabels } from "@/constants/Nodes";

import PartImpressionList from "./PartImpressionList/PartImpressionList";
import { Pencil } from "lucide-react";
let index = 0;

const PartNode = ({ data, partId }: { data: PartNodeData; partId: string }) => {
  return (
    <div className="bg-[#a3c1e591] z-[-999] shadow-md rounded p-10 w-80 border border-color-[white] flex flex-col w-[1000px] h-auto rounded-3xl">
      {/* Title */}
      <h3
        onClick={() => console.log("clicked")}
        className="part-name font-semibold mb-2 text-gray-800 text-4xl pb-4 flex gap-[20px]"
      >
        {data.label}
        <button>
          <Pencil
            className="text-[#3d4f6a] cursor-default"
            strokeWidth={3}
            size={20}
          />
        </button>
      </h3>
      <div
        className={
          "flex flex-row gap-4 flex-grow space-evenly flex gap-2 flex-col min-h-[300px]"
        }
      >
        {ImpressionList.map((impression) => (
          <PartImpressionList
            key={`PartImpressionList ${index++}`}
            data={data[PartDataLabels[impression]]}
            type={impression}
            partId={partId}
          />
        ))}
      </div>

      {/* Handles for edges */}
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};

export default PartNode;
