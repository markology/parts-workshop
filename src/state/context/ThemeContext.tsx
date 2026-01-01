"use client";
import {
  createContext,
  Dispatch,
  ReactElement,
  ReactNode,
  SetStateAction,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";
import { ColorGroup, ThemeName, getThemeByName, themes } from "@/features/workspace/constants/theme";

type Theme = "light" | "dark";

interface ContextValue {
  darkMode: boolean;
  toggleDarkMode: Dispatch<SetStateAction<boolean>>;
  theme: ColorGroup;
  themeName: ThemeName;
  /**
   * Set the current theme.
   * persistGlobal = true -> remember as a site-wide preference (overrides system)
   * persistGlobal = false/omitted -> session/map-only (system can still win on first load)
   */
  setThemeName: (themeName: ThemeName, persistGlobal?: boolean) => void;
}

const ThemeContext = createContext<ContextValue>({
  darkMode: false,
  toggleDarkMode: () => {}, // will be overwritten in provider
  theme: themes.light,
  themeName: "light",
  setThemeName: () => {},
});

// Helper function to get initial theme (runs synchronously on client)
function getInitialTheme(): { themeName: ThemeName; darkMode: boolean } {
  // Default fallback
  let themeName: ThemeName = "system";
  let darkMode = false;

  if (typeof window === "undefined") {
    return { themeName: "system", darkMode: false };
  }

  try {
    // Check if user has manually set a global theme preference
    const savedThemeName = localStorage.getItem("themeName") as ThemeName | null;

    // If user has saved a preference (including "system"), use it
    if (savedThemeName && (savedThemeName === "system" || themes[savedThemeName])) {
      themeName = savedThemeName;
      
      if (savedThemeName === "system") {
        // System mode: follow browser preference
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        darkMode = prefersDark;
        console.log(`[Theme] Initialized from system preference: ${prefersDark ? "dark" : "light"} (following browser)`);
      } else {
        // Specific theme selected
        darkMode = savedThemeName === "dark";
        console.log(`[Theme] Initialized from saved preference: ${themeName}`);
      }
      return { themeName, darkMode };
    }

    // No saved preference: default to system mode
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    themeName = "system";
    darkMode = prefersDark;
    console.log(`[Theme] Initialized with system mode (no saved preference): ${prefersDark ? "dark" : "light"}`);
  } catch (error) {
    console.error("Error reading theme preference:", error);
    // Fallback to system mode on error
    themeName = "system";
    darkMode = false;
  }

  return { themeName, darkMode };
}

export const ThemeContextProvider = ({
  children,
}: {
  children: ReactNode | ReactElement[];
}) => {
  // Initialize state synchronously with browser preference
  const initialTheme = getInitialTheme();
  const [themeName, setThemeNameState] = useState<ThemeName>(initialTheme.themeName);
  const [darkMode, setDarkMode] = useState<boolean>(initialTheme.darkMode);
  const themeRef = useRef<Theme>("light");
  const isInitialized = useRef(false);

  // Apply initial theme class immediately
  useEffect(() => {
    if (typeof window === "undefined") return;
    const root = document.documentElement;
    const initialThemeClass = initialTheme.darkMode && initialTheme.themeName !== "red" ? "dark" : "light";
    root.classList.remove("light", "dark");
    root.classList.add(initialThemeClass);
    themeRef.current = initialThemeClass;
  }, []); // Only run once on mount

  // Set theme name function
  const setThemeName = (newThemeName: ThemeName, persistGlobal: boolean = false) => {
    console.log(`[Theme] Setting theme to: ${newThemeName}, persistGlobal: ${persistGlobal}`);
    setThemeNameState(newThemeName);
    
    // Calculate darkMode based on theme
    if (newThemeName === "system") {
      // System mode: follow browser preference
      const prefersDark = typeof window !== "undefined" 
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
        : false;
      setDarkMode(prefersDark);
    } else {
      setDarkMode(newThemeName === "dark");
    }
    
    if (typeof window === "undefined") return;

    if (persistGlobal) {
      // User manually set a global theme preference - save it
      try {
        // Save to localStorage
        localStorage.setItem("themeName", newThemeName);
        
        // Also save to cookie for server-side rendering
        document.cookie = `themeName=${newThemeName}; path=/; max-age=31536000; SameSite=Lax`;
        
        console.log(`[Theme] Saved global theme: ${newThemeName} (localStorage + cookie)`);
      } catch (error) {
        console.error("Error saving theme:", error);
      }
    } else {
      console.log(`[Theme] Workspace theme applied (not saved globally): ${newThemeName}`);
    }
    // If persistGlobal is false, don't save - this is for workspace-specific themes
    // that should only apply within the workspace
  };

  // Handle theme changes
  useEffect(() => {
    const applyTheme = (theme: Theme) => {
      const root = document.documentElement;

      // Only update if the theme has changed
      if (themeRef.current !== theme || root.classList.value === "") {
        themeRef.current = theme;
        // Update classes
        root.classList.remove("light", "dark");
        root.classList.add(theme);

        // Save to localStorage
        try {
          localStorage.setItem("theme", theme);
        } catch (error) {
          console.error("Error saving theme:", error);
        }
      }
    };

    // Apply theme class based on darkMode (red theme uses light class)
    applyTheme(darkMode && themeName !== "red" ? "dark" : "light");
  }, [darkMode, themeName]);


  // Listen for system theme changes
  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = (e: MediaQueryListEvent) => {
      // Only react to system changes if theme is set to "system"
      const savedThemeName = localStorage.getItem("themeName") as ThemeName | null;
      if (savedThemeName === "system" || !savedThemeName) {
        // Theme is set to system mode (or no preference), so follow browser preference
        if (savedThemeName !== "system") {
          // No preference saved yet, set it to system mode
          setThemeNameState("system");
        }
        setDarkMode(e.matches);
        console.log(`[Theme] System preference changed: ${e.matches ? "dark" : "light"}`);
      }
    };

    try {
      mediaQuery.addEventListener("change", handleChange);
    } catch (error) {
      console.error("Error setting up theme listener:", error);
    }

    return () => {
      try {
        mediaQuery.removeEventListener("change", handleChange);
      } catch (error) {
        console.error("Error cleaning up theme listener:", error);
      }
    };
  }, []);

  const theme = getThemeByName(themeName);
  const value = { 
    darkMode, 
    toggleDarkMode: setDarkMode, 
    theme,
    themeName,
    setThemeName,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export default ThemeContext;

export const useThemeContext = () => {
  return useContext(ThemeContext);
};
