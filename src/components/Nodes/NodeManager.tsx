import PartNode from "./PartNode";
import {
  BaseNodeData,
  BaseNodeParams,
  ConflictNodeData,
  ConflictNodeParams,
  NodeType,
  PartNodeData,
} from "@/types/Nodes";

import { NodeColors } from "@/constants/Nodes";

// Other: Circle, Pink (#EFA9C8) - Already Correct
const OtherNode = ({ data }: BaseNodeParams) => (
  <svg width="100" height="100">
    <circle
      cx="50"
      cy="50"
      r="45"
      fill={NodeColors.other}
      stroke="black"
      strokeWidth="2"
    />
    <text x="50" y="55" textAnchor="middle" fill="black" fontSize="14">
      {data.label}
    </text>
  </svg>
);

// Body Sensation: Ellipse, Warm Orange (#F9B17A) - Already Correct
const SensationNode = ({ data }: BaseNodeParams) => (
  <svg width="100" height="100">
    <ellipse
      cx="50"
      cy="50"
      rx="45"
      ry="35"
      fill={NodeColors.sensation}
      stroke="black"
      strokeWidth="2"
    />
    <text x="50" y="55" textAnchor="middle" fill="black" fontSize="14">
      {data.label}
    </text>
  </svg>
);

// Emotion: Heart, Soft Red (#F28C82)
const EmotionNode = ({ data }: BaseNodeParams) => (
  <svg width="100" height="100" viewBox="0 0 100 100">
    {/* Improved symmetrical heart shape with slightly wider top curves */}
    <path
      d="
      M50 30
      C60 10, 85 10, 85 40
      C85 60, 50 80, 50 80
      C50 80, 15 60, 15 40
      C15 10, 40 10, 50 30
      Z
    "
      fill={NodeColors.emotion}
      stroke="black"
      strokeWidth="2"
    />

    {/* Centered label */}
    <text x="50" y="55" textAnchor="middle" fill="black" fontSize="12">
      {data.label}
    </text>
  </svg>
);

// Thought: Cloud, Gentle Blue (#7AB3E0)
const ThoughtNode = ({ data }: BaseNodeParams) => (
  <svg width="200" height="200" viewBox="0 0 300 200">
    {/* Main bubble shape */}
    <path
      d="
      M90,96
      C50,60 80,30 120,40
      C140,20 180,20 200,40
      C240,30 260,60 240,90
      C270,110 240,140 200,130
      C190,150 140,150 130,130
      C90,140 70,110 90,95
      C60,90 65,70 90
    "
      fill={NodeColors.thought}
      stroke="black"
      strokeWidth="2"
    />

    {/* Thought trail circles */}
    <circle
      cx="100"
      cy="150"
      r="8"
      fill={NodeColors.thought}
      stroke="black"
      strokeWidth="2"
    />
    <circle
      cx="75"
      cy="160"
      r="5"
      fill={NodeColors.thought}
      stroke="black"
      strokeWidth="2"
    />

    {/* Centered text */}
    <text x="150" y="100" textAnchor="middle" fill="black" fontSize="14">
      {data.label}
    </text>
  </svg>
);

// Self: Triangle, Teal (#4ECDC4) - Already Correct
const SelfNode = ({ data }: BaseNodeParams) => (
  <svg width="100" height="100">
    <polygon
      points="50,10 90,90 10,90"
      fill={NodeColors.self}
      stroke="black"
      strokeWidth="2"
    />
    <text x="50" y="60" textAnchor="middle" fill="black" fontSize="14">
      {data.label}
    </text>
  </svg>
);

// Behavior: Square, Muted Green (#8BCB8B) - Already Correct
const BehaviorNode = ({ data }: BaseNodeParams) => (
  <svg width="100" height="100">
    <rect
      x="10"
      y="10"
      width="80"
      height="80"
      fill={NodeColors.behavior}
      stroke="black"
      strokeWidth="2"
    />
    <text x="50" y="55" textAnchor="middle" fill="black" fontSize="14">
      {data.label}
    </text>
  </svg>
);

// Conflict Node (Hexagon, Purple, Lists Connected Nodes)
const ConflictNodeComponent = ({ data }: ConflictNodeParams) => (
  <svg width="100" height="100">
    <rect
      x="10"
      y="20"
      width="80"
      height="60"
      fill={NodeColors.conflict}
      stroke="black"
      strokeWidth="2"
    />
    <text x="50" y="45" textAnchor="middle" fill="black" fontSize="14">
      {data.label}
    </text>
    <text x="50" y="65" textAnchor="middle" fill="black" fontSize="10">
      {data.connectedNodeIds && data.connectedNodeIds.join(", ")}
    </text>
  </svg>
);

const nodeMap = {
  emotion: EmotionNode,
  thought: ThoughtNode,
  sensation: SensationNode,
  behavior: BehaviorNode,
  self: SelfNode,
  other: OtherNode,
};

const CustomNodeComponent = ({
  type,
  data,
}: {
  type: keyof typeof nodeMap;
  data: BaseNodeData;
}) => {
  const NodeComponent = nodeMap[type];
  return NodeComponent ? <NodeComponent data={data} /> : null;
};

const NodeComponent = ({
  type,
  data,
}: {
  type: NodeType;
  data: BaseNodeData | ConflictNodeData;
}) => {
  if (type === "conflict") {
    return <ConflictNodeComponent data={data as ConflictNodeData} />;
  }
  if (type === "part") return <PartNode data={data as PartNodeData} />;
  return <CustomNodeComponent type={type} data={data as BaseNodeData} />;
};

export default NodeComponent;

export const nodeTypes = {
  emotion: NodeComponent,
  thought: NodeComponent,
  sensation: NodeComponent,
  behavior: NodeComponent,
  conflict: NodeComponent,
  part: NodeComponent,
  self: NodeComponent,
  other: NodeComponent,
};
