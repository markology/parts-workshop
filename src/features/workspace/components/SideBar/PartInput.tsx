"use client";

import { useFlowNodesContext } from "@/features/workspace/state/FlowNodesContext";
import { useUIStore } from "@/features/workspace/state/stores/UI";
import { useRef, useState } from "react";

const PartInput = () => {
  const { createNode } = useFlowNodesContext();

  const setShowPartModal = useUIStore((s) => s.setShowPartModal);
  const partInputRef = useRef<HTMLInputElement | null>(null);
  const [partType, setPartType] = useState("manager");

  const addPartNode = (e: { key: string }) => {
    if (e.key === "Enter" && partInputRef.current!.value.trim()) {
      createNode("part", partInputRef.current!.value, undefined, undefined, { customPartType: partType });
      partInputRef.current!.value = "";
      setShowPartModal(false);
    }
  };

  return (
    <div className="space-y-4">
      <input
        ref={partInputRef}
        className="w-full p-9 border rounded bg-white outline-none border-none h-16 text-2xl w-[600px] text-black"
        onKeyDown={addPartNode}
        placeholder="Type your new part name and press enter ↵"
        autoFocus
      />
      
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-gray-700">Part Type:</label>
        <select
          value={partType}
          onChange={(e) => setPartType(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="exile" className="text-gray-900">Exile</option>
          <option value="manager" className="text-gray-900">Manager</option>
          <option value="protector" className="text-gray-900">Protector</option>
          <option value="firefighter" className="text-gray-900">Firefighter</option>
        </select>
      </div>
    </div>
  );
};

export default PartInput;
