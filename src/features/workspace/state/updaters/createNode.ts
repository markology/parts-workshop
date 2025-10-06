import { ImpressionType } from "@/features/workspace/types/Impressions";
import {
  ConflictNode,
  ConflictNodeData,
  ImpressionNode,
  NodeType,
  PartNode,
  PartNodeData,
  WorkshopNode,
} from "@/features/workspace/types/Nodes";
import { XYPosition } from "@xyflow/react";
import { v4 as uuidv4 } from "uuid";

export default function createNodeFN({
  type,
  position,
  label,
  impressionType,
  style,
}: {
  type: NodeType;
  position: XYPosition;
  label: string;
  impressionType?: ImpressionType;
  style?: unknown;
}) {
  const id = uuidv4();
  const baseNode = {
    id,
    position,
    style: {
      ...(typeof style === "object" ? style : {}),
      backgroundColor: "transparent",
      border: "none",
      borderRadius: 5,
    },
  };

  let newNode: WorkshopNode;

  switch (type) {
    case "impression":
      if (!impressionType) {
        throw new Error("Impression type is required for impression nodes");
      }
      newNode = {
        ...baseNode,
        type: impressionType, // e.g., 'emotion', 'thought'
        data: {
          label,
        },
      } as ImpressionNode;
      break;

    case "part":
      newNode = {
        ...baseNode,
        type: "part",
        style: {
          ...baseNode.style,
          textAlign: "right",
          zIndex: -1,
          borderRadius: 25,
        },
        data: {
          type: "partData",
          label,
          name: label,
          partType: "custom",
          needs: [],
          fears: [],
          insights: [],
          Emotions: [],
          Thoughts: [],
          Sensations: [],
          Behaviors: [],
          Others: [],
          customImpressionBuckets: {},
        } as PartNodeData,
      } as PartNode;
      break;

    case "conflict":
      newNode = {
        ...baseNode,
        type: "conflict",
        style: {
          ...baseNode.style,
          textAlign: "right",
        },
        data: {
          type: "conflictData",
          label,
          relationshipType: "conflict" as const,
          connectedNodes: [],
        } as ConflictNodeData,
      } as ConflictNode;

      break;

    case "ally":
      newNode = {
        ...baseNode,
        type: "ally",
        style: {
          ...baseNode.style,
          textAlign: "right",
        },
        data: {
          type: "conflictData",
          label,
          relationshipType: "ally" as const,
          connectedNodes: [],
        } as ConflictNodeData,
      } as ConflictNode;

      break;

    default:
      throw new Error(`Unknown node type: ${type}`);
  }

  return newNode;
}
