import {
  ImpressionNode,
  PartNode,
  PartNodeData,
  WorkshopNode,
} from "@/types/Nodes";
import { ImpressionType, ImpressionTextType } from "@/types/Impressions";

export default function insertImpressionToPartCB(
  nodes: WorkshopNode[],
  impression: ImpressionNode,
  impressionId: string,
  partId: string,
  type: ImpressionType
): WorkshopNode[] {
  return nodes.reduce<WorkshopNode[]>((acc, node) => {
    // 1. Remove the impression node from the top-level
    if (node.id === impressionId) return acc;

    // 2. Update the part node and insert the impression into the correct type bucket
    if (node.id === partId && node.type === "part") {
      const label = ImpressionTextType[type];
      const updatedImpressions = [
        ...((node.data[label] as ImpressionNode[]) || []),
        impression,
      ];

      const updatedNode: PartNode = {
        ...node,
        data: {
          ...(node.data as PartNodeData),
          [label]: updatedImpressions,
        },
      };

      acc.push(updatedNode);
    } else {
      acc.push(node);
    }

    return acc;
  }, []);
}
