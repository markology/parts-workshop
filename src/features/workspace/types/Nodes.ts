import { Node } from "@xyflow/react";

import { ImpressionType } from "./Impressions";

export interface BaseNodeData {
  label: string;
  [key: string]: unknown; // ✅ add this line
}

export type PartType = "manager" | "firefighter" | "exile" | "custom";

export interface PartNodeData extends BaseNodeData {
  type: "partData";
  label: string;
  name: string;
  image?: string;
  partType: PartType;
  customPartType?: string;
  age?: number;
  gender?: string;
  scratchpad?: string;
  needs: string[];
  fears: string[];
  insights: string[];
  Emotions: ImpressionNode[];
  Thoughts: ImpressionNode[];
  Sensations: ImpressionNode[];
  Behaviors: ImpressionNode[];
  Others: ImpressionNode[];
  customImpressionBuckets: { [key: string]: ImpressionNode[] };
}

export type RelationshipType = "tension" | "interaction";

export interface TensionNodeData extends BaseNodeData {
  type: "tensionData";
  relationshipType: RelationshipType;
  connectedNodes: ConnectedNodeType[];
}

export interface ImpressionNodeData extends BaseNodeData {
  type: "impressionData";
}

export interface RelationshipSelectionNodeData extends BaseNodeData {
  type: "relationshipSelectionData";
}

export type ConnectedNodeType = {
  part: PartNode;
  tensionDescription: string;
};

export type ImpressionNode = Node<BaseNodeData> & {
  type: ImpressionType | "default";
};

export type PartNode = Node<PartNodeData> & {
  type: "part";
};

export type TensionNode = Node<TensionNodeData> & {
  type: "tension";
};

export type InteractionNode = Node<TensionNodeData> & {
  type: "interaction";
};

export type RelationshipSelectionNode = Node<RelationshipSelectionNodeData> & {
  type: "relationship";
};

export type WorkshopNode = ImpressionNode | PartNode | TensionNode | InteractionNode | RelationshipSelectionNode;

export type NodeType = "impression" | "part" | "tension" | "interaction" | "relationship";
