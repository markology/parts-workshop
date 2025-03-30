import { useFlowNodesContext } from "@/context/FlowNodesContext";
import { useUIStore } from "@/stores/UI";
import { useEffect, useRef, useState } from "react";

const PartInput = () => {
  const [value, setValue] = useState("");
  const { setNodes } = useFlowNodesContext();
  const setShowPartModal = useUIStore((s) => s.setShowPartModal);
  const partInputRef = useRef<HTMLInputElement | null>(null);

  const addPartNode = (e: { key: string }) => {
    if (e.key === "Enter" && value.trim()) {
      const newPart = {
        id: `${Date.now()}`,
        type: "part",
        position: { x: 100, y: 100 },
        style: { zIndex: -1 },
        data: {
          label: value,
          emotions: [],
          thoughts: [],
          sensations: [],
          behaviors: [],
          others: [],
          self: "",
        },
      };
      setValue("");
      setNodes((nodes) => [...nodes, newPart]);
      setShowPartModal(false);
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
        className="w-full p-2 mb-3 border rounded"
        onKeyDown={addPartNode}
        placeholder="Add Part"
        style={{
          background: "rgb(255 255 255 / 58%)",
          color: "black",
          outline: "none",
          border: "none",
          height: "100px",
          fontSize: "40px",
          width: "600px",
          padding: "37px",
        }}
      />
    </div>
  );
};

export default PartInput;
