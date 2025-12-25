/**
 * Impression Color System
 * 
 * This file contains all impression colors organized by theme (dark/light) and usage context.
 * All colors are hard RGB values with no opacities.
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
    modalBg: "rgb(61, 81, 68)",
    topLeftPillBg: "rgb(42, 42, 42)",
    inputPillBg: "rgb(42, 42, 42)",
    pillFont: "rgb(139, 203, 139)",
    inputPillFont: "rgb(139, 203, 139)",
    addButtonBg: "rgb(82, 113, 87)",
  },
  thought: {
    modalBg: "rgb(57, 74, 90)",
    topLeftPillBg: "rgb(42, 42, 42)",
    inputPillBg: "rgb(42, 42, 42)",
    pillFont: "rgb(122, 179, 224)",
    inputPillFont: "rgb(122, 179, 224)",
    addButtonBg: "rgb(75, 101, 125)",
  },
  sensation: {
    modalBg: "rgb(88, 64, 66)",
    topLeftPillBg: "rgb(42, 42, 42)",
    inputPillBg: "rgb(42, 42, 42)",
    pillFont: "rgb(249, 177, 122)",
    inputPillFont: "rgb(249, 177, 122)",
    addButtonBg: "rgb(129, 84, 83)",
  },
  behavior: {
    modalBg: "rgb(89, 74, 64)",
    topLeftPillBg: "rgb(42, 42, 42)",
    inputPillBg: "rgb(42, 42, 42)",
    pillFont: "rgb(242, 140, 130)",
    inputPillFont: "rgb(242, 140, 130)",
    addButtonBg: "rgb(130, 101, 80)",
  },
  other: {
    modalBg: "rgb(30, 76, 74)",
    topLeftPillBg: "rgb(42, 42, 42)",
    inputPillBg: "rgb(42, 42, 42)",
    pillFont: "rgb(20, 184, 166)",
    inputPillFont: "rgb(20, 184, 166)",
    addButtonBg: "rgb(28, 105, 99)",
  },
} as const;

/**
 * Base Impression Colors (Dark Mode)
 * Used in: sidebar pills, part details pills, journal, nodes
 */
export const ImpressionBaseColorsDark = {
  emotion: {
    font: "rgb(139, 203, 139)",
    background: "rgb(86, 117, 90)",
    partNodeTypeFont: "rgb(55, 81, 55)",
    sidebarHeaderBg: "rgb(71, 92, 76)",
    borderColor: "rgb(107, 149, 133)", // Adjusted proportionally from thought change
  },
  thought: {
    font: "rgb(122, 179, 224)",
    background: "rgb(76, 104, 126)",
    partNodeTypeFont: "rgb(48, 71, 89)",
    sidebarHeaderBg: "rgb(65, 85, 102)",
    borderColor: "rgb(97, 136, 169)", // User specified
  },
  sensation: {
    font: "rgb(249, 177, 122)",
    background: "rgb(130, 87, 85)",
    partNodeTypeFont: "rgb(96, 56, 52)",
    sidebarHeaderBg: "rgb(102, 73, 73)",
    borderColor: "rgb(151, 119, 128)", // Adjusted proportionally from thought change
  },
  behavior: {
    font: "rgb(242, 140, 130)",
    background: "rgb(133, 104, 81)",
    partNodeTypeFont: "rgb(99, 70, 48)",
    sidebarHeaderBg: "rgb(103, 84, 71)",
    borderColor: "rgb(154, 136, 124)", // Adjusted proportionally from thought change
  },
  other: {
    font: "rgb(20, 184, 166)",
    background: "rgb(29, 104, 98)",
    partNodeTypeFont: "rgb(8, 73, 66)",
    sidebarHeaderBg: "rgb(34, 87, 84)",
    borderColor: "rgb(50, 136, 141)", // Adjusted proportionally from thought change
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
    modalBg: "rgb(239, 248, 239)",
    topLeftPillBg: "rgb(225, 242, 224)",
    inputPillBg: "rgba(255, 255, 255, 0.76)",
    pillFont: "rgb(63, 113, 66)",
    inputPillFont: "rgb(139, 203, 139)", // Part details header color
    addButtonBg: "rgb(139, 203, 139)", // Part details header color
  },
  thought: {
    modalBg: "rgb(236, 244, 251)",
    topLeftPillBg: "rgb(220, 233, 246)",
    inputPillBg: "rgba(255, 255, 255, 0.76)",
    pillFont: "rgb(62, 110, 145)",
    inputPillFont: "rgb(122, 179, 224)", // Part details header color
    addButtonBg: "rgb(122, 179, 224)", // Part details header color
  },
  sensation: {
    modalBg: "rgb(253, 239, 237)",
    topLeftPillBg: "rgb(251, 225, 221)",
    inputPillBg: "rgba(255, 255, 255, 0.76)",
    pillFont: "rgb(153, 73, 54)",
    inputPillFont: "rgb(242, 140, 130)", // Part details header color
    addButtonBg: "rgb(242, 140, 130)", // Part details header color
  },
  behavior: {
    modalBg: "rgb(254, 244, 236)",
    topLeftPillBg: "rgb(253, 233, 219)",
    inputPillBg: "rgba(255, 255, 255, 0.76)",
    pillFont: "rgb(155, 96, 52)",
    inputPillFont: "rgb(249, 177, 122)", // Part details header color
    addButtonBg: "rgb(249, 177, 122)", // Part details header color
  },
  other: {
    modalBg: "rgb(222, 245, 242)",
    topLeftPillBg: "rgb(194, 235, 230)",
    inputPillBg: "rgba(255, 255, 255, 0.76)",
    pillFont: "rgb(13, 148, 136)",
    inputPillFont: "rgb(20, 184, 166)", // Part details header color
    addButtonBg: "rgb(20, 184, 166)", // Part details header color
  },
} as const;

/**
 * Part Details Header Colors (Light Mode)
 * Used in: Impression names in the part details pane
 */
export const ImpressionPartDetailsHeaderColorsLight = {
  emotion: "rgb(139, 203, 139)",
  thought: "rgb(122, 179, 224)",
  sensation: "rgb(242, 140, 130)",
  behavior: "rgb(249, 177, 122)",
  other: "rgb(20, 184, 166)",
} as const;

/**
 * Base Impression Colors (Light Mode)
 * Used in: sidebar pills, part details pills, journal, nodes
 */
export const ImpressionBaseColorsLight = {
  emotion: {
    font: "rgb(63, 113, 66)",
    background: "rgb(227, 243, 227)",
    sidebarHeaderBg: "rgb(234, 246, 234)",
  },
  thought: {
    font: "rgb(62, 110, 145)",
    background: "rgb(221, 235, 246)",
    sidebarHeaderBg: "rgb(231, 241, 249)",
  },
  sensation: {
    font: "rgb(153, 73, 54)",
    background: "rgb(249, 225, 223)",
    sidebarHeaderBg: "rgb(253, 234, 232)",
  },
  behavior: {
    font: "rgb(155, 96, 52)",
    background: "rgb(253, 235, 222)",
    sidebarHeaderBg: "rgb(254, 241, 231)",
  },
  other: {
    font: "rgb(13, 148, 136)",
    background: "rgb(198, 237, 233)",
    sidebarHeaderBg: "rgb(213, 242, 239)",
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
  const baseColors = getImpressionBaseColors(darkMode)[type];
  return darkMode 
    ? (baseColors as typeof ImpressionBaseColorsDark[ImpressionType]).sidebarHeaderBg
    : (baseColors as typeof ImpressionBaseColorsLight[ImpressionType]).sidebarHeaderBg;
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
    return (ImpressionBaseColorsDark[type] as typeof ImpressionBaseColorsDark[ImpressionType]).borderColor;
  }
  // Light mode uses base background color as border
  return ImpressionBaseColorsLight[type].background;
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
  return ImpressionPartDetailsHeaderColorsLight[type];
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
    return ImpressionBaseColorsDark[type].partNodeTypeFont;
  }
  return ImpressionBaseColorsLight[type].font;
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
  return ImpressionBaseColorsLight[type].font;
};
