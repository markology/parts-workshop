import PartNode from "./PartNode";
import {
  BaseNodeData,
  ConflictNodeData,
  NodeType,
  PartNodeData,
} from "@/types/Nodes";

import ImpressionNode from "./ImpressionNode";
import ConflictNode from "./ConflictNode";
import { ImpressionType } from "@/types/Impressions";

const NodeComponent = ({
  type,
  data,
  id,
}: {
  type: NodeType;
  data: BaseNodeData | ConflictNodeData;
  id: string;
}) => {
  if (type === "part")
    return <PartNode partId={id} data={data as PartNodeData} />;
  if (type === "conflict" && "connectedNodes" in data)
    return (
      <ConflictNode key={id} id={id} connectedNodes={data.connectedNodes} />
    );

  if (type !== "conflict") {
    return (
      <ImpressionNode
        key={id}
        type={type as ImpressionType}
        id={id}
        label={data.label}
      />
    );
  }
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
