import React, { useEffect, useRef, useState } from "react";
import { NodeBackgroundColors, NodeColors } from "@/constants/Nodes";
import { ImpressionList } from "@/constants/Impressions";
import { ImpressionType } from "@/types/Impressions";
import { useSidebarStore } from "@/stores/Sidebar";

const ImpressionInput = () => {
  const [traitInput, setTraitInput] = useState("");
  const [selectedType, setSelectedType] = useState<ImpressionType>("emotion");
  const [isSelectorOpen, setIsSelectorOpen] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const { addImpression } = useSidebarStore();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsSelectorOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const createSideBarNode = (e: { key: string }) => {
    if (e.key === "Enter" && selectedType !== null) {
      addImpression({
        id: `${Date.now()}`,
        label: traitInput,
        type: selectedType,
      });
      setTraitInput("");
    }
  };

  return (
    <div ref={containerRef} className="relative space-y-2">
      <div
        className="relative rounded"
        style={{ background: NodeBackgroundColors[selectedType] }}
      >
        <div className="absolute top-2 left-2 flex flex-wrap gap-2 z-10 p-[10px]">
          <button
            onClick={() => setIsSelectorOpen(!isSelectorOpen)}
            className="px-3 py-1 rounded-full text-sm capitalize"
            style={{
              backgroundColor: NodeColors[selectedType],
              color: "black",
            }}
          >
            {selectedType || "Select Type"}
          </button>
        </div>

        <textarea
          ref={textAreaRef}
          value={traitInput}
          onChange={(e) => setTraitInput(e.target.value)}
          className="w-full p-2 pt-11 px-5 rounded resize-y focus:outline-none focus:ring-0 focus:border-none pt-[60px]"
          rows={5}
          onKeyDown={createSideBarNode}
          placeholder="Add Impression"
        />
        {isSelectorOpen && (
          <div
            id="impression-selector"
            className="absolute top-0 left-0 bg-white border rounded-t shadow-lg z-20 p-2 w-full p-[10px] mt-none"
          >
            <div className="flex flex-wrap gap-2 justify-evenly">
              {ImpressionList.map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    setSelectedType(type);
                    setIsSelectorOpen(false);
                    textAreaRef.current?.focus();
                  }}
                  className="px-3 py-1 rounded-full text-sm capitalize"
                  style={{
                    backgroundColor: NodeColors[type],
                    color: "black",
                  }}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImpressionInput;
