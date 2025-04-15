import { Node } from "@xyflow/react";

import { ImpressionType } from "./Impressions";
import PartNode from "@/features/workspace/components/Nodes/PartNode/PartNode";
import ConflictNode from "@/features/workspace/components/Nodes/ConflictNode";

export enum NodeDataTypes {
  "ConflictNodeData" = "conflict",
  "PartNodeData" = "part",
}

export enum NodeTypes {
  "ImpressionNode" = "impression",
  "ConflictNode" = "conflict",
  "PartNode" = "part",
}

export interface BaseNodeData {
  label: string;
  [key: string]: unknown; // ✅ add this line
}

export interface ConflictNodeData extends BaseNodeData {
  type: NodeDataTypes.ConflictNodeData;
  connectedNodes: ConnectedNodeType[];
}

export interface PartNodeData extends BaseNodeData {
  type: NodeDataTypes.PartNodeData;
  needs: string[];
  Emotions: ImpressionNode[];
  Thoughts: ImpressionNode[];
  Sensations: ImpressionNode[];
  Behaviors: ImpressionNode[];
  Others: ImpressionNode[];
  Self: ImpressionNode[];
}

export type NodeType =
  | ImpressionType
  | NodeTypes.PartNode
  | NodeTypes.ConflictNode;

export type Nodes = {
  [NodeTypes.PartNode]: PartNode;
  [NodeTypes.ConflictNode]: ConflictNode;
} & {
  [K in ImpressionType]: ImpressionNode;
};

export type ImpressionNode = Node & {
  data: BaseNodeData;
  type: ImpressionType;
};
export type PartNode = Node & { data: PartNodeData; type: NodeTypes.PartNode };
export type ConflictNode = Node & {
  data: ConflictNodeData;
  type: NodeTypes.ConflictNode;
};
export type WorkshopNode = ImpressionNode | PartNode | ConflictNode;
export type WorkshopNodeData = BaseNodeData | PartNodeData | ConflictNodeData;

export type ConnectedNodeType = {
  part: PartNode;
  conflictDescription: string;
};
