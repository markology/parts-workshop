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

type Theme = "light" | "dark";

interface ContextValue {
  darkMode: boolean;
  toggleDarkMode: Dispatch<SetStateAction<boolean>>;
}

const ThemeContext = createContext<ContextValue>({
  darkMode: false,
  toggleDarkMode: () => {}, // will be overwritten in provider
});

export const ThemeContextProvider = ({
  children,
}: {
  children: ReactNode | ReactElement[];
}) => {
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const themeRef = useRef<Theme>("light");
  const isInitialized = useRef(false);

  // Initialize theme on mount
  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    try {
      const savedTheme = localStorage.getItem("theme");
      if (savedTheme) {
        setDarkMode(savedTheme === "dark");
      } else {
        const prefersDark = window.matchMedia(
          "(prefers-color-scheme: dark)"
        ).matches;
        setDarkMode(prefersDark);
      }
    } catch (error) {
      console.error("Error reading theme preference:", error);
    }
  }, []);

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

    // Apply theme
    applyTheme(darkMode ? "dark" : "light");
  }, [darkMode]);

  // Listen for system theme changes
  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem("theme")) {
        setDarkMode(e.matches);
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

  const value = { darkMode, toggleDarkMode: setDarkMode };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export default ThemeContext;

export const useThemeContext = () => {
  return useContext(ThemeContext);
};
