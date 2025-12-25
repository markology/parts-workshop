import {
  ImpressionTextType,
  ImpressionType,
} from "@/features/workspace/types/Impressions";
import { useThemeContext } from "@/state/context/ThemeContext";
import { ReactElement } from "react";
import { getImpressionBaseColors, getImpressionPartDetailsHeaderColor } from "@/features/workspace/constants/ImpressionColors";

const PartImpressionContainer = ({
  type,
  children,
}: {
  type: ImpressionType;
  children: ReactElement[];
}) => {
  const { darkMode } = useThemeContext();
  const baseColors = getImpressionBaseColors(darkMode)[type];

  const containerStyle = {
    backgroundColor: baseColors.background,
  };

  const labelColor = getImpressionPartDetailsHeaderColor(type, darkMode);

  return (
    <div
      key={`PartImpressionWrapper ${type}`}
      className={`relative p-4 rounded-xl mb-4 flex-1 justify-items-center max-w-[140px] transition-all duration-300 ${
        darkMode ? "text-slate-200/90" : ""
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
