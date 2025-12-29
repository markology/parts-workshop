"use client";

import { useState, useEffect, useRef } from "react";
import { ChromePicker, ColorResult } from "react-color";
import { X, Save, Trash2, Plus } from "lucide-react";
import { useTheme } from "@/features/workspace/hooks/useTheme";
import { useThemeContext } from "@/state/context/ThemeContext";
import type { ColorGroup, CustomTheme } from "@/features/workspace/constants/theme";
import { getCustomThemes, saveCustomTheme, deleteCustomTheme, createCustomTheme, darkTheme, lightTheme, redTheme } from "@/features/workspace/constants/theme";

interface ThemeEditorProps {
  onClose: () => void;
  onThemeSelect: (themeId: string) => void;
  onThemePreview?: (colors: ColorGroup | null) => void;
}

export default function ThemeEditor({ onClose, onThemeSelect, onThemePreview }: ThemeEditorProps) {
  const theme = useTheme();
  const { themeName } = useThemeContext();
  const [customThemes, setCustomThemes] = useState(getCustomThemes());
  const [editingTheme, setEditingTheme] = useState<CustomTheme | null>(null);
  const [themeNameInput, setThemeNameInput] = useState("");
  const [baseTheme, setBaseTheme] = useState<ColorGroup>(darkTheme);
  const [currentColors, setCurrentColors] = useState<ColorGroup>(darkTheme);
  const [activeColorPicker, setActiveColorPicker] = useState<string | null>(null);
  const colorPickerRefs = useRef<Record<string, HTMLDivElement | null>>({});
  
  // Refresh custom themes list when needed
  const refreshThemes = () => {
    setCustomThemes(getCustomThemes());
  };

  // Close color picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activeColorPicker) {
        const pickerElement = colorPickerRefs.current[activeColorPicker];
        const target = event.target as Node;
        const buttonElement = document.querySelector(`[data-color-key="${activeColorPicker}"]`);
        
        // Check if click is outside both the color picker and its button
        const isOutsidePicker = pickerElement && !pickerElement.contains(target);
        const isOutsideButton = buttonElement && !buttonElement.contains(target);
        
        if (isOutsidePicker && isOutsideButton) {
          setActiveColorPicker(null);
        }
      }
    };

    if (activeColorPicker) {
      // Use a small delay to avoid closing immediately when opening
      const timeoutId = setTimeout(() => {
        document.addEventListener("mousedown", handleClickOutside);
      }, 100);
      
      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [activeColorPicker]);

  const handleCreateNew = () => {
    setThemeNameInput("");
    setBaseTheme(darkTheme);
    setCurrentColors(darkTheme);
    setEditingTheme(null);
    // Start previewing the new theme
    if (onThemePreview) {
      onThemePreview(darkTheme);
    }
  };

  const handleEdit = (customTheme: CustomTheme) => {
    setThemeNameInput(customTheme.name);
    setBaseTheme(customTheme.colors);
    setCurrentColors(customTheme.colors);
    setEditingTheme(customTheme);
    // Start previewing the theme being edited
    if (onThemePreview) {
      onThemePreview(customTheme.colors);
    }
  };

  const handleSave = () => {
    if (!themeNameInput.trim()) return;

    const themeToSave: CustomTheme = {
      id: editingTheme?.id || `custom-${Date.now()}`,
      name: themeNameInput.trim(),
      colors: currentColors,
      createdAt: editingTheme?.createdAt || Date.now(),
    };

    saveCustomTheme(themeToSave);
    refreshThemes();
    setEditingTheme(null);
    setThemeNameInput("");
    // Keep preview active after saving
    if (onThemePreview) {
      onThemePreview(currentColors);
    }
  };

  const handleDelete = (themeId: string) => {
    if (confirm("Are you sure you want to delete this theme?")) {
      deleteCustomTheme(themeId);
      refreshThemes();
      if (editingTheme?.id === themeId) {
        setEditingTheme(null);
        setThemeNameInput("");
      }
    }
  };

  const updateColor = (key: keyof ColorGroup, color: string) => {
    const newColors = { ...currentColors, [key]: color };
    setCurrentColors(newColors);
    // Live preview: apply theme immediately
    if (onThemePreview) {
      onThemePreview(newColors);
    }
    // Don't close color picker - let user close it by clicking outside
  };

  const colorGroups: Array<{ label: string; keys: Array<keyof ColorGroup> }> = [
    {
      label: "Backgrounds",
      keys: ["workspace", "card", "modal", "sidebar", "elevated", "surface"],
    },
    {
      label: "Buttons",
      keys: ["button", "buttonHover", "buttonActive", "buttonText"],
    },
    {
      label: "Text",
      keys: ["textPrimary", "textSecondary", "textMuted"],
    },
    {
      label: "Borders",
      keys: ["border", "borderSubtle"],
    },
    {
      label: "Accents",
      keys: ["accent", "accentHover", "accentActive"],
    },
  ];

  return (
    <div 
      className="space-y-4"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold" style={{ color: theme.textPrimary }}>
          Custom Themes
        </h3>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-opacity-20"
          style={{ color: theme.textSecondary }}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Custom Themes List */}
      {customThemes.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs" style={{ color: theme.textSecondary }}>
            Your themes:
          </p>
          {customThemes.map((customTheme: CustomTheme) => (
            <div
              key={customTheme.id}
              className="flex items-center gap-2 p-2 rounded-lg border"
              style={{
                backgroundColor: theme.surface,
                borderColor: theme.border,
              }}
            >
              <div
                className="flex-1 cursor-pointer"
                onClick={() => {
                  onThemeSelect(customTheme.id);
                  onClose();
                }}
              >
                <div className="text-sm font-medium" style={{ color: theme.textPrimary }}>
                  {customTheme.name}
                </div>
                <div className="flex gap-1 mt-1">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: customTheme.colors.workspace }}
                  />
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: customTheme.colors.card }}
                  />
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: customTheme.colors.accent }}
                  />
                </div>
              </div>
              <button
                onClick={() => handleEdit(customTheme)}
                className="p-1 rounded text-xs"
                style={{
                  backgroundColor: theme.button,
                  color: theme.buttonText,
                }}
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(customTheme.id)}
                className="p-1 rounded text-xs"
                style={{
                  backgroundColor: theme.error,
                  color: theme.buttonText,
                }}
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Form */}
      {(!editingTheme || editingTheme) && (
        <div
          className="p-4 rounded-lg border space-y-4"
          style={{
            backgroundColor: theme.surface,
            borderColor: theme.border,
          }}
        >
          <div className="flex items-center gap-2">
            <button
              onClick={handleCreateNew}
              className="p-2 rounded text-xs flex items-center gap-1"
              style={{
                backgroundColor: theme.button,
                color: theme.buttonText,
              }}
            >
              <Plus className="w-3 h-3" />
              New Theme
            </button>
            {editingTheme && (
              <span className="text-xs" style={{ color: theme.textSecondary }}>
                Editing: {editingTheme.name}
              </span>
            )}
          </div>

          <div>
            <label className="text-xs block mb-1" style={{ color: theme.textSecondary }}>
              Theme Name
            </label>
            <input
              type="text"
              value={themeNameInput}
              onChange={(e) => setThemeNameInput(e.target.value)}
              placeholder="My Custom Theme"
              className="w-full px-3 py-2 rounded text-sm"
              style={{
                backgroundColor: theme.card,
                borderColor: theme.border,
                color: theme.textPrimary,
              }}
            />
          </div>

          <div>
            <label className="text-xs block mb-2" style={{ color: theme.textSecondary }}>
              Base Theme
            </label>
            <div className="flex gap-2">
              {[
                { name: "Dark", theme: darkTheme },
                { name: "Light", theme: lightTheme },
                { name: "Cherry", theme: redTheme },
              ].map(({ name, theme: base }) => (
                <button
                  key={name}
                  onClick={() => {
                    setBaseTheme(base);
                    setCurrentColors(base);
                    // Update preview when base theme changes
                    if (onThemePreview) {
                      onThemePreview(base);
                    }
                  }}
                  className="px-3 py-1 rounded text-xs"
                  style={{
                    backgroundColor:
                      baseTheme === base ? theme.accent : theme.button,
                    color: theme.buttonText,
                  }}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          {/* Color Groups */}
          <div className="space-y-4 max-h-[400px] overflow-y-auto">
            {colorGroups.map((group) => (
              <div key={group.label}>
                <h4 className="text-xs font-medium mb-2" style={{ color: theme.textSecondary }}>
                  {group.label}
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {group.keys.map((key) => (
                    <div key={key} className="relative">
                      <button
                        data-color-key={key}
                        onClick={() =>
                          setActiveColorPicker(
                            activeColorPicker === key ? null : key
                          )
                        }
                        className="w-full p-2 rounded border flex items-center gap-2"
                        style={{
                          backgroundColor: theme.card,
                          borderColor: theme.border,
                        }}
                      >
                        <div
                          className="w-6 h-6 rounded border"
                          style={{
                            backgroundColor: currentColors[key],
                            borderColor: theme.border,
                          }}
                        />
                        <span className="text-xs flex-1 text-left" style={{ color: theme.textPrimary }}>
                          {key}
                        </span>
                      </button>
                      {activeColorPicker === key && (
                        <div
                          ref={(el) => {
                            colorPickerRefs.current[key] = el;
                          }}
                          className="absolute z-50 mt-1"
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                          onMouseDown={(e) => {
                            e.stopPropagation();
                          }}
                        >
                          <ChromePicker
                            color={currentColors[key]}
                            onChange={(color: ColorResult) => {
                              updateColor(key, color.hex);
                            }}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleSave}
            disabled={!themeNameInput.trim()}
            className="w-full py-2 rounded text-sm font-medium flex items-center justify-center gap-2"
            style={{
              backgroundColor: theme.accent,
              color: theme.buttonText,
              opacity: themeNameInput.trim() ? 1 : 0.5,
            }}
          >
            <Save className="w-4 h-4" />
            {editingTheme ? "Update Theme" : "Save Theme"}
          </button>
        </div>
      )}
    </div>
  );
}

