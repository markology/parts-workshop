import { useFlowNodesContext } from "@/features/workspace/state/FlowNodesContext";
import { useUIStore } from "@/state/UI";
import { NodeDataTypes, PartNode } from "@/types/Nodes";
import { useReactFlow } from "@xyflow/react";
import { useRef } from "react";
import { v4 as uuidv4 } from "uuid";

const PartInput = () => {
  const { setNodes } = useFlowNodesContext();
  const { getViewport, setCenter } = useReactFlow();

  const setShowPartModal = useUIStore((s) => s.setShowPartModal);
  const partInputRef = useRef<HTMLInputElement | null>(null);

  const addPartNode = (e: { key: string }) => {
    if (e.key === "Enter" && partInputRef.current!.value.trim()) {
      const viewport = getViewport();
      const newPart: PartNode = {
        id: uuidv4(),
        type: "part",
        position: { x: viewport.x, y: viewport.y },
        style: { zIndex: -1 },
        data: {
          needs: [],
          type: NodeDataTypes.PartNodeData,
          label: partInputRef.current!.value,
          Emotions: [],
          Thoughts: [],
          Sensations: [],
          Behaviors: [],
          Others: [],
          Self: [],
        },
      };
      partInputRef.current!.value = "";
      setNodes((nodes) => [...nodes, newPart]);
      setShowPartModal(false);

      setTimeout(() => {
        setCenter(newPart.position.x + 500, newPart.position.y + 300, {
          zoom: 0.6,
          duration: 500,
        });
      }, 0);
    }
  };

  return (
    <div>
      <input
        ref={partInputRef}
        className="w-full p-9 mb-3 border rounded bg-white outline-none border-none h-16 text-2xl w-[600px]"
        style={{ color: "black" }}
        onKeyDown={addPartNode}
        placeholder="Enter Part Name"
        autoFocus
      />
    </div>
  );
};

export default PartInput;
