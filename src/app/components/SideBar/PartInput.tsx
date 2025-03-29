import { NodeStateType } from "@/app/page";
import { useState } from "react";

const PartInput = ({ setNodes }: { setNodes: NodeStateType["setNodes"] }) => {
  const [value, setValue] = useState("");

  const addPartNode = (e: { key: string }) => {
    if (e.key === "Enter") {
      const newPart = {
        id: `${Date.now()}`,
        type: "part",
        position: { x: 100, y: 100 }, // Initial position
        data: {
          label: value, // Unique label
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
      // check if matching part name and re-evaluate input
    }
  };

  return (
    <div>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-full p-2 mb-3 border rounded"
        onKeyDown={addPartNode}
        placeholder="Add Part"
      />
    </div>
  );
};

export default PartInput;
