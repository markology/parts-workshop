import { ImpressionType } from "@/features/workspace/types/Impressions";
import { ConflictNodeData, ImpressionNodeData, NodeType, PartNodeData, RelationshipSelectionNodeData } from "@/features/workspace/types/Nodes";

import ImpressionNode from "./ImpressionNode";
import NewPartNode from "./PartNode/NewPartNode";
import ConflictNode from "./RelationshipNode/ConflictNode";
import AllyNode from "./RelationshipNode/AllyNode";
import RelationshipSelectionNode from "./RelationshipNode/RelationshipSelectionNode";

const NodeComponent = ({
  type,
  data,
  id,
}: {
  type: NodeType;
  data: ImpressionNodeData | ConflictNodeData | PartNodeData | RelationshipSelectionNodeData;
  id: string;
}) => {
  if ("type" in data) {
    if (data.type === "partData") return <NewPartNode partId={id} data={data} />;

    if (data.type === "conflictData") {
      // Check if this is an ally node based on relationshipType
      const isAlly = data.relationshipType === "ally";
      return isAlly ? (
        <AllyNode key={id} id={id} connectedNodes={data.connectedNodes} />
      ) : (
        <ConflictNode key={id} id={id} connectedNodes={data.connectedNodes} />
      );
    }

    if (data.type === "relationshipSelectionData") {
      return <RelationshipSelectionNode key={id} id={id} />;
    }
  }

  return (
    <ImpressionNode
      key={id}
      type={type as ImpressionType}
      id={id}
      label={data.label}
    />
  );
};

export default NodeComponent;

export const nodeTypes = {
  emotion: NodeComponent,
  thought: NodeComponent,
  sensation: NodeComponent,
  behavior: NodeComponent,
  conflict: NodeComponent,
  ally: NodeComponent,
  part: NodeComponent,
  other: NodeComponent,
  relationship: NodeComponent,
};
