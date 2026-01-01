"use client";
import {
  createContext,
  ReactElement,
  ReactNode,
  useContext,
  useState,
  useEffect,
  useRef,
  useMemo,
} from "react";
import { ColorGroup, ActiveTheme, getTheme } from "@/features/workspace/constants/theme";

/**
 * Theme preference: controls dark/light/system mode
 * This affects the Tailwind `dark:` class on <html>
 */
export type ThemePref = "system" | "light" | "dark";

interface ContextValue {
  // Theme preference (mode): system, light, or dark - controls <html> light/dark class
  themePref: ThemePref;
  setThemePref: (pref: ThemePref, persistGlobal?: boolean) => void;
  
  // Active theme: light, dark, or cherry - controls <html> theme-{activeTheme} class
  // Workspace-specific, defaults to light or dark based on current mode
  activeTheme: ActiveTheme;
  setActiveTheme: (theme: ActiveTheme, persistGlobal?: boolean) => void;
  
  // Derived: whether dark mode is currently active (from themePref)
  isDark: boolean;
  
  // Current theme colors (computed from activeTheme)
  theme: ColorGroup;
}

const ThemeContext = createContext<ContextValue>({
  themePref: "system",
  setThemePref: () => {},
  activeTheme: "light",
  setActiveTheme: () => {},
  isDark: false,
  theme: getTheme("light"),
});

/**
 * Get initial theme preferences from storage
 */
function getInitialTheme(): { themePref: ThemePref; activeTheme: ActiveTheme } {
  if (typeof window === "undefined") {
    return { themePref: "system", activeTheme: "light" };
  }

  try {
    // Read themePref (mode)
    const themePref = (localStorage.getItem("themePref") || "system") as ThemePref;
    
    // Read activeTheme (workspace theme)
    const savedActiveTheme = localStorage.getItem("activeTheme") as ActiveTheme | null;
    
    // Validate themePref
    if (!["system", "light", "dark"].includes(themePref)) {
      return { themePref: "system", activeTheme: "light" };
    }
    
    // Validate activeTheme
    if (savedActiveTheme && ["light", "dark", "cherry"].includes(savedActiveTheme)) {
      return { themePref, activeTheme: savedActiveTheme };
    }
    
    // No saved activeTheme - default based on current mode
    const isDark = themePref === "dark" || 
      (themePref === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    return { themePref, activeTheme: isDark ? "dark" : "light" };
  } catch (error) {
    console.error("[Theme] Error reading theme preferences:", error);
    return { themePref: "system", activeTheme: "light" };
  }
}

/**
 * Derive isDark from themePref (mode preference)
 */
function getIsDark(themePref: ThemePref): boolean {
  if (themePref === "dark") return true;
  if (themePref === "light") return false;
  // themePref === "system"
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export const ThemeContextProvider = ({
  children,
}: {
  children: ReactNode | ReactElement[];
}) => {
  const initial = getInitialTheme();
  const [themePref, setThemePrefState] = useState<ThemePref>(initial.themePref);
  const [activeTheme, setActiveThemeState] = useState<ActiveTheme>(initial.activeTheme);
  
  // Track current mode class to avoid unnecessary DOM updates
  const modeClassRef = useRef<"light" | "dark">("light");
  const themeClassRef = useRef<string>("");
  const isInitialMount = useRef(true);

  // Derive isDark from themePref (mode)
  const isDark = useMemo(() => getIsDark(themePref), [themePref]);

  // Compute theme colors from activeTheme
  const theme = useMemo(() => getTheme(activeTheme), [activeTheme]);

  // Apply mode class (light/dark) to <html> element
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const root = document.documentElement;
    const newModeClass = isDark ? "dark" : "light";
    
    // Only update if mode actually changed
    if (modeClassRef.current !== newModeClass || isInitialMount.current) {
      root.classList.remove("light", "dark");
      root.classList.add(newModeClass);
      modeClassRef.current = newModeClass;
      isInitialMount.current = false;
    }
  }, [isDark]);

  // Apply theme class (theme-light/theme-dark/theme-cherry) to <html> element and set CSS variables
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const root = document.documentElement;
    const newThemeClass = `theme-${activeTheme}`;
    const currentTheme = getTheme(activeTheme);
    
    // Remove all theme-* classes
    root.classList.remove("theme-light", "theme-dark", "theme-cherry");
    
    // Add current theme class
    if (themeClassRef.current !== newThemeClass || isInitialMount.current) {
      root.classList.add(newThemeClass);
      themeClassRef.current = newThemeClass;
      
      // Set CSS custom properties for theme colors (this is necessary to generate theme css properties - mark)
      root.style.setProperty("--theme-workspace", currentTheme.workspace);
      root.style.setProperty("--theme-card", currentTheme.card);
      root.style.setProperty("--theme-modal", currentTheme.modal);
      root.style.setProperty("--theme-sidebar", currentTheme.sidebar);
      root.style.setProperty("--theme-elevated", currentTheme.elevated);
      root.style.setProperty("--theme-surface", currentTheme.surface);
      root.style.setProperty("--theme-button", currentTheme.button);
      root.style.setProperty("--theme-button2", currentTheme.button2);
      root.style.setProperty("--theme-button-hover", currentTheme.buttonHover);
      root.style.setProperty("--theme-button-active", currentTheme.buttonActive);
      root.style.setProperty("--theme-button-text", currentTheme.buttonText);
      root.style.setProperty("--theme-text-primary", currentTheme.textPrimary);
      root.style.setProperty("--theme-text-secondary", currentTheme.textSecondary);
      root.style.setProperty("--theme-text-muted", currentTheme.textMuted);
      root.style.setProperty("--theme-border", currentTheme.border);
      root.style.setProperty("--theme-border-subtle", currentTheme.borderSubtle);
      root.style.setProperty("--theme-accent", currentTheme.accent);
      root.style.setProperty("--theme-accent-hover", currentTheme.accentHover);
      root.style.setProperty("--theme-accent-active", currentTheme.accentActive);
      root.style.setProperty("--theme-journal-icon-button-bg", currentTheme.journalIconButtonBg);
      root.style.setProperty("--theme-journal-icon-button-color", currentTheme.journalIconButtonColor);
      root.style.setProperty("--theme-journal-icon-button-hover-color", currentTheme.journalIconButtonHoverColor);
      
    }
  }, [activeTheme]);

  // Set theme preference
  const setThemePref = (pref: ThemePref, persistGlobal: boolean = true) => {
    setThemePrefState(pref);
    
    if (typeof window === "undefined") return;

    if (persistGlobal) {
      try {
        localStorage.setItem("themePref", pref);
        // Also save to cookie for SSR
        document.cookie = `themePref=${pref}; path=/; max-age=31536000; SameSite=Lax`;
      } catch (error) {
        console.error("[Theme] Error saving themePref:", error);
      }
    }
  };

  // Set active theme (workspace-specific)
  const setActiveTheme = (theme: ActiveTheme, persistGlobal: boolean = false) => {
    setActiveThemeState(theme);
    
    if (typeof window === "undefined") return;

    if (persistGlobal) {
      try {
        localStorage.setItem("activeTheme", theme);
        document.cookie = `activeTheme=${theme}; path=/; max-age=31536000; SameSite=Lax`;
      } catch (error) {
        console.error("[Theme] Error saving activeTheme:", error);
      }
    }
  };

  // Listen for system theme changes (only when themePref === "system")
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (themePref !== "system") return; // Only listen when in system mode

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    
    const handleChange = (e: MediaQueryListEvent) => {
      // isDark is derived from themePref, so we need to trigger a re-render
      // by updating themePref state (even though it's still "system")
      // Actually, since isDark is computed from themePref, we just need to
      // ensure the effect that applies the class runs. The modeClassRef check
      // will handle it, but we might need to force an update.
      // Actually, the effect depends on isDark which is computed from themePref,
      // so when system preference changes, we need to recalculate isDark.
      // But isDark is a useMemo that depends on themePref. So we need to
      // trigger a re-computation. We can do this by setting themePref again
      // (even though it's the same value) OR we can directly update the class.
      
      // Simple approach: directly update the class and sync state
      const root = document.documentElement;
      const newModeClass = e.matches ? "dark" : "light";
      if (modeClassRef.current !== newModeClass) {
        root.classList.remove("light", "dark");
        root.classList.add(newModeClass);
        modeClassRef.current = newModeClass;
      }
    };

    try {
      mediaQuery.addEventListener("change", handleChange);
      return () => {
        try {
          mediaQuery.removeEventListener("change", handleChange);
        } catch (error) {
          console.error("[Theme] Error cleaning up theme listener:", error);
        }
      };
    } catch (error) {
      console.error("[Theme] Error setting up theme listener:", error);
    }
  }, [themePref]);


  const value: ContextValue = {
    themePref,
    setThemePref,
    activeTheme,
    setActiveTheme,
    isDark,
    theme,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export default ThemeContext;

export const useThemeContext = () => {
  return useContext(ThemeContext);
};
