"use client";

import { useFlowNodesContext } from "@/features/workspace/state/FlowNodesContext";
import { useUIStore } from "@/features/workspace/state/stores/UI";
import { useRef } from "react";

const PartInput = () => {
  const { createNode } = useFlowNodesContext();

  const setShowPartModal = useUIStore((s) => s.setShowPartModal);
  const partInputRef = useRef<HTMLInputElement | null>(null);

  const addPartNode = (e: { key: string }) => {
    if (e.key === "Enter" && partInputRef.current!.value.trim()) {
      createNode("part", partInputRef.current!.value);
      partInputRef.current!.value = "";
      setShowPartModal(false);
    }
  };

  return (
    <div>
      <input
        ref={partInputRef}
        className="w-full p-9 mb-3 border rounded bg-white outline-none border-none h-16 text-2xl w-[600px] text-black"
        onKeyDown={addPartNode}
        placeholder="Type your new part name and press enter ↵"
        autoFocus
      />
    </div>
  );
};

export default PartInput;
