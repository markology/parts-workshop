import {
  ConflictNodeData,
  ImpressionNodeData,
  NodeType,
  PartNodeData,
} from "@/types/Nodes";

import ConflictNode from "./ConflictNode";
import ImpressionNode from "./ImpressionNode";
import PartNode from "./PartNode/PartNode";
import { ImpressionType } from "@/types/Impressions";

const NodeComponent = ({
  type,
  data,
  id,
}: {
  type: NodeType;
  data: ImpressionNodeData | ConflictNodeData | PartNodeData;
  id: string;
}) => {
  console.log(data, type, id);
  if ("type" in data) {
    if (data.type === "partData") return <PartNode partId={id} data={data} />;

    if (data.type === "conflictData") {
      console.log("making conflict node");
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
  self: NodeComponent,
  other: NodeComponent,
};
