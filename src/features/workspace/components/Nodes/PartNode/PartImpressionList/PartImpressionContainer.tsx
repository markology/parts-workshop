import {
  NodeBackgroundColors,
  NodeTextColors,
} from "@/features/workspace/constants/Nodes";
import { workspaceDarkPalette } from "@/features/workspace/constants/darkPalette";
import {
  ImpressionTextType,
  ImpressionType,
} from "@/features/workspace/types/Impressions";
import { useThemeContext } from "@/state/context/ThemeContext";
import { ReactElement } from "react";

const PartImpressionContainer = ({
  type,
  children,
}: {
  type: ImpressionType;
  children: ReactElement[];
}) => {
  const { darkMode } = useThemeContext();
  const palette = workspaceDarkPalette;

  const containerStyle = darkMode
    ? {
        background: `linear-gradient(145deg, ${palette.surface}, ${palette.base})`,
        borderColor: "rgba(255,255,255,0.08)",
        boxShadow: "0 18px 36px rgba(0,0,0,0.45)",
      }
    : {
        backgroundColor: NodeBackgroundColors[type],
      };

  const labelColor = darkMode ? "#f3f4f6" : NodeTextColors[type];

  return (
    <div
      key={`PartImpressionWrapper ${type}`}
      className={`relative p-4 rounded-xl mb-4 flex-1 justify-items-center max-w-[140px] transition-all duration-300 ${
        darkMode ? "border text-slate-200/90" : ""
      }`}
      style={containerStyle}
    >
      <strong
        className="impression-container-title text-sm flex-1 justify-items-center tracking-wide"
        style={{ color: labelColor }}
      >
        {`${ImpressionTextType[type]}:`}
      </strong>
      <ul className="list-none w-full pt-2 flex flex-col gap-[6px]">
        {children}
      </ul>
    </div>
  );
};

export default PartImpressionContainer;
