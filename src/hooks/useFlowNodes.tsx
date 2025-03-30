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
    (impressionId: string) => {
      setNodes((prev) =>
        prev.map((node) => {
          if (node.type === "part" && Array.isArray(node.data?.impressionIds)) {
            return {
              ...node,
              data: {
                ...node.data,
                impressionIds: node.data.impressionIds.filter(
                  (id: string) => id !== impressionId
                ),
              },
            };
          }
          return node;
        })
      );
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
  };
};
