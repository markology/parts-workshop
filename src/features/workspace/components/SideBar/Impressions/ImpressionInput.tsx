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
import { useThemeContext } from "@/state/context/ThemeContext";

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
  const [inputValue, setInputValue] = useState<string>("");

  const containerRef = useRef<HTMLDivElement>(null);
  const textAreaRef = useRef<HTMLInputElement>(null);

  const handleTextAreaKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
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
      setInputValue("");
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

  // Ensure input regains focus after mouse interactions
  useEffect(() => {
    const handleMouseUp = () => {
      // Small delay to ensure any focus changes from click are complete
      setTimeout(() => {
        if (textAreaRef.current && document.activeElement !== textAreaRef.current) {
          textAreaRef.current.focus();
        }
      }, 0);
    };

    document.addEventListener("mouseup", handleMouseUp);
    return () => document.removeEventListener("mouseup", handleMouseUp);
  }, []);

  // Global Tab key handler to catch Tab even when input might not have focus
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Only handle if the container is active and Tab is pressed
      if (
        containerRef.current &&
        document.activeElement &&
        (containerRef.current.contains(document.activeElement) || 
         document.activeElement === textAreaRef.current) &&
        e.key === "Tab"
      ) {
        e.preventDefault();
        e.stopPropagation();
        
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
        
        // Ensure input has focus for next key press
        if (textAreaRef.current) {
          textAreaRef.current.focus();
        }
      }
    };

    document.addEventListener("keydown", handleGlobalKeyDown, true);
    return () => document.removeEventListener("keydown", handleGlobalKeyDown, true);
  }, [selectedType]);

  const { darkMode } = useThemeContext();

  return (
    <div ref={containerRef} className="relative space-y-4">
      <div className="flex flex-wrap gap-2">
        {ImpressionList.map((type) => (
          <button
            key={type}
            type="button"
            tabIndex={-1}
            onMouseDown={(e) => {
              e.preventDefault(); // Prevent focus on mousedown
            }}
            onClick={() => {
              setSelectedType(type);
              setIsSelectorOpen(false);
              // Refocus the hidden input so Tab key handling works
              if (textAreaRef.current) {
                textAreaRef.current.focus();
              }
            }}
            className={`px-3.5 py-2 rounded-full font-semibold ${
              selectedType === type
                ? "shadow-sm"
                : "opacity-60"
            }`}
            style={{
              fontSize: '14px',
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
        <input
          type="text"
          style={{
            position: 'absolute',
            opacity: 0,
            pointerEvents: !isSelectorOpen ? 'auto' : 'none',
            width: '1px',
            height: '1px',
          }}
          ref={textAreaRef}
          className="focus:outline-none"
          autoFocus
          onKeyDown={handleTextAreaKeyDown}
          onChange={(e) => setInputValue(e.target.value)}
        />
        <div 
          className={`min-h-[120px] px-4 py-4 rounded-xl border-0 ${
            darkMode ? "text-slate-200" : "text-slate-800"
          }`}
          style={{
            color: inputValue ? NodeBackgroundColors[selectedType] : (darkMode ? "#cbd5e1" : "#1e293b"),
            backgroundColor: "transparent",
            fontSize: '16px',
            lineHeight: '1.6',
          }}
        >
          {inputValue || <span style={{ opacity: 0.7, color: `${NodeBackgroundColors[selectedType]}` }}>Type your impression here...</span>}
        </div>
      </div>
    </div>
  );
};

export default ImpressionInput;
