import React, { useState } from "react";
import { Moon, MoonStar, Sun, SunMoon } from "lucide-react";
import { useThemeContext } from "@/context/ThemeContext";
import ToolTipWrapper from "@/components/ToolTipWrapper";

const ThemeToggle: React.FC = () => {
  const { darkMode, toggleDarkMode } = useThemeContext();
  const [isHovering, setIsHovering] = useState(false);

  return (
    <ToolTipWrapper message="Toggle Darkmode">
      <button
        className=" w-15 h-15 rounded-lg flex items-center justify-center cursor-pointer z-50 bg-black/25"
        id="theme-toggle"
        onClick={() => toggleDarkMode((prev) => !prev)}
        onMouseOver={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {darkMode ? (
          isHovering ? (
            <MoonStar color="white" strokeWidth={2} size={30} />
          ) : (
            <Moon color="white" strokeWidth={2} size={30} />
          )
        ) : isHovering ? (
          <SunMoon color="white" strokeWidth={2} size={30} />
        ) : (
          <Sun color="white" strokeWidth={2} size={30} />
        )}
      </button>
    </ToolTipWrapper>
  );
};

export default ThemeToggle;
