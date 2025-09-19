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

export interface ConflictNodeData extends BaseNodeData {
  type: "conflictData";
  connectedNodes: ConnectedNodeType[];
}

export interface ImpressionNodeData extends BaseNodeData {
  type: "impressionData";
}

export type ConnectedNodeType = {
  part: PartNode;
  conflictDescription: string;
};

export type ImpressionNode = Node<BaseNodeData> & {
  type: ImpressionType | "default";
};

export type PartNode = Node<PartNodeData> & {
  type: "part";
};

export type ConflictNode = Node<ConflictNodeData> & {
  type: "conflict";
};

export type WorkshopNode = ImpressionNode | PartNode | ConflictNode;

export type NodeType = "impression" | "part" | "conflict";
