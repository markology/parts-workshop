import { Node } from "@xyflow/react";

export interface BaseNodeData {
  label: string;
}

export interface ConflictNodeData extends BaseNodeData {
  connectedNodeIds: string[];
}

export interface PartNodeData extends BaseNodeData {
  emotions: string[];
  thoughts: string[];
  sensations: string[];
  behaviors: string[];
  others: string[];
  self: string[];
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
