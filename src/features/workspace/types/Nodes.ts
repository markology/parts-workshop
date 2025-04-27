import { Node } from "@xyflow/react";

import { ImpressionType } from "./Impressions";

export interface BaseNodeData {
  label: string;
  [key: string]: unknown; // ✅ add this line
}

export interface PartNodeData extends BaseNodeData {
  type: "partData";
  label: string;
  needs: string[];
  Emotions: ImpressionNode[];
  Thoughts: ImpressionNode[];
  Sensations: ImpressionNode[];
  Behaviors: ImpressionNode[];
  Others: ImpressionNode[];
  Self: ImpressionNode[];
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
