import React, { useEffect, useRef, useState } from "react";
import { NodeColors, NodeType } from "./../WorkshopNode";
import { nodeTypes, SideBarItem } from "./SideBar";
import { useThemeContext } from "@/app/context/ThemeContext";

const ImpressionInput = ({
  setItems,
}: {
  setItems: (item: SideBarItem) => void;
}) => {
  const [traitInput, setTraitInput] = useState("");
  const [selectedType, setSelectedType] = useState<NodeType>("emotion");
  const [isSelectorOpen, setIsSelectorOpen] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const themeContext = useThemeContext();

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
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const createSideBarNode = (e: { key: string }) => {
    if (e.key === "Enter" && selectedType !== null) {
      console.log("Creating Node", traitInput, selectedType);
      setItems({ id: `${Date.now()}`, label: traitInput, type: selectedType });
      setTraitInput("");
    }
  };

  return (
    <div ref={containerRef} className="relative space-y-2">
      <div className="relative">
        <div className="absolute top-2 left-2 flex flex-wrap gap-2 z-10">
          <button
            onClick={() => setIsSelectorOpen(!isSelectorOpen)}
            className={`px-3 py-1 rounded-full text-sm ${
              selectedType
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
            style={{ backgroundColor: NodeColors[selectedType] }}
          >
            {selectedType || "Select Type"}
          </button>
        </div>

        <textarea
          ref={textAreaRef}
          value={traitInput}
          onChange={(e) => setTraitInput(e.target.value)}
          className="w-full p-2 pt-11 border rounded resize-y"
          style={{ color: themeContext.darkMode ? "white" : "black" }}
          rows={5}
          onKeyDown={createSideBarNode}
          placeholder="Add impression"
        />
        {isSelectorOpen && (
          <div className="absolute top-0 left-0 mt-10 bg-white border rounded shadow-lg z-20 p-2">
            <div className="flex flex-wrap gap-2">
              {nodeTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    setSelectedType(type);
                    setIsSelectorOpen(false);
                    textAreaRef.current?.focus();
                  }}
                  className={`px-3 py-1 rounded-full text-sm text-white`}
                  style={{ backgroundColor: NodeColors[type] }}
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
