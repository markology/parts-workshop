import { NodeBackgroundColors, NodeTextColors } from "@/constants/Nodes";
import { ImpressionType } from "@/types/Impressions";
import { ReactElement } from "react";

let index = 0;

const PartImpressionContainer = ({
  type,
  children,
}: {
  type: ImpressionType;
  children: ReactElement[];
}) => {
  return (
    <div
      key={`PartImpressionWrapper ${index++}`}
      style={{
        backgroundColor: NodeBackgroundColors[type],
        position: "relative",
        padding: "16px",
        borderRadius: "8px",
        marginBottom: "16px",
      }}
      className="mb-3 part-impression-container flex-1 justify-items-center max-w-[140px]"
    >
      <strong
        className="text-sm  part-impression-container flex-1 justify-items-center"
        style={{ color: NodeTextColors[type] }}
      >
        {`${type}:`}
      </strong>
      <ul className="list-none w-full pt-2">{children}</ul>
    </div>
  );
};

export default PartImpressionContainer;
