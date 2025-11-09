import { ImpressionType } from "@/features/workspace/types/Impressions";
import { TensionNodeData, ImpressionNodeData, NodeType, PartNodeData, RelationshipSelectionNodeData } from "@/features/workspace/types/Nodes";

import ImpressionNode from "./ImpressionNode";
import NewPartNode from "./PartNode/NewPartNode";
import TensionNode from "./RelationshipNode/TensionNode";
import RelationshipNode from "./RelationshipNode/RelationshipNode";
import RelationshipSelectionNode from "./RelationshipNode/RelationshipSelectionNode";

const NodeComponent = ({
  type,
  data,
  id,
}: {
  type: NodeType;
  data: ImpressionNodeData | TensionNodeData | PartNodeData | RelationshipSelectionNodeData;
  id: string;
}) => {
  if ("type" in data) {
    if (data.type === "partData") return <NewPartNode partId={id} data={data} />;

    if (data.type === "tensionData") {
      // Check if this is an interaction node based on relationshipType
      const isInteraction = data.relationshipType === "interaction";
      return isInteraction ? (
        <RelationshipNode key={id} id={id} connectedNodes={data.connectedNodes} />
      ) : (
        <TensionNode key={id} id={id} connectedNodes={data.connectedNodes} />
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
  tension: NodeComponent,
  interaction: NodeComponent,
  part: NodeComponent,
  other: NodeComponent,
  relationship: NodeComponent,
};
