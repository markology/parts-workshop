import { Node } from "@xyflow/react";
import { ImpressionType } from "./Impressions";

export enum NodeDataTypes {
  "ConflictNodeData",
  "PartNodeData",
}
export interface BaseNodeData {
  label: string;
}

export interface ConflictNodeData extends BaseNodeData {
  type: NodeDataTypes.ConflictNodeData;
  connectedNodes: ConnectedNodeType[];
}

export interface PartNodeData extends BaseNodeData {
  type: NodeDataTypes.PartNodeData;
  Emotions: ImpressionNode[];
  Thoughts: ImpressionNode[];
  Sensations: ImpressionNode[];
  Behaviors: ImpressionNode[];
  Others: ImpressionNode[];
  Self: ImpressionNode[];
}

export type NodeType = ImpressionType | "part" | "conflict";

export type ImpressionNode = Node & { data: BaseNodeData };
export type PartNode = Node & { data: PartNodeData };
export type ConflictNode = Node & { data: ConflictNodeData };
export type WorkshopNode = ImpressionNode | PartNode | ConflictNode;

export type ConnectedNodeType = {
  part: PartNode;
  conflictDescription: string;
};
