import { ImpressionType } from "@/features/workspace/types/Impressions";
import {
  AllyNode,
  ConflictNode,
  ConflictNodeData,
  ImpressionNode,
  NodeType,
  PartNode,
  PartNodeData,
  RelationshipSelectionNode,
  RelationshipSelectionNodeData,
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
        style: {
          ...baseNode.style,
          borderRadius: 12, // Match rounded-xl (12px) to prevent border radius from poking through
        },
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
          borderRadius: 26,
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
          borderRadius: 26,
        },
        data: {
          type: "conflictData",
          label,
          relationshipType: "ally" as const,
          connectedNodes: [],
        } as ConflictNodeData,
      } as AllyNode;

      break;

    case "relationship":
      newNode = {
        ...baseNode,
        type: "relationship",
        style: {
          ...baseNode.style,
          textAlign: "center",
        },
        data: {
          type: "relationshipSelectionData",
          label: "Choose Relationship Type",
        } as RelationshipSelectionNodeData,
      } as RelationshipSelectionNode;

      break;

    default:
      throw new Error(`Unknown node type: ${type}`);
  }

  return newNode;
}
