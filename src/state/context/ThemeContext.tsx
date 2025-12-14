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
  setThemeName: (themeName: ThemeName) => void;
}

const ThemeContext = createContext<ContextValue>({
  darkMode: false,
  toggleDarkMode: () => {}, // will be overwritten in provider
  theme: themes.light,
  themeName: "light",
  setThemeName: () => {},
});

export const ThemeContextProvider = ({
  children,
}: {
  children: ReactNode | ReactElement[];
}) => {
  const [themeName, setThemeNameState] = useState<ThemeName>("light");
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const themeRef = useRef<Theme>("light");
  const isInitialized = useRef(false);

  // Initialize theme on mount
  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    try {
      const savedThemeName = localStorage.getItem("themeName") as ThemeName;
      if (savedThemeName && themes[savedThemeName]) {
        setThemeNameState(savedThemeName);
        setDarkMode(savedThemeName === "dark");
      } else {
        // Fallback to old theme system
        const savedTheme = localStorage.getItem("theme");
        if (savedTheme) {
          const theme = savedTheme === "dark" ? "dark" : "light";
          setThemeNameState(theme);
          setDarkMode(theme === "dark");
        } else {
          const prefersDark = window.matchMedia(
            "(prefers-color-scheme: dark)"
          ).matches;
          const defaultTheme: ThemeName = prefersDark ? "dark" : "light";
          setThemeNameState(defaultTheme);
          setDarkMode(prefersDark);
        }
      }
    } catch (error) {
      console.error("Error reading theme preference:", error);
    }
  }, []);

  // Set theme name function
  const setThemeName = (newThemeName: ThemeName) => {
    setThemeNameState(newThemeName);
    setDarkMode(newThemeName === "dark");
    try {
      localStorage.setItem("themeName", newThemeName);
      // Also update old theme for backward compatibility
      localStorage.setItem("theme", newThemeName === "light" ? "light" : "dark");
    } catch (error) {
      console.error("Error saving theme:", error);
    }
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
      if (!localStorage.getItem("themeName")) {
        const defaultTheme: ThemeName = e.matches ? "dark" : "light";
        setThemeName(defaultTheme);
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
