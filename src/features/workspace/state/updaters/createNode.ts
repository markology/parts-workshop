import { ImpressionType } from "@/types/Impressions";
import {
  ConflictNode,
  ConflictNodeData,
  ImpressionNode,
  NodeType,
  PartNode,
  PartNodeData,
  WorkshopNode,
} from "@/types/Nodes";
import { XYPosition } from "@xyflow/react";
import { v4 as uuidv4 } from "uuid";

export default function createNodeFN({
  type,
  position,
  label,
  impressionType,
}: {
  type: NodeType;
  position: XYPosition;
  label: string;
  impressionType?: ImpressionType;
}) {
  const id = uuidv4();
  const baseNode = {
    id,
    position,
    style: {
      backgroundColor: "transparent",
      border: "none",
      boxShadow: "none",
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
        data: {
          type: "partData",
          label,
          needs: [],
          Emotions: [],
          Thoughts: [],
          Sensations: [],
          Behaviors: [],
          Others: [],
          Self: [],
        } as PartNodeData,
      } as PartNode;
      break;

    case "conflict":
      newNode = {
        ...baseNode,
        type: "conflict",
        data: {
          type: "conflictData",
          label,
          connectedNodes: [],
        } as ConflictNodeData,
      } as ConflictNode;
      break;

    default:
      throw new Error(`Unknown node type: ${type}`);
  }
  return newNode;
}
