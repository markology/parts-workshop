import { useFlowNodesContext } from "@/features/workspace/state/FlowNodesContext";
import { PartNodeData } from "@/features/workspace/types/Nodes";
import { useUIStore } from "@/features/workspace/state/stores/UI";
import { useReactFlow } from "@xyflow/react";
import React, { useCallback, useRef, useState } from "react";
import { X } from "lucide-react";

const PartFears = ({ fears, partId }: { fears: string[]; partId: string }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fear, setFear] = useState("");
  const { updateNode } = useFlowNodesContext();
  const setIsEditing = useUIStore((s) => s.setIsEditing);
  const { getNode } = useReactFlow();

  const handleSave = useCallback(() => {
    if (!fear.trim()) return;
    const node = getNode(partId);
    if (node?.data) {
      updateNode<PartNodeData>(partId, {
        data: {
          ...node.data,
          fears: [...fears, fear.trim()],
        },
      });
    }
    setIsEditing(false);
    setFear("");
  }, [getNode, partId, updateNode, fears, fear, setIsEditing]);

  const handleRemove = useCallback((index: number) => {
    const node = getNode(partId);
    if (node?.data) {
      const newFears = fears.filter((_, i) => i !== index);
      updateNode<PartNodeData>(partId, {
        data: {
          ...node.data,
          fears: newFears,
        },
      });
    }
  }, [getNode, partId, updateNode, fears]);

  const handleEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSave();
    }
  };

  return (
    <div className="part-fears w-full bg-[#ffffff25] p-3 rounded-md">
      <h3 className="text-sm font-bold text-gray-700 mb-2">Fears</h3>
      <input
        className="text-sm h-[30px] w-full mb-2"
        ref={inputRef}
        value={fear}
        onFocus={() => setIsEditing(true)}
        onChange={(e) => setFear(e.target.value)}
        onKeyDown={handleEnter}
        placeholder="Add a fear..."
      />
      <div className="space-y-1">
        {fears.map((fearItem: string, index: number) => (
          <div
            key={`${partId}fears${index}`}
            className="flex items-center justify-between bg-red-50 border border-red-200 rounded px-2 py-1 text-sm"
          >
            <span className="text-red-800">{fearItem}</span>
            <button
              onClick={() => handleRemove(index)}
              className="text-red-500 hover:text-red-700"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PartFears;
