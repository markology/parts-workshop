import {
  ImpressionTextType,
  ImpressionType,
} from "@/features/workspace/types/Impressions";
import { ReactElement } from "react";

const PartImpressionContainer = ({
  type,
  children,
}: {
  type: ImpressionType;
  children: ReactElement[];
}) => {
  return (
    <div
      key={`PartImpressionWrapper ${type}`}
      className="relative p-4 rounded-xl mb-4 flex-1 justify-items-center max-w-[140px] transition-all duration-300 theme-dark:text-slate-200/90"
      style={{
        backgroundColor: `var(--theme-impression-${type}-bg)`,
      }}
    >
      <strong
        className="impression-container-title text-sm flex-1 justify-items-center tracking-wide"
        style={{
          color: `var(--theme-impression-${type}-part-details-header)`,
        }}
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
