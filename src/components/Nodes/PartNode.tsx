import { ImpressionList } from "@/constants/Impressions";
import { PartDataLabels } from "@/constants/Nodes";
import { useFlowNodesContext } from "@/context/FlowNodesContext";
import { PartNodeData } from "@/types/Nodes";
import { Handle, Position } from "@xyflow/react";
import { Pencil, PersonStanding } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import PartImpressionList from "./PartImpressionList/PartImpressionList";
import { useUIStore } from "@/stores/UI";

let index = 0;

const PartNode = ({ data, partId }: { data: PartNodeData; partId: string }) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editValue, setEditValue] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { updateNode } = useFlowNodesContext();
  const isEditing = useUIStore((s) => s.isEditing);
  const setIsEditing = useUIStore((s) => s.setIsEditing);

  const handleSave = useCallback(() => {
    if (editValue === "") {
      setIsEditing(false);
      setIsEditingTitle(false);
      setEditValue(data.label); // Reset to original value
      return;
    }

    updateNode(partId, {
      data: {
        ...data,
        label: editValue,
      },
    });
    setIsEditing(false);
    setIsEditingTitle(false);
  }, [editValue, updateNode, partId, data, setIsEditing]);

  const handleEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSave();
    }
  };

  // Detect clicks outside the input
  useEffect(() => {
    if (!isEditing && data.label !== editValue) handleSave();
  }, [data.label, editValue, handleSave, isEditing]);

  return (
    <div className="bg-[#a3c1e591] z-[-999] shadow-md rounded p-10 w-80 border border-color-[white] flex flex-col w-[1000px] h-auto rounded-3xl">
      {/* Title */}
      <div className="flex justify-between">
        {isEditingTitle ? (
          <input
            className="part-name font-semibold mb-2 text-gray-800 text-4xl pb-4 flex gap-[20px]"
            ref={inputRef}
            onChange={(e) => setEditValue(e.target.value)}
            value={editValue}
            onKeyDown={handleEnter}
            autoFocus
          />
        ) : (
          <h3
            onClick={() => {
              setIsEditingTitle(true);
              setIsEditing(true);
            }} // TODO
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
        )}
        <PersonStanding className="text-[#a7c0dd]" strokeWidth={3} size={40} />
      </div>
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
      <Handle type="source" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
      <Handle type="source" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
};

export default PartNode;
