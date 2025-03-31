import { PartDataLabels } from "@/constants/Nodes";
import { ImpressionType } from "@/types/Impressions";
import { ImpressionNode } from "@/types/Nodes";
import { useNodesState, Node } from "@xyflow/react";
import { useCallback, useEffect, useRef } from "react";

export type NodeActions = ReturnType<typeof useFlowNodes>;

export const useFlowNodes = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);

  const getNodes = useRef(() => nodes);

  useEffect(() => {
    getNodes.current = () => nodes;
  }, [nodes]);

  const resetNodes = useCallback(
    (newNodes: Node[]) => {
      setNodes(newNodes);
    },
    [setNodes]
  );

  const deleteNode = useCallback(
    (id: string) => {
      setNodes((prev) => prev.filter((n) => n.id !== id));
    },
    [setNodes]
  );

  const updateNode = useCallback(
    (id: string, updater: Partial<Node>) => {
      setNodes((prev) =>
        prev.map((node) =>
          node.id === id
            ? { ...node, ...updater, data: { ...node.data, ...updater.data } }
            : node
        )
      );
    },
    [setNodes]
  );

  const detachImpressionFromPart = useCallback(
    (impressionId: string, partId: string, type: ImpressionType) => {
      setNodes((prevNodes) => {
        return prevNodes.reduce((acc: Node[], node: Node) => {
          if (impressionId === node.id) {
            // Skip the impression node we're deleting
            return acc;
          }

          if (node.id === partId) {
            // Update the parent node by removing the impression from its data
            const updatedImpressions = (
              node.data[PartDataLabels[type]] as Node[]
            ) // fix typescript
              .filter((impression) => impression.id !== impressionId);
            const updatedNode = {
              ...node,
              data: {
                ...node.data,
                [PartDataLabels[type]]: updatedImpressions,
              },
            };

            acc.push(updatedNode);
          } else {
            // All other nodes remain unchanged
            acc.push(node);
          }

          return acc;
        }, []);
      });
    },
    [setNodes]
  );

  const insertImpressionToPart = useCallback(
    (
      impressionNode: ImpressionNode,
      impressionId: string,
      partId: string,
      type: ImpressionType
    ) => {
      setNodes((prevNodes) => {
        return prevNodes.reduce((acc: Node[], n) => {
          if (n.id === impressionId) return acc;
          if (n.id === partId) {
            // const partDataLabelKey = node.type as keyof typeof PartDataLabels;
            const partDataLabel = PartDataLabels[type as ImpressionType];
            // Clone the part node and safely add the impression node
            const updatedPartNode = {
              ...n,
              data: {
                ...n.data,
                [partDataLabel]: [
                  ...((n.data[partDataLabel] as ImpressionNode[]) || []),
                  impressionNode,
                ],
              },
            };

            acc.push(updatedPartNode);
          } else acc.push(n);
          return acc;
        }, []);
      });
    },
    [setNodes]
  );

  return {
    nodes,
    setNodes,
    onNodesChange,
    resetNodes,
    getNodes,
    deleteNode,
    updateNode,
    detachImpressionFromPart,
    insertImpressionToPart,
  };
};
