import { ImpressionType } from "@/types/Impressions";
import {
  BaseNodeData,
  ConflictNodeData,
  NodeDataTypes,
  NodeType,
  PartNodeData,
} from "@/types/Nodes";

import ConflictNode from "./ConflictNode";
import ImpressionNode from "./ImpressionNode";
import PartNode from "./PartNode/PartNode";

const NodeComponent = ({
  type,
  data,
  id,
}: {
  type: NodeType;
  data: BaseNodeData | ConflictNodeData | PartNodeData;
  id: string;
}) => {
  console.log(type, data, id);
  if ("type" in data) {
    if (data.type === NodeDataTypes.PartNodeData)
      return <PartNode partId={id} data={data} />;

    if (data.type === NodeDataTypes.ConflictNodeData)
      return (
        <ConflictNode key={id} id={id} connectedNodes={data.connectedNodes} />
      );
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
