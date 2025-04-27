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

  return (
    <div className="soothing-techniques w-full bg-[#ffffff25] p-3 rounded-md">
      <h3 className="text-xl font-bold text-node">Soothing Techniques</h3>
      <input
        className="text-sm h-[30px] w-full"
        ref={inputRef}
        value={need}
        onFocus={() => setIsEditing(true)}
        onChange={(e) => setNeed(e.target.value)}
        onKeyDown={handleEnter}
        placeholder="Enter Needs or Soothing Technique"
      />
      <ul className="list-disc list-inside">
        {needs.map(
          (need: string, index: number): React.ReactElement => (
            <li className="text-node" key={`${partId}needs${index}`}>
              {need}
            </li>
          )
        )}
      </ul>
    </div>
  );
};

export default PartNeeds;
