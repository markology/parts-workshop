import { ImpressionList } from "@/constants/Impressions";
import { NodeBackgroundColors, NodeColors } from "@/constants/Nodes";
import { useSidebarStore } from "@/stores/Sidebar";
import { ImpressionTextType, ImpressionType } from "@/types/Impressions";
import { useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";

const ImpressionInput = () => {
  const [selectedType, setSelectedType] = useState<ImpressionType>("emotion");
  const [isSelectorOpen, setIsSelectorOpen] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const { addImpression } = useSidebarStore();

  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.focus();
    }
  }, [selectedType]);

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

  const createSideBarNode = (e: { preventDefault(): unknown; key: string }) => {
    if (e.key === "Enter" && selectedType !== null) {
      e.preventDefault();
      addImpression({
        id: uuidv4(),
        label: textAreaRef.current!.value,
        type: selectedType,
      });
    }
  };

  return (
    <div ref={containerRef} className="relative space-y-2">
      <div
        className="relative rounded"
        style={{
          background: isSelectorOpen
            ? "transparent"
            : NodeBackgroundColors[selectedType],
        }}
      >
        {/* Current Impression Type and Button to Open Type Selector */}
        <div
          className="absolute top-2 left-2 flex flex-wrap gap-2 z-10 p-[10px]"
          style={{ visibility: !isSelectorOpen ? "visible" : "hidden" }}
        >
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
          style={{ visibility: !isSelectorOpen ? "visible" : "hidden" }}
          ref={textAreaRef}
          className="w-full p-2 pt-11 px-5 rounded resize-y focus:outline-none focus:ring-0 focus:border-none pt-[60px]"
          rows={5}
          onKeyDown={createSideBarNode}
          placeholder="Add Impression"
        />

        {/* Impression Type Selector */}

        {isSelectorOpen && (
          <div
            id="impression-selector"
            className="absolute top-3 left-0 bg-transparent rounded-t z-20 p-2 w-full p-[10px] mt-none"
          >
            <div className="flex flex-wrap gap-2 justify-evenly">
              {ImpressionList.map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    setSelectedType(type);
                    setIsSelectorOpen(false);
                  }}
                  className="px-3 py-1 rounded-full text-sm"
                  style={{
                    backgroundColor: NodeColors[type],
                    color: "black",
                  }}
                >
                  {ImpressionTextType[type]}
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
