import { useFlowNodesContext } from "@/features/workspace/state/FlowNodesContext";
import { useUIStore } from "@/features/workspace/state/stores/UI";
import { PartNodeData } from "@/features/workspace/types/Nodes";
import { useReactFlow } from "@xyflow/react";
import React, { useCallback, useRef, useState } from "react";

const PartNeeds = ({ needs, partId }: { needs: string[]; partId: string }) => {
  const inputRef = useRef(null);
  const [need, setNeed] = useState("");
  const { updateNode } = useFlowNodesContext();
  const setIsEditing = useUIStore((s) => s.setIsEditing);
  const { getNode } = useReactFlow();

  const handleSave = useCallback(() => {
    if (!need) return;
    const node = getNode(partId);
    if (node?.data)
      updateNode<PartNodeData>(partId, {
        data: {
          ...node.data,
          needs: [...needs, need],
        },
      });

    setIsEditing(false);
    setNeed("");
  }, [getNode, partId, updateNode, needs, need, setIsEditing]);

  const handleEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSave();
    }
  };

  const handleRemove = useCallback((index: number) => {
    const node = getNode(partId);
    if (node?.data) {
      const newNeeds = needs.filter((_, i) => i !== index);
      updateNode<PartNodeData>(partId, {
        data: {
          ...node.data,
          needs: newNeeds,
        },
      });
    }
  }, [getNode, partId, updateNode, needs]);

  return (
    <div className="part-needs w-full bg-[#ffffff25] p-3 rounded-md">
      <h3 className="text-sm font-bold text-gray-700 mb-2">Needs</h3>
      <input
        className="text-sm h-[30px] w-full mb-2"
        ref={inputRef}
        value={need}
        onFocus={() => setIsEditing(true)}
        onChange={(e) => setNeed(e.target.value)}
        onKeyDown={handleEnter}
        placeholder="Add a need..."
      />
      <div className="space-y-1">
        {needs.map((needItem: string, index: number) => (
          <div
            key={`${partId}needs${index}`}
            className="flex items-center justify-between bg-green-50 border border-green-200 rounded px-2 py-1 text-sm"
          >
            <span className="text-green-800">{needItem}</span>
            <button
              onClick={() => handleRemove(index)}
              className="text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PartNeeds;
