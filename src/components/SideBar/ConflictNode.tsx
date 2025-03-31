import { useFlowNodesContext } from "@/context/FlowNodesContext";
import { useEffect, useRef, useState } from "react";
import type { Node } from "@xyflow/react";

const ConflictInput = () => {
  const [conflictingParts, setConflictingParts] = useState<
    Record<string, Node>
  >({});
  const { nodes } = useFlowNodesContext();
  // const setShowPartModal = useUIStore((s) => s.setShowPartModal);
  const conflictInputRef = useRef<HTMLInputElement | null>(null);
  // const { getViewport, setCenter } = useReactFlow();

  // const addPartNode = (e: { key: string }) => {
  //   if (e.key === "Enter" && value.trim()) {
  //     const viewport = getViewport();
  //     const newPart = {
  //       id: `${Date.now()}`,
  //       type: "part",
  //       position: { x: viewport.x, y: viewport.y },
  //       style: { zIndex: -1 },
  //       data: {
  //         label: value,
  //         emotions: [],
  //         thoughts: [],
  //         sensations: [],
  //         behaviors: [],
  //         others: [],
  //         self: [],
  //       },
  //     };
  //     setValue("");
  //     setNodes((nodes) => [...nodes, newPart]);
  //     setShowPartModal(false);

  //     setTimeout(() => {
  //       setCenter(newPart.position.x + 500, newPart.position.y + 300, {
  //         zoom: 0.6,
  //         duration: 500,
  //       });
  //     }, 0);
  //   }
  // };

  useEffect(() => {
    conflictInputRef.current?.focus();
  }, []);

  return (
    <div>
      {nodes
        .filter((n) => n.type === "part")
        .map((part) => {
          return (
            <div
              key={part.id}
              className="flex items-center justify-between mb-2"
            >
              <button
                onClick={() =>
                  setConflictingParts((prev) => {
                    if (prev[part.id]) {
                      // eslint-disable-next-line @typescript-eslint/no-unused-vars
                      const { [part.id]: _, ...rest } = prev;
                      return rest;
                    } else {
                      const cpClone = { ...prev };
                      cpClone[part.id] = part;
                      return cpClone;
                    }
                  })
                }
                className="text-red-500 bg-black hover:text-red-700"
              >
                {part.data.label as string}
              </button>
            </div>
          );
        })}
      {Object.values(conflictingParts).map((cp) => {
        return (
          <div
            className="bg-white text-white font-size-100"
            key={`cp ${cp.id}`}
          >
            {cp.data.label as string}
          </div>
        );
      })}
      {/* <input
        ref={partInputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-full p-9 mb-3 border rounded bg-white/60 outline-none border-none h-24 text-4xl w-[600px]"
        style={{ color: "black" }}
        onKeyDown={addPartNode}
        placeholder="Add Part"
      /> */}
    </div>
  );
};

export default ConflictInput;
