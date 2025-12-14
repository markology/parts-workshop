/**
 * Comprehensive theme system with semantic color groupings
 * 
 * This allows easy theme customization by swapping entire color groups.
 * For example, change all "backgrounds" to red, or all "buttons" to blue.
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
  button: "#2a2e32",
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
  accent: "#6366f1",
  accentHover: "#818cf8",
  accentActive: "#4f46e5",
  
  // Status
  success: "#10b981",
  warning: "#f59e0b",
  error: "#ef4444",
  info: "#3b82f6",
};

// Red theme - red component backgrounds with white buttons and white text
export const redTheme: ColorGroup = {
  ...lightTheme,
  // Canvas/page background - lighter red tone
  workspace: "#5a2f2f",
  // Component backgrounds - red tones (nodes, sidebar, modals, etc.)
  // Part node backgrounds should match sidebar
  card: "#2d1212",
  modal: "#2d1212",
  sidebar: "#2d1212",
  elevated: "#3a1818",
  surface: "#351515",
  // Buttons - white
  button: "#ffffff",
  buttonHover: "#f5f5f5",
  buttonActive: "#e8e8e8",
  buttonText: "#1a1a1a",
  // Text - white (like dark mode)
  textPrimary: "#ffffff",
  textSecondary: "rgba(255, 255, 255, 0.7)",
  textMuted: "rgba(255, 255, 255, 0.5)",
};

// Theme registry
export type ThemeName = "light" | "dark" | "red";

export const themes: Record<ThemeName, ColorGroup> = {
  light: lightTheme,
  dark: darkTheme,
  red: redTheme,
};

/**
 * Get a theme by name
 */
export const getThemeByName = (themeName: ThemeName): ColorGroup => {
  return themes[themeName] || lightTheme;
};

/**
 * Get the current theme based on dark mode (for backward compatibility)
 */
export const getTheme = (darkMode: boolean): ColorGroup => {
  return darkMode ? darkTheme : lightTheme;
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

