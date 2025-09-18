import { ImpressionType } from "@/features/workspace/types/Impressions";
import { ConflictNodeData, ImpressionNodeData, NodeType, PartNodeData } from "@/features/workspace/types/Nodes";

import ImpressionNode from "./ImpressionNode";
import PartNode from "./PartNode/PartNode";
import ConflictNode from "./RelationshipNode/ConflictNode";

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
    if (data.type === "partData") return <PartNode partId={id} data={data} />;

    if (data.type === "conflictData") {
      return (
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
  part: NodeComponent,
  other: NodeComponent,
};
