# Theme System Guide

This theme system allows you to easily change entire groups of colors at once. All colors are organized into semantic groups that you can swap out easily.

## Color Groups

### 1. **Backgrounds**
- `workspace` - Main workspace/canvas background
- `card` - Card/node backgrounds  
- `modal` - Modal/overlay backgrounds
- `sidebar` - Sidebar backgrounds
- `elevated` - Elevated surfaces (dropdowns, tooltips)
- `surface` - Surface backgrounds (inputs, etc.)

### 2. **Buttons**
- `button` - Default button background
- `buttonHover` - Button hover state
- `buttonActive` - Button active/pressed state
- `buttonText` - Button text color

### 3. **Text**
- `textPrimary` - Primary text
- `textSecondary` - Secondary text
- `textMuted` - Muted/disabled text

### 4. **Borders**
- `border` - Default borders
- `borderSubtle` - Subtle borders (dividers)

### 5. **Accents**
- `accent` - Primary accent color
- `accentHover` - Accent hover state
- `accentActive` - Accent active state

## How to Change Color Groups

### Example 1: Change All Backgrounds to Red

```typescript
import { darkTheme, setColorGroup } from "@/features/workspace/constants/theme";

// Create a new theme with red backgrounds
const redTheme = setColorGroup(darkTheme, 'backgrounds', {
  workspace: "#4a1f1f",
  card: "#2d1212",
  modal: "#2d1212",
  sidebar: "#2d1212",
  elevated: "#3a1818",
  surface: "#351515",
});
```

### Example 2: Change All Buttons to Blue

```typescript
import { darkTheme, setColorGroup } from "@/features/workspace/constants/theme";

const blueButtonTheme = setColorGroup(darkTheme, 'buttons', {
  button: "#1e3a5f",
  buttonHover: "#2a4a7f",
  buttonActive: "#1e3a5f",
  buttonText: "#ffffff",
});
```

### Example 3: Create a Custom Theme from Scratch

```typescript
import { darkTheme, createCustomTheme } from "@/features/workspace/constants/theme";

const customTheme = createCustomTheme(darkTheme, {
  // Override backgrounds
  workspace: "#1a1a2e",
  card: "#16213e",
  modal: "#16213e",
  sidebar: "#16213e",
  
  // Override buttons
  button: "#0f3460",
  buttonHover: "#1a4a7a",
  buttonText: "#e94560",
  
  // Override accents
  accent: "#e94560",
  accentHover: "#ff5a7a",
});
```

## Using the Theme in Components

### Basic Usage

```typescript
import { useTheme } from "@/features/workspace/hooks/useTheme";

function MyComponent() {
  const theme = useTheme();
  
  return (
    <div style={{ background: theme.card, color: theme.textPrimary }}>
      <button style={{ 
        background: theme.button, 
        color: theme.buttonText 
      }}>
        Click me
      </button>
    </div>
  );
}
```

### Using Specific Color Groups

```typescript
import { useColorGroup } from "@/features/workspace/hooks/useTheme";

function MyComponent() {
  const backgrounds = useColorGroup('backgrounds');
  const buttons = useColorGroup('buttons');
  
  return (
    <div style={{ background: backgrounds.card }}>
      <button style={{ background: buttons.button }}>
        Click
      </button>
    </div>
  );
}
```

## Quick Theme Swaps

To quickly test different color schemes, you can modify the theme files directly:

1. **Change all backgrounds**: Edit `darkTheme.workspace`, `darkTheme.card`, etc.
2. **Change all buttons**: Edit `darkTheme.button`, `darkTheme.buttonHover`, etc.
3. **Change all text**: Edit `darkTheme.textPrimary`, `darkTheme.textSecondary`, etc.

Then tell me: "Change all backgrounds to [color]" and I'll update the theme file for you!

## Example Requests

- "Change all backgrounds to red" → Updates workspace, card, modal, sidebar, elevated, surface
- "Change all buttons to blue" → Updates button, buttonHover, buttonActive, buttonText
- "Change all text to white" → Updates textPrimary, textSecondary, textMuted
- "Make accents purple" → Updates accent, accentHover, accentActive

