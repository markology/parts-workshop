/**
 * Hook to access the current theme with semantic color groups
 * 
 * Usage:
 * const theme = useTheme();
 * <div style={{ background: theme.card }}>...</div>
 * <button style={{ background: theme.button, color: theme.buttonText }}>Click</button>
 */

import { useThemeContext } from "@/state/context/ThemeContext";
import { ColorGroup } from "../constants/theme";

export const useTheme = (): ColorGroup => {
  const { theme } = useThemeContext();
  return theme;
};

/**
 * Hook to get a specific color group
 * 
 * Usage:
 * const backgrounds = useColorGroup('backgrounds');
 * // Returns: { workspace: "#3D434B", card: "#212529", ... }
 */
export const useColorGroup = (
  group: 'backgrounds' | 'buttons' | 'text' | 'borders' | 'accents'
): Partial<ColorGroup> => {
  const theme = useTheme();
  
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

