"use client";
import {
  createContext,
  Dispatch,
  ReactElement,
  ReactNode,
  SetStateAction,
  useContext,
  useState,
} from "react";

interface ContextValue {
  darkMode: boolean;
  toggleDarkMode: Dispatch<SetStateAction<boolean>>;
}

const ThemeContext = createContext<ContextValue>({
  darkMode: true,
  toggleDarkMode: () => {}, // will be overwritten in provider
});

export const ThemeContextProvider = ({
  children,
}: {
  children: ReactNode | ReactElement[];
}) => {
  const [darkMode, toggleDarkMode] = useState<boolean>(true);
  const value = { darkMode, toggleDarkMode };

  return (
    <ThemeContext.Provider value={value}>
      <div
        className={darkMode ? "dark" : "light"}
        style={
          {
            "--background": darkMode ? "#2a3545" : "#f8f6f0",
            "--aside-background": darkMode ? "#242c36" : "white",
          } as React.CSSProperties
        }
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
};

export default ThemeContext;

export const useThemeContext = () => {
  return useContext(ThemeContext);
};
