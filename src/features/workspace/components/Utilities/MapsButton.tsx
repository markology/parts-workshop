import React, { useState } from "react";
import { Map, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import ToolTipWrapper from "@/components/ToolTipWrapper";
import { useThemeContext } from "@/state/context/ThemeContext";

const MapsButton: React.FC = () => {
  const [isHovering, setIsHovering] = useState(false);
  const router = useRouter();
  const { darkMode } = useThemeContext();

  return (
    <ToolTipWrapper message="Back to Workspaces">
      <button
        className=" w-15 h-15 rounded-lg flex items-center justify-center cursor-pointer z-50"
        id="maps-button"
        style={{
          backgroundColor: darkMode ? 'rgba(0, 0, 0, 0.25)' : 'white',
        }}
        onClick={() => router.push("/dashboard")}
        onMouseEnter={(e) => {
          setIsHovering(true);
          if (!darkMode) {
            e.currentTarget.style.backgroundImage = 'linear-gradient(to right, rgb(240, 249, 255), rgb(238, 242, 255), rgb(255, 241, 242))';
          }
        }}
        onMouseLeave={(e) => {
          setIsHovering(false);
          if (!darkMode) {
            e.currentTarget.style.backgroundImage = 'none';
            e.currentTarget.style.backgroundColor = 'white';
          }
        }}
      >
        {isHovering ? (
          <MapPin color={darkMode ? "white" : "#475569"} strokeWidth={2} size={30} />
        ) : (
          <Map color={darkMode ? "white" : "#475569"} strokeWidth={2} size={30} />
        )}
      </button>
    </ToolTipWrapper>
  );
};

export default MapsButton;
