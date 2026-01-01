/**
 * Comprehensive theme system with semantic color groupings
 * 
 * THEME ARCHITECTURE:
 * - themePref: Controls dark/light/system mode (affects Tailwind `dark:` class)
 * - themeVariant: Controls color palette/colors (red, cherry, etc.)
 * 
 * These are separate concerns: variants are independent of dark/light mode.
 */

// Base color definitions - these are the raw colors
export type ColorGroup = {
  // Background colors
  workspace: string;        // Main workspace/canvas background
  card: string;            // Card/node backgrounds
  modal: string;           // Modal/overlay backgrounds
  sidebar: string;        // Sidebar backgrounds
  elevated: string;        // Elevated surfaces (dropdowns, tooltips)
  surface: string;         // Surface backgrounds (inputs, etc.)
  
  // Button colors
  button: string;          // Default button background
  button2: string;         // Secondary button background (darker variant)
  buttonHover: string;     // Button hover state
  buttonActive: string;    // Button active/pressed state
  buttonText: string;      // Button text color
  
  // Text colors
  textPrimary: string;     // Primary text
  textSecondary: string;   // Secondary text
  textMuted: string;       // Muted/disabled text
  
  // Border colors
  border: string;          // Default borders
  borderSubtle: string;    // Subtle borders (dividers)
  
  // Accent colors
  accent: string;          // Primary accent color
  accentHover: string;     // Accent hover state
  accentActive: string;    // Accent active state
  
  // Status colors (can be customized per theme)
  success: string;
  warning: string;
  error: string;
  info: string;
  
  // Journal icon button colors
  journalIconButtonBg: string;        // Background color (used in light theme)
  journalIconButtonColor: string;     // Text color (used in dark/cherry themes)
  journalIconButtonHoverColor: string; // Hover text color (used in dark/cherry themes)
};

// Dark theme definition
export const darkTheme: ColorGroup = {
  // Backgrounds
  workspace: "#3D434B",
  card: "#212529",
  modal: "#212529",
  sidebar: "#212529",
  elevated: "#2a2e32",
  surface: "#272b2f",
  
  // Buttons
  button: "rgb(42, 46, 50)",
  button2: "#202428",
  buttonHover: "#1e2125", // Darker than default
  buttonActive: "#1e2125",
  buttonText: "#ffffff",
  
  // Text
  textPrimary: "#ffffff",
  textSecondary: "rgba(255, 255, 255, 0.7)",
  textMuted: "rgba(255, 255, 255, 0.5)",
  
  // Borders
  border: "rgba(255, 255, 255, 0.1)",
  borderSubtle: "rgba(255, 255, 255, 0.05)",
  
  // Accents
  accent: "#3d434b",
  accentHover: "#4a5159",
  accentActive: "#565d66",
  
  // Status
  success: "#10b981",
  warning: "#f59e0b",
  error: "#ef4444",
  info: "#3b82f6",
  
  // Journal icon button
  journalIconButtonBg: "white",
  journalIconButtonColor: "#e7b8b8",
  journalIconButtonHoverColor: "#ffffff",
};

// Light theme definition
export const lightTheme: ColorGroup = {
  // Backgrounds
  workspace: "#f8fafc",
  card: "#ffffff",
  modal: "#ffffff",
  sidebar: "#ffffff",
  elevated: "#f1f5f9",
  surface: "#f8fafc",
  
  // Buttons
  button: "#ffffff",
  button2: "#f1f5f9", // Lighter gray variant for light theme
  buttonHover: "#f1f5f9",
  buttonActive: "#e2e8f0",
  buttonText: "#1e293b",
  
  // Text
  textPrimary: "#1e293b",
  textSecondary: "#64748b",
  textMuted: "#94a3b8",
  
  // Borders
  border: "rgba(0, 0, 0, 0.1)",
  borderSubtle: "rgba(0, 0, 0, 0.05)",
  
  // Accents
  // Use a blue accent so the theme reads as white/blue/charcoal
  accent: "#3b82f6",       // blue-500
  accentHover: "#60a5fa",  // blue-400
  accentActive: "#2563eb", // blue-600
  
  // Status
  success: "#10b981",
  warning: "#f59e0b",
  error: "#ef4444",
  info: "#3b82f6",
  
  // Journal icon button
  journalIconButtonBg: "white",
  journalIconButtonColor: "#e7b8b8",
  journalIconButtonHoverColor: "#ffffff",
};

// Red theme variant - dark mode version
export const redThemeDark: ColorGroup = {
  ...darkTheme, // Base off dark theme
  // Canvas/page background - darker red tone
  workspace: "#5a2f2f",
  // Component backgrounds - red tones (nodes, sidebar, modals, etc.)
  card: "#2d1212",
  modal: "#2d1212",
  sidebar: "#2d1212",
  elevated: "#3a1818",
  surface: "#351515",
  // Buttons - white
  button: "#ffffff",
  button2: "#202428", // Use darker variant for cherry dark theme
  buttonHover: "#f5f5f5",
  buttonActive: "#e8e8e8",
  buttonText: "#1a1a1a",
  // Text - white (like dark mode)
  textPrimary: "#ffffff",
  textSecondary: "rgba(255, 255, 255, 0.7)",
  textMuted: "rgba(255, 255, 255, 0.5)",
  // Accents - cherry reds instead of inherited purple
  accent: "#f97373",
  accentHover: "#fb7185",
  accentActive: "#ef4444",
};

// Red theme variant - light mode version
export const redThemeLight: ColorGroup = {
  ...lightTheme, // Base off light theme
  // Canvas/page background - lighter red tone
  workspace: "#fef2f2", // Light red background
  // Component backgrounds - light red tones
  card: "#fee2e2",
  modal: "#fee2e2",
  sidebar: "#fee2e2",
  elevated: "#fecaca",
  surface: "#fef2f2",
  // Buttons - keep light theme buttons
  button: "#ffffff",
  button2: "#f1f5f9", // Lighter gray variant for light theme
  buttonHover: "#f1f5f9",
  buttonActive: "#e2e8f0",
  buttonText: "#1e293b",
  // Text - dark (like light mode)
  textPrimary: "#1e293b",
  textSecondary: "#64748b",
  textMuted: "#94a3b8",
  // Accents - cherry reds
  accent: "#ef4444",
  accentHover: "#f97373",
  accentActive: "#dc2626",
};

// Legacy: red theme (dark version, for backward compatibility)
export const redTheme = redThemeDark;

// Active theme type - workspace-specific theme selection
export type ActiveTheme = "light" | "dark" | "cherry";

/**
 * Get theme colors based on active theme.
 * 
 * @param activeTheme - The active theme ("light" | "dark" | "cherry")
 * @returns ColorGroup for the given theme
 */
export const getTheme = (activeTheme: ActiveTheme): ColorGroup => {
  if (activeTheme === "cherry") {
    return redThemeDark; // Cherry uses dark red palette
  }
  if (activeTheme === "dark") {
    return darkTheme;
  }
  // activeTheme === "light"
  return lightTheme;
};

/**
 * Helper to get theme with isDark boolean (for backward compatibility)
 */
export const getThemeWithMode = (variant: "default" | "red", isDark: boolean): ColorGroup => {
  if (variant === "red") {
    return isDark ? redThemeDark : redThemeLight;
  }
  return isDark ? darkTheme : lightTheme;
};

/**
 * Legacy function for backward compatibility during migration
 * @deprecated Use getTheme(variant, variantMode, themePref) or getThemeWithMode(variant, isDark) instead
 */
export const getThemeByName = (themeName: string): ColorGroup => {
  // Handle legacy themeName values during migration
  if (themeName === "system" || themeName === "light" || themeName === "dark") {
    const isDark = themeName === "dark" || (themeName === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    return getThemeWithMode("default", isDark);
  }
  if (themeName === "red" || themeName === "cherry") {
    return redThemeDark; // Legacy red was dark
  }
  return lightTheme;
};

/**
 * Get the current theme based on dark mode (backward compatibility)
 * @deprecated Use getTheme(variant, variantMode, themePref) or getThemeWithMode(variant, isDark) instead
 */
export const getThemeByDarkMode = (darkMode: boolean): ColorGroup => {
  return getThemeWithMode("default", darkMode);
};

/**
 * Create a custom theme by overriding specific groups
 * 
 * Example:
 * const customTheme = createCustomTheme(darkTheme, {
 *   backgrounds: { workspace: "#ff0000", card: "#cc0000" },
 *   buttons: { button: "#0000ff" }
 * });
 */
export const createCustomTheme = (
  baseTheme: ColorGroup,
  overrides: Partial<ColorGroup>
): ColorGroup => {
  return { ...baseTheme, ...overrides };
};

/**
 * Helper to get a specific color group
 * Useful for batch updates like "change all backgrounds to X"
 */
export const getColorGroup = (
  theme: ColorGroup,
  group: 'backgrounds' | 'buttons' | 'text' | 'borders' | 'accents'
): Partial<ColorGroup> => {
  switch (group) {
    case 'backgrounds':
      return {
        workspace: theme.workspace,
        card: theme.card,
        modal: theme.modal,
        sidebar: theme.sidebar,
        elevated: theme.elevated,
        surface: theme.surface,
      };
    case 'buttons':
      return {
        button: theme.button,
        buttonHover: theme.buttonHover,
        buttonActive: theme.buttonActive,
        buttonText: theme.buttonText,
      };
    case 'text':
      return {
        textPrimary: theme.textPrimary,
        textSecondary: theme.textSecondary,
        textMuted: theme.textMuted,
      };
    case 'borders':
      return {
        border: theme.border,
        borderSubtle: theme.borderSubtle,
      };
    case 'accents':
      return {
        accent: theme.accent,
        accentHover: theme.accentHover,
        accentActive: theme.accentActive,
      };
    default:
      return {};
  }
};

/**
 * Helper to set a specific color group
 * 
 * Example:
 * const newTheme = setColorGroup(darkTheme, 'backgrounds', {
 *   workspace: "#ff0000",
 *   card: "#cc0000"
 * });
 */
export const setColorGroup = (
  theme: ColorGroup,
  group: 'backgrounds' | 'buttons' | 'text' | 'borders' | 'accents',
  values: Partial<ColorGroup>
): ColorGroup => {
  const newTheme = { ...theme };
  
  switch (group) {
    case 'backgrounds':
      if (values.workspace) newTheme.workspace = values.workspace;
      if (values.card) newTheme.card = values.card;
      if (values.modal) newTheme.modal = values.modal;
      if (values.sidebar) newTheme.sidebar = values.sidebar;
      if (values.elevated) newTheme.elevated = values.elevated;
      if (values.surface) newTheme.surface = values.surface;
      break;
    case 'buttons':
      if (values.button) newTheme.button = values.button;
      if (values.buttonHover) newTheme.buttonHover = values.buttonHover;
      if (values.buttonActive) newTheme.buttonActive = values.buttonActive;
      if (values.buttonText) newTheme.buttonText = values.buttonText;
      break;
    case 'text':
      if (values.textPrimary) newTheme.textPrimary = values.textPrimary;
      if (values.textSecondary) newTheme.textSecondary = values.textSecondary;
      if (values.textMuted) newTheme.textMuted = values.textMuted;
      break;
    case 'borders':
      if (values.border) newTheme.border = values.border;
      if (values.borderSubtle) newTheme.borderSubtle = values.borderSubtle;
      break;
    case 'accents':
      if (values.accent) newTheme.accent = values.accent;
      if (values.accentHover) newTheme.accentHover = values.accentHover;
      if (values.accentActive) newTheme.accentActive = values.accentActive;
      break;
  }
  
  return newTheme;
};

// Custom theme type
export type CustomTheme = {
  id: string;
  name: string;
  colors: ColorGroup;
  createdAt?: number;
};

// Storage key for custom themes
const CUSTOM_THEMES_STORAGE_KEY = "customThemes";

// Get all custom themes from localStorage
export const getCustomThemes = (): CustomTheme[] => {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(CUSTOM_THEMES_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

// Save a custom theme to localStorage
export const saveCustomTheme = (theme: CustomTheme): void => {
  if (typeof window === "undefined") return;
  try {
    const themes = getCustomThemes();
    const existingIndex = themes.findIndex((t) => t.id === theme.id);
    if (existingIndex >= 0) {
      themes[existingIndex] = theme;
    } else {
      themes.push(theme);
    }
    localStorage.setItem(CUSTOM_THEMES_STORAGE_KEY, JSON.stringify(themes));
  } catch (error) {
    console.error("Failed to save custom theme:", error);
  }
};

// Delete a custom theme from localStorage
export const deleteCustomTheme = (themeId: string): void => {
  if (typeof window === "undefined") return;
  try {
    const themes = getCustomThemes();
    const filtered = themes.filter((t) => t.id !== themeId);
    localStorage.setItem(CUSTOM_THEMES_STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("Failed to delete custom theme:", error);
  }
};
