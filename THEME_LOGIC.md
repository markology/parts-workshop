# Theme Logic Flow

## State Management

The theme system uses React Context (`ThemeContext`) to manage theme state globally:

- **`themeName`**: Current theme name ("light", "dark", or "red")
- **`darkMode`**: Boolean indicating if dark mode is active
- **`theme`**: ColorGroup object with all theme colors

## Theme Precedence (Highest to Lowest)

1. **Workspace Theme** (when inside a workspace)
   - Loaded from map metadata (`metadata.themeName`)
   - Applied with `setThemeName(themeName, false)` - NOT saved globally
   - **Always overrides everything when inside a workspace**

2. **User's Manual Global Preference**
   - Set via workspaces page toggle or account dropdown
   - Applied with `setThemeName(themeName, true)` - saved to localStorage
   - Saved as `localStorage.setItem("themeName", themeName)` and `localStorage.setItem("themeGlobal", "1")`
   - **Forever overrides browser preference once set**

3. **Browser/Device Preference** (default)
   - Detected via `window.matchMedia("(prefers-color-scheme: dark)")`
   - Used only when no manual preference is set
   - **Only applies on first load or when no global preference exists**

## Initialization Flow

1. On app load, `getInitialTheme()` runs synchronously:
   - Checks `localStorage.getItem("themeGlobal")` 
   - If "1", uses `localStorage.getItem("themeName")` (user's manual choice)
   - Otherwise, uses browser preference
   - Applies theme class to `<html>` element immediately (via blocking script in layout)

2. After React hydrates:
   - ThemeContext initializes with the theme from step 1
   - System theme listener watches for browser changes (only if no global preference)

3. When entering a workspace:
   - `CanvasClient` loads map data
   - If map has `metadata.themeName`, it calls `setThemeName(mapThemeName, false)`
   - This overrides the global theme for the duration of the workspace session
   - When leaving workspace, global theme is restored

## Key Functions

### `setThemeName(themeName, persistGlobal)`

- **`persistGlobal: true`**: 
  - Saves theme to localStorage
  - Sets `themeGlobal: "1"` flag
  - Forever overrides browser preference
  - Used for site-wide theme selection

- **`persistGlobal: false`** (default):
  - Does NOT save to localStorage
  - Only applies for current session
  - Used for workspace-specific themes
  - Workspace themes override global themes

## Debugging

A `ThemeDebug` component is available on all pages (bottom-right corner):
- Shows current theme state
- Shows browser preference
- Shows saved preferences
- Allows quick theme toggling
- Allows resetting preferences

Check browser console for `[Theme]` and `[Workspace]` logs to track theme changes.

