import { useFlowNodesContext } from "@/features/workspace/state/FlowNodesContext";
import { PartNodeData } from "@/features/workspace/types/Nodes";
import { useMemo } from "react";

interface PartRelationshipsProps {
  partId: string;
  data: PartNodeData;
}

const PartRelationships = ({ partId, data }: PartRelationshipsProps) => {
  const { nodes, edges } = useFlowNodesContext();

  const relationships = useMemo(() => {
    const connectedEdges = edges.filter(
      (edge) => edge.source === partId || edge.target === partId
    );

    return connectedEdges.map((edge) => {
      const connectedNodeId = edge.source === partId ? edge.target : edge.source;
      const connectedNode = nodes.find((node) => node.id === connectedNodeId);
      
      return {
        id: edge.id,
        nodeId: connectedNodeId,
        nodeType: connectedNode?.type || "unknown",
        nodeLabel: connectedNode?.data?.label || "Unknown",
        relationshipType: edge.data?.relationshipType || "connected",
      };
    });
  }, [edges, nodes, partId]);

  if (relationships.length === 0) {
    return (
      <div className="part-relationships">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Relationships</h4>
        <div className="text-sm text-gray-500 italic">No relationships yet</div>
      </div>
    );
  }

  return (
    <div className="part-relationships">
      <h4 className="text-sm font-medium text-gray-700 mb-2">Relationships</h4>
      <div className="space-y-1">
        {relationships.map((rel) => (
          <div
            key={rel.id}
            className="flex items-center gap-2 p-2 bg-gray-50 rounded text-sm"
          >
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="font-medium">{rel.nodeLabel}</span>
            <span className="text-gray-500 text-xs">({rel.nodeType})</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PartRelationships;
