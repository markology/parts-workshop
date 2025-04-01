import { Node } from "@xyflow/react";

export interface BaseNodeData {
  label: string;
}

export interface ConflictNodeData extends BaseNodeData {
  connectedNodes: ConnectedNodeType[];
}

export interface PartNodeData extends BaseNodeData {
  emotions: ImpressionNode[];
  thoughts: ImpressionNode[];
  sensations: ImpressionNode[];
  behaviors: ImpressionNode[];
  others: ImpressionNode[];
  self: ImpressionNode[];
}

export type NodeType =
  | "emotion"
  | "thought"
  | "sensation"
  | "behavior"
  | "conflict"
  | "part"
  | "other"
  | "self";

export type BaseNodeParams = { data: BaseNodeData };
export type ConflictNodeParams = { data: ConflictNodeData };

export type ImpressionNode = Node & BaseNodeData;
export type PartNode = Node & PartNodeData;
export type ConflictNode = Node & ConflictNodeData;

export type ConnectedNodeType = {
  part: PartNode;
  conflictDescription: string;
};
