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
import { useTheme } from "@/features/workspace/hooks/useTheme";
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
  onInputChange?: (value: string, isValid: boolean) => void;
  addButtonRef?: React.RefObject<{ add: () => void; isValid: boolean } | null>;
}

const ImpressionInput = ({ onAddImpression, onTypeChange, defaultType = "emotion", onInputChange, addButtonRef }: ImpressionInputProps) => {
  const [selectedType, setSelectedType] = useState<ImpressionType>(defaultType);
  const [isSelectorOpen, setIsSelectorOpen] = useState<boolean>(false);
  const [inputValue, setInputValue] = useState<string>("");

  const containerRef = useRef<HTMLDivElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  // Expose add function and validity to parent via ref
  useEffect(() => {
    if (addButtonRef) {
      (addButtonRef as any).current = {
        add: handleAddImpression,
        isValid: isValidImpression(inputValue),
      };
    }
  }, [inputValue, selectedType, addButtonRef]);

  // Notify parent of input changes
  useEffect(() => {
    if (onInputChange) {
      onInputChange(inputValue, isValidImpression(inputValue));
    }
  }, [inputValue, onInputChange]);

  const handleAddImpression = () => {
    if (selectedType !== null && isValidImpression(inputValue)) {
      const impressionData = {
        id: uuidv4(),
        label: inputValue,
        type: selectedType,
      };
      
      if (onAddImpression) {
        onAddImpression(impressionData);
      } else {
        useWorkingStore.getState().addImpression(impressionData);
      }
      setInputValue("");
      // Refocus the textarea after adding
      if (textAreaRef.current) {
        textAreaRef.current.focus();
      }
    }
  };

  const handleTextAreaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (
      e.key === "Enter" &&
      selectedType !== null &&
      isValidImpression(inputValue)
    ) {
      e.preventDefault();
      handleAddImpression();
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

  const theme = useTheme();
  const { isDark } = useThemeContext();

  return (
    <div ref={containerRef} className="relative">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {ImpressionList.map((type) => {
            return (
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
                    ? isDark
                      ? `color-mix(in srgb, var(--theme-impression-${type}-modal-bg) 70%, transparent)`
                      : `var(--theme-impression-${type}-modal-pill-bg)`
                    : "transparent",
                  color: `var(--theme-impression-${type}-modal-textarea-font)`,
                  border: "1.5px solid transparent",
                }}
              >
                {ImpressionTextType[type]}
              </button>
            );
          })}
        </div>
        <div className="relative">
          <textarea
            ref={textAreaRef as React.RefObject<HTMLTextAreaElement>}
            className="min-h-[120px] px-4 pb-4 pt-[30px] rounded-xl border-0 w-full focus:outline-none resize-none"
            style={{
              color: inputValue 
                ? `var(--theme-impression-${selectedType}-modal-textarea-font)`
                : theme.textPrimary,
              backgroundColor: "transparent",
              fontSize: '16px',
              lineHeight: '1.6',
              caretColor: `var(--theme-impression-${selectedType}-modal-textarea-font)`,
            }}
            placeholder="Type your impression here..."
            autoFocus
            onKeyDown={handleTextAreaKeyDown}
            onChange={(e) => setInputValue(e.target.value)}
            value={inputValue}
          />
          <style dangerouslySetInnerHTML={{
            __html: `
              textarea::placeholder {
                opacity: 0.7;
                color: var(--theme-impression-${selectedType}-modal-textarea-font) !important;
              }
            `
          }} />
        </div>
      </div>
    </div>
  );
};

export default ImpressionInput;

