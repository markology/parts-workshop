import { ImpressionType } from "@/features/workspace/types/Impressions";
import { ConflictNodeData, ImpressionNodeData, NodeType, PartNodeData } from "@/features/workspace/types/Nodes";

import ImpressionNode from "./ImpressionNode";
import NewPartNode from "./PartNode/NewPartNode";
import ConflictNode from "./RelationshipNode/ConflictNode";
import AllyNode from "./RelationshipNode/AllyNode";

const NodeComponent = ({
  type,
  data,
  id,
}: {
  type: NodeType;
  data: ImpressionNodeData | ConflictNodeData | PartNodeData;
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
};
