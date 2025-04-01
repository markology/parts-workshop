import { useFlowNodesContext } from "@/context/FlowNodesContext";
import { useUIStore } from "@/stores/UI";
import { useReactFlow } from "@xyflow/react";
import { useEffect, useRef, useState } from "react";

const PartInput = () => {
  const [value, setValue] = useState("");
  const { setNodes } = useFlowNodesContext();
  const partInputRef = useRef<HTMLInputElement | null>(null);
  const { getViewport, setCenter } = useReactFlow();
  const setShowPartModal = useUIStore((s) => s.setShowPartModal);

  const addPartNode = (e: { key: string }) => {
    if (e.key === "Enter" && value.trim()) {
      const viewport = getViewport();
      const newPart = {
        id: `${Date.now()}`,
        type: "part",
        position: { x: viewport.x, y: viewport.y },
        style: { zIndex: -1 },
        data: {
          label: value,
          emotions: [],
          thoughts: [],
          sensations: [],
          behaviors: [],
          others: [],
          self: [],
        },
      };
      setValue("");
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

  useEffect(() => {
    partInputRef.current?.focus();
  }, []);

  return (
    <div>
      <input
        ref={partInputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-full p-9 mb-3 border rounded bg-white outline-none border-none h-16 text-2xl w-[600px]"
        style={{ color: "black" }}
        onKeyDown={addPartNode}
        placeholder="Enter Part Name"
      />
    </div>
  );
};

export default PartInput;
