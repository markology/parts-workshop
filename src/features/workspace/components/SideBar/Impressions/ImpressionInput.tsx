"use client";

import { ImpressionList } from "@/features/workspace/constants/Impressions";
import { NodeBackgroundColors } from "@/features/workspace/constants/Nodes";
import { useWorkingStore } from "@/features/workspace/state/stores/useWorkingStore";
import {
  ImpressionTextType,
  ImpressionType,
} from "@/features/workspace/types/Impressions";
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

interface ImpressionInputProps {
  onAddImpression?: (impressionData: { id: string; label: string; type: ImpressionType }) => void;
  onTypeChange?: (type: ImpressionType) => void;
  defaultType?: ImpressionType;
}

const ImpressionInput = ({ onAddImpression, onTypeChange, defaultType = "emotion" }: ImpressionInputProps) => {
  const [selectedType, setSelectedType] = useState<ImpressionType>(defaultType);
  const [isSelectorOpen, setIsSelectorOpen] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const handleTextAreaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (
      e.key === "Enter" &&
      selectedType !== null &&
      isValidImpression(textAreaRef.current!.value)
    ) {
      e.preventDefault();
      const impressionData = {
        id: uuidv4(),
        label: textAreaRef.current!.value,
        type: selectedType,
      };
      
      if (onAddImpression) {
        onAddImpression(impressionData);
      } else {
        useWorkingStore.getState().addImpression(impressionData);
      }
      textAreaRef.current!.value = "";
    } else if (e.key === "Tab") {
      e.preventDefault();
      const currentIndex = ImpressionList.indexOf(selectedType);
      let newIndex;
      
      if (e.shiftKey) {
        // Shift+Tab: go backwards
        newIndex = currentIndex > 0 ? currentIndex - 1 : ImpressionList.length - 1;
      } else {
        // Tab: go forwards
        newIndex = currentIndex < ImpressionList.length - 1 ? currentIndex + 1 : 0;
      }
      
      setSelectedType(ImpressionList[newIndex]);
    }
  };

  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.focus();
    }
    if (onTypeChange) {
      onTypeChange(selectedType);
    }
  }, [selectedType, onTypeChange]);

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
    <div ref={containerRef} className="relative space-y-4">
      <div className="flex flex-wrap gap-2">
        {ImpressionList.map((type) => (
          <button
            key={type}
            onClick={() => {
              setSelectedType(type);
              setIsSelectorOpen(false);
            }}
            className={`px-3.5 py-2 rounded-full text-xs font-semibold ${
              selectedType === type
                ? "shadow-sm"
                : "opacity-60"
            }`}
            style={{
              backgroundColor: selectedType === type 
                ? `${NodeBackgroundColors[type]}20` 
                : "transparent",
              color: selectedType === type 
                ? NodeBackgroundColors[type] 
                : undefined,
              border: selectedType === type 
                ? `1.5px solid ${NodeBackgroundColors[type]}40` 
                : "1.5px solid transparent",
            }}
          >
            {ImpressionTextType[type]}
          </button>
        ))}
      </div>
      <div className="relative">
        <textarea
          style={{
            visibility: !isSelectorOpen ? "visible" : "hidden",
            color: NodeBackgroundColors[selectedType],
            backgroundColor: "transparent",
            '--tw-placeholder-color': `${NodeBackgroundColors[selectedType]}90`,
          } as React.CSSProperties}
          ref={textAreaRef}
          className="w-full p-4 rounded-xl resize-y focus:outline-none font-medium placeholder:opacity-90 text-base"
          rows={5}
          autoFocus
          onKeyDown={handleTextAreaKeyDown}
          placeholder="Type your impression here..."
        />
      </div>
    </div>
  );
};

export default ImpressionInput;
