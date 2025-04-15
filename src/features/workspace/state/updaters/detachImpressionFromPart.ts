import { ImpressionTextType, ImpressionType } from "@/types/Impressions";
import { PartNode, WorkshopNode } from "@/types/Nodes";

export default function detachImpressionFromPartCB({
  nodes,
  impressionId,
  partId,
  type,
}: {
  nodes: WorkshopNode[];
  impressionId: string;
  partId: PartNode["id"];
  type: ImpressionType;
}) {
  return nodes.reduce((acc: WorkshopNode[], node: WorkshopNode) => {
    if (impressionId === node.id) {
      // Skip the impression node we're deleting
      return acc;
    }

    if (node.id === partId && node.type === "part") {
      // Update the parent node by removing the impression from its data
      const updatedImpressions = node.data[ImpressionTextType[type]] // fix typescript
        .filter((impression) => impression.id !== impressionId);

      const updatedNode = {
        ...node,
        data: {
          ...node.data,
          [ImpressionTextType[type]]: updatedImpressions,
        },
      };

      acc.push(updatedNode);
    } else {
      // All other nodes remain unchanged
      acc.push(node);
    }

    return acc;
  }, []);
}
