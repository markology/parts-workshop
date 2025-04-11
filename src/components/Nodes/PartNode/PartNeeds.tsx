import { useFlowNodesContext } from "@/context/FlowNodesContext";
import { useUIStore } from "@/stores/UI";
import { PartNodeData } from "@/types/Nodes";
import { useReactFlow } from "@xyflow/react";
import React, { useCallback, useRef, useState } from "react";

const PartNeeds = ({ needs, partId }: { needs: string[]; partId: string }) => {
  const inputRef = useRef(null);
  const [need, setNeed] = useState("");
  const { updateNode } = useFlowNodesContext();
  const setIsEditing = useUIStore((s) => s.setIsEditing);
  const { getNode } = useReactFlow();

  const handleSave = useCallback(() => {
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

  return (
    <div className="w-full">
      <p>Soothing Techniques</p>
      <input
        className="text-sm h-[30px] w-full"
        ref={inputRef}
        value={need}
        onFocus={() => setIsEditing(true)}
        onChange={(e) => setNeed(e.target.value)}
        onKeyDown={handleEnter}
        placeholder="Enter Needs or Soothing Technique"
      />
      <ul>
        {needs.map(
          (need: string, index: number): React.ReactElement => (
            <li className="text-white" key={`${partId}needs${index}`}>
              {need}
            </li>
          )
        )}
      </ul>
    </div>
  );
};

export default PartNeeds;
