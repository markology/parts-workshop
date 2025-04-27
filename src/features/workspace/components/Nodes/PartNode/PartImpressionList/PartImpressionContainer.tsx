import {
  NodeBackgroundColors,
  NodeTextColors,
} from "@/features/workspace/constants/Nodes";
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
      className={`relative p-4 rounded-lg mb-4 flex-1 justify-items-center max-w-[140px]`}
      style={{
        backgroundColor: NodeBackgroundColors[type],
      }}
    >
      <strong
        className="impression-container-title  text-sm flex-1 justify-items-center"
        style={{ color: NodeTextColors[type] }}
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
