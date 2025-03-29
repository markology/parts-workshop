import { Handle, Position } from "@xyflow/react";
import { PartNodeData } from "./types";

import { NodeColors, NodeBackgroundColors, NodeTextColors } from "./constants";

const PartNode = ({ data }: { data: PartNodeData }) => {
  console.log({ data });
  return (
    <div className="bg-[#a3c1e591] shadow-md rounded p-10 w-80 border border-color-[white] flex flex-col w-[1000px] h-[500px] rounded-3xl">
      {/* Title */}
      <h3 className="part-name font-semibold mb-2 text-gray-800 text-4xl pb-4">
        {data.label}
      </h3>

      {/* Emotions */}
      <div className={"flex flex-row gap-4 flex-grow space-evenly"}>
        <div
          style={{ backgroundColor: NodeBackgroundColors.emotion }}
          className="mb-3 part-impression-container flex-1 justify-items-center"
        >
          <strong
            className={`text-sm`}
            style={{ color: NodeTextColors.emotion }}
          >
            Emotions:
          </strong>
          <ul className="list-disc pl-5 text-gray-700">
            {data.emotions.map((emotion, index) => (
              <li key={index}>{emotion}</li>
            ))}
          </ul>
        </div>

        {/* Thoughts */}
        <div
          style={{ backgroundColor: NodeBackgroundColors.thought }}
          className="mb-3 part-impression-container flex-1 justify-items-center"
        >
          <strong className="text-sm" style={{ color: NodeTextColors.thought }}>
            Thoughts:
          </strong>
          <ul className="list-disc pl-5">
            {data.thoughts.map((thought, index) => (
              <li key={index}>{thought}</li>
            ))}
          </ul>
        </div>

        {/* Sensations */}
        <div
          style={{ backgroundColor: NodeBackgroundColors.sensation }}
          className="mb-3 part-impression-container flex-1 justify-items-center"
        >
          <strong
            className="text-sm"
            style={{ color: NodeTextColors.sensation }}
          >
            Sensations:
          </strong>
          <ul className="list-disc pl-5 text-gray-700">
            {data.sensations.map((sensation, index) => (
              <li key={index}>{sensation}</li>
            ))}
          </ul>
        </div>

        {/* Behaviors */}
        <div
          style={{ backgroundColor: NodeBackgroundColors.behavior }}
          className="mb-3 part-impression-container flex-1 justify-items-center"
        >
          <strong
            className="text-sm"
            style={{ color: NodeTextColors.behavior }}
          >
            Behaviors:
          </strong>
          <ul className="list-disc pl-5 text-gray-700">
            {data.behaviors.map((behavior, index) => (
              <li key={index}>{behavior}</li>
            ))}
          </ul>
        </div>

        {/* Self */}
        <div
          style={{ backgroundColor: NodeBackgroundColors.self }}
          className="mb-3 part-impression-container flex-1 justify-items-center "
        >
          <strong
            className="text-sm  part-impression-container flex-1 justify-items-center"
            style={{ color: NodeTextColors.self }}
          >
            Self:
          </strong>
          <p className="text-gray-700">{data.self || "Not set"}</p>
        </div>

        {/* Others */}
        <div
          style={{ backgroundColor: NodeBackgroundColors.other }}
          className="mb-3 part-impression-container flex-1 justify-items-center"
        >
          <strong className="text-sm" style={{ color: NodeTextColors.other }}>
            Others:
          </strong>
          <ul className="list-disc pl-5 text-gray-700">
            {data.others.map((other, index) => (
              <li key={index}>{other}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Handles for edges */}
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};

export default PartNode;
