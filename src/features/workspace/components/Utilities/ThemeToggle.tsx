import React from "react";
import { Moon, Sun } from "lucide-react";
import { useThemeContext } from "@/context/ThemeContext";

const ThemeToggle: React.FC = () => {
  const { darkMode, toggleDarkMode } = useThemeContext();
  return (
    <button
      className="fixed top-65 right-5 w-15 h-15 rounded-lg flex items-center justify-center cursor-pointer z-50 bg-black/25"
      id="theme-toggle"
      onClick={() => toggleDarkMode((prev) => !prev)}
    >
      {darkMode ? (
        <Moon color="white" strokeWidth={2} size={30} />
      ) : (
        <Sun color="white" strokeWidth={2} size={30} />
      )}
    </button>
  );
};

export default ThemeToggle;
