import { WorkshopNode } from "@/types/Nodes";
export default function updateNodeCB<NodeDataType>({
  nodes,
  id,
  updater,
}: {
  nodes: WorkshopNode[];
  id: string;
  updater: { data: Partial<NodeDataType> };
}): WorkshopNode[] {
  return nodes.map((node) =>
    node.id === id
      ? { ...node, ...updater, data: { ...node.data, ...updater.data } }
      : node
  ) as WorkshopNode[];
}
