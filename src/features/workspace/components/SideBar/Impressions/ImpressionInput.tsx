"use client";

import { ImpressionList } from "@/features/workspace/constants/Impressions";
import { NodeBackgroundColors } from "@/features/workspace/constants/Nodes";
import { useWorkingStore } from "@/features/workspace/state/useWorkingStore";
import { ImpressionTextType, ImpressionType } from "@/types/Impressions";
import { useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";

const isValidImpression = (text: string) => {
  const trimmed = text.trim();

  // Reject if empty or only newlines/spaces
  if (!trimmed || /^[\n\r\s]*$/.test(text)) return false;

  // Optional: max length
  if (trimmed.length > 500) return false;

  return true;
};

const ImpressionInput = () => {
  const [selectedType, setSelectedType] = useState<ImpressionType>("emotion");
  const [isSelectorOpen, setIsSelectorOpen] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const handleTextAreaKeyDown = (e: {
    preventDefault(): unknown;
    key: string;
  }) => {
    if (
      e.key === "Enter" &&
      selectedType !== null &&
      isValidImpression(textAreaRef.current!.value)
    ) {
      e.preventDefault();
      useWorkingStore.getState().addImpression({
        id: uuidv4(),
        label: textAreaRef.current!.value,
        type: selectedType,
      });
      textAreaRef.current!.value = "";
    } else if (e.key === "Tab") {
      e.preventDefault();
      setSelectedType(
        ImpressionList[
          ImpressionList.indexOf(selectedType) < ImpressionList.length - 1
            ? ImpressionList.indexOf(selectedType) + 1
            : 0
        ]
      );
    }
  };

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

  return (
    <div ref={containerRef} className="relative space-y-2">
      <div className="flex flex-wrap m-0">
        {ImpressionList.map((type) => (
          <button
            key={type}
            onClick={() => {
              setSelectedType(type);
              setIsSelectorOpen(false);
            }}
            className={`px-3 py-1 text-sm flex-1 rounded-t-xl ${
              selectedType === type ? "font-bold z-[9999999]" : ""
            }`}
            style={{
              backgroundColor:
                selectedType === type ? "white" : NodeBackgroundColors[type],
              color:
                selectedType === type ? NodeBackgroundColors[type] : "white",
            }}
          >
            {ImpressionTextType[type]}
          </button>
        ))}
      </div>
      <div
        className="relative rounded-b"
        style={{
          background: "white",
          boxShadow: "1px 4px 5px 2px black",
        }}
      >
        <textarea
          style={{
            visibility: !isSelectorOpen ? "visible" : "hidden",
            color: NodeBackgroundColors[selectedType],
          }}
          ref={textAreaRef}
          className="w-full p-2 pt-11 px-5 rounded resize-y focus:outline-none focus:ring-0 focus:border-none font-semibold"
          rows={3}
          autoFocus
          onKeyDown={handleTextAreaKeyDown}
          placeholder="Add Impression and Press Enter ↵ + (Tab switches types)"
        />
      </div>
    </div>
  );
};

export default ImpressionInput;
