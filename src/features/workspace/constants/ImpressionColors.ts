/**
 * Impression Color System
 * 
 * This file contains all impression colors organized by theme (dark/light) and usage context.
 * All colors are now defined in colors.css as CSS variables and referenced here.
 */

import { ImpressionType } from "../types/Impressions";

// ============================================================================
// DARK MODE COLORS
// ============================================================================

/**
 * Impression Input Modal Colors (Dark Mode)
 */
export const ImpressionInputModalColorsDark = {
  emotion: {
    modalBg: "var(--impression-dark-emotion-modal-bg)",
    topLeftPillBg: "var(--impression-dark-emotion-top-left-pill-bg)",
    inputPillBg: "var(--impression-dark-emotion-input-pill-bg)",
    pillFont: "var(--impression-dark-emotion-pill-font)",
    inputPillFont: "var(--impression-dark-emotion-input-pill-font)",
    addButtonBg: "var(--impression-dark-emotion-add-button-bg)",
  },
  thought: {
    modalBg: "var(--impression-dark-thought-modal-bg)",
    topLeftPillBg: "var(--impression-dark-thought-top-left-pill-bg)",
    inputPillBg: "var(--impression-dark-thought-input-pill-bg)",
    pillFont: "var(--impression-dark-thought-pill-font)",
    inputPillFont: "var(--impression-dark-thought-input-pill-font)",
    addButtonBg: "var(--impression-dark-thought-add-button-bg)",
  },
  sensation: {
    modalBg: "var(--impression-dark-sensation-modal-bg)",
    topLeftPillBg: "var(--impression-dark-sensation-top-left-pill-bg)",
    inputPillBg: "var(--impression-dark-sensation-input-pill-bg)",
    pillFont: "var(--impression-dark-sensation-pill-font)",
    inputPillFont: "var(--impression-dark-sensation-input-pill-font)",
    addButtonBg: "var(--impression-dark-sensation-add-button-bg)",
  },
  behavior: {
    modalBg: "var(--impression-dark-behavior-modal-bg)",
    topLeftPillBg: "var(--impression-dark-behavior-top-left-pill-bg)",
    inputPillBg: "var(--impression-dark-behavior-input-pill-bg)",
    pillFont: "var(--impression-dark-behavior-pill-font)",
    inputPillFont: "var(--impression-dark-behavior-input-pill-font)",
    addButtonBg: "var(--impression-dark-behavior-add-button-bg)",
  },
  other: {
    modalBg: "var(--impression-dark-other-modal-bg)",
    topLeftPillBg: "var(--impression-dark-other-top-left-pill-bg)",
    inputPillBg: "var(--impression-dark-other-input-pill-bg)",
    pillFont: "var(--impression-dark-other-pill-font)",
    inputPillFont: "var(--impression-dark-other-input-pill-font)",
    addButtonBg: "var(--impression-dark-other-add-button-bg)",
  },
} as const;

/**
 * Base Impression Colors (Dark Mode)
 * Used in: sidebar pills, part details pills, journal, nodes
 */
export const ImpressionBaseColorsDark = {
  emotion: {
    font: "var(--impression-dark-emotion-font)",
    background: "var(--impression-dark-emotion-background)",
    partNodeTypeFont: "var(--impression-dark-emotion-part-node-type-font)",
    sidebarHeaderBg: "var(--impression-dark-emotion-sidebar-header-bg)",
    borderColor: "var(--impression-dark-emotion-border-color)",
  },
  thought: {
    font: "var(--impression-dark-thought-font)",
    background: "var(--impression-dark-thought-background)",
    partNodeTypeFont: "var(--impression-dark-thought-part-node-type-font)",
    sidebarHeaderBg: "var(--impression-dark-thought-sidebar-header-bg)",
    borderColor: "var(--impression-dark-thought-border-color)",
  },
  sensation: {
    font: "var(--impression-dark-sensation-font)",
    background: "var(--impression-dark-sensation-background)",
    partNodeTypeFont: "var(--impression-dark-sensation-part-node-type-font)",
    sidebarHeaderBg: "var(--impression-dark-sensation-sidebar-header-bg)",
    borderColor: "var(--impression-dark-sensation-border-color)",
  },
  behavior: {
    font: "var(--impression-dark-behavior-font)",
    background: "var(--impression-dark-behavior-background)",
    partNodeTypeFont: "var(--impression-dark-behavior-part-node-type-font)",
    sidebarHeaderBg: "var(--impression-dark-behavior-sidebar-header-bg)",
    borderColor: "var(--impression-dark-behavior-border-color)",
  },
  other: {
    font: "var(--impression-dark-other-font)",
    background: "var(--impression-dark-other-background)",
    partNodeTypeFont: "var(--impression-dark-other-part-node-type-font)",
    sidebarHeaderBg: "var(--impression-dark-other-sidebar-header-bg)",
    borderColor: "var(--impression-dark-other-border-color)",
  },
} as const;

// ============================================================================
// LIGHT MODE COLORS
// ============================================================================

/**
 * Impression Input Modal Colors (Light Mode)
 */
export const ImpressionInputModalColorsLight = {
  emotion: {
    modalBg: "var(--impression-light-emotion-modal-bg)",
    topLeftPillBg: "var(--impression-light-emotion-top-left-pill-bg)",
    inputPillBg: "var(--impression-light-emotion-input-pill-bg)",
    pillFont: "var(--impression-light-emotion-pill-font)",
    inputPillFont: "var(--impression-light-emotion-input-pill-font)",
    addButtonBg: "var(--impression-light-emotion-add-button-bg)",
  },
  thought: {
    modalBg: "var(--impression-light-thought-modal-bg)",
    topLeftPillBg: "var(--impression-light-thought-top-left-pill-bg)",
    inputPillBg: "var(--impression-light-thought-input-pill-bg)",
    pillFont: "var(--impression-light-thought-pill-font)",
    inputPillFont: "var(--impression-light-thought-input-pill-font)",
    addButtonBg: "var(--impression-light-thought-add-button-bg)",
  },
  sensation: {
    modalBg: "var(--impression-light-sensation-modal-bg)",
    topLeftPillBg: "var(--impression-light-sensation-top-left-pill-bg)",
    inputPillBg: "var(--impression-light-sensation-input-pill-bg)",
    pillFont: "var(--impression-light-sensation-pill-font)",
    inputPillFont: "var(--impression-light-sensation-input-pill-font)",
    addButtonBg: "var(--impression-light-sensation-add-button-bg)",
  },
  behavior: {
    modalBg: "var(--impression-light-behavior-modal-bg)",
    topLeftPillBg: "var(--impression-light-behavior-top-left-pill-bg)",
    inputPillBg: "var(--impression-light-behavior-input-pill-bg)",
    pillFont: "var(--impression-light-behavior-pill-font)",
    inputPillFont: "var(--impression-light-behavior-input-pill-font)",
    addButtonBg: "var(--impression-light-behavior-add-button-bg)",
  },
  other: {
    modalBg: "var(--impression-light-other-modal-bg)",
    topLeftPillBg: "var(--impression-light-other-top-left-pill-bg)",
    inputPillBg: "var(--impression-light-other-input-pill-bg)",
    pillFont: "var(--impression-light-other-pill-font)",
    inputPillFont: "var(--impression-light-other-input-pill-font)",
    addButtonBg: "var(--impression-light-other-add-button-bg)",
  },
} as const;

/**
 * Part Details Header Colors (Light Mode)
 * Used in: Impression names in the part details pane
 */
export const ImpressionPartDetailsHeaderColorsLight = {
  emotion: "var(--impression-light-emotion-part-details-header)",
  thought: "var(--impression-light-thought-part-details-header)",
  sensation: "var(--impression-light-sensation-part-details-header)",
  behavior: "var(--impression-light-behavior-part-details-header)",
  other: "var(--impression-light-other-part-details-header)",
} as const;

/**
 * Base Impression Colors (Light Mode)
 * Used in: sidebar pills, part details pills, journal, nodes
 */
export const ImpressionBaseColorsLight = {
  emotion: {
    font: "var(--impression-light-emotion-font)",
    background: "var(--impression-light-emotion-background)",
    sidebarHeaderBg: "var(--impression-light-emotion-sidebar-header-bg)",
  },
  thought: {
    font: "var(--impression-light-thought-font)",
    background: "var(--impression-light-thought-background)",
    sidebarHeaderBg: "var(--impression-light-thought-sidebar-header-bg)",
  },
  sensation: {
    font: "var(--impression-light-sensation-font)",
    background: "var(--impression-light-sensation-background)",
    sidebarHeaderBg: "var(--impression-light-sensation-sidebar-header-bg)",
  },
  behavior: {
    font: "var(--impression-light-behavior-font)",
    background: "var(--impression-light-behavior-background)",
    sidebarHeaderBg: "var(--impression-light-behavior-sidebar-header-bg)",
  },
  other: {
    font: "var(--impression-light-other-font)",
    background: "var(--impression-light-other-background)",
    sidebarHeaderBg: "var(--impression-light-other-sidebar-header-bg)",
  },
} as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get base impression colors based on theme
 */
export const getImpressionBaseColors = (darkMode: boolean) => {
  return darkMode ? ImpressionBaseColorsDark : ImpressionBaseColorsLight;
};

/**
 * Get sidebar header background color for an impression type
 */
export const getImpressionSidebarHeaderBg = (
  type: ImpressionType,
  darkMode: boolean
): string => {
  const baseColorsMap = getImpressionBaseColors(darkMode);
  const baseColors = (type in baseColorsMap ? baseColorsMap[type as keyof typeof baseColorsMap] : null);
  if (!baseColors) {
    return darkMode ? "var(--impression-dark-emotion-sidebar-header-bg)" : "var(--impression-light-emotion-sidebar-header-bg)";
  }
  return darkMode 
    ? (baseColors as typeof ImpressionBaseColorsDark[keyof typeof ImpressionBaseColorsDark]).sidebarHeaderBg
    : (baseColors as typeof ImpressionBaseColorsLight[keyof typeof ImpressionBaseColorsLight]).sidebarHeaderBg;
};

/**
 * Get border color for impression headers (dark mode only)
 * Light mode uses base background color
 */
export const getImpressionHeaderBorderColor = (
  type: ImpressionType,
  darkMode: boolean
): string => {
  if (darkMode) {
    if (type in ImpressionBaseColorsDark) {
      return (ImpressionBaseColorsDark[type as keyof typeof ImpressionBaseColorsDark] as typeof ImpressionBaseColorsDark[keyof typeof ImpressionBaseColorsDark]).borderColor;
    }
    return "var(--impression-dark-emotion-border-color)";
  }
  // Light mode uses base background color as border
  if (type in ImpressionBaseColorsLight) {
    return ImpressionBaseColorsLight[type as keyof typeof ImpressionBaseColorsLight].background;
  }
  return "var(--impression-light-emotion-background)";
};

/**
 * Get part details header color
 * Dark mode: always white
 * Light mode: uses part details header color
 */
export const getImpressionPartDetailsHeaderColor = (
  type: ImpressionType,
  darkMode: boolean
): string => {
  if (darkMode) {
    return "rgb(255, 255, 255)"; // Always white in dark mode
  }
  if (type in ImpressionPartDetailsHeaderColorsLight) {
    return ImpressionPartDetailsHeaderColorsLight[type as keyof typeof ImpressionPartDetailsHeaderColorsLight];
  }
  return "var(--impression-light-emotion-part-details-header)";
};

/**
 * Get part node impression type font color (dark mode only)
 * Light mode uses regular font color
 */
export const getPartNodeImpressionTypeFont = (
  type: ImpressionType,
  darkMode: boolean
): string => {
  if (darkMode) {
    if (type in ImpressionBaseColorsDark) {
      return ImpressionBaseColorsDark[type as keyof typeof ImpressionBaseColorsDark].partNodeTypeFont;
    }
    return "var(--impression-dark-emotion-part-node-type-font)";
  }
  if (type in ImpressionBaseColorsLight) {
    return ImpressionBaseColorsLight[type as keyof typeof ImpressionBaseColorsLight].font;
  }
  return "var(--impression-light-emotion-font)";
};

/**
 * Get impression input modal colors based on theme
 */
export const getImpressionInputModalColors = (darkMode: boolean) => {
  return darkMode
    ? ImpressionInputModalColorsDark
    : ImpressionInputModalColorsLight;
};

/**
 * Get font color for impression pills (outside input modal)
 * Dark mode: white
 * Light mode: base font color
 */
export const getImpressionPillFontColor = (
  type: ImpressionType,
  darkMode: boolean
): string => {
  if (darkMode) {
    return "rgb(255, 255, 255)";
  }
  if (type in ImpressionBaseColorsLight) {
    return ImpressionBaseColorsLight[type as keyof typeof ImpressionBaseColorsLight].font;
  }
  return "var(--impression-light-emotion-font)";
};
