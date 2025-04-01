import { PartDataLabels } from "@/constants/Nodes";
import { ImpressionType } from "@/types/Impressions";
import {
  ConflictNode,
  ConnectedNodeType,
  ImpressionNode,
  NodeType,
  PartNode,
} from "@/types/Nodes";
import { useNodesState, Node, XYPosition } from "@xyflow/react";
import { useCallback, useEffect, useRef } from "react";
import { v4 as uuidv4 } from "uuid";

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

  const createNode = (type: NodeType, position: XYPosition, label: string) => {
    const newNode: Node = {
      id: uuidv4(),
      type,
      position,
      data: {
        label, // Ensure label is included
        ...(type === "conflict" ? { connectedNodes: [] } : {}),
      },
      style: {
        backgroundColor: "transparent",
        border: "none",
        boxShadow: "none",
      },
    };

    setNodes((prev) => [...prev, newNode]);
  };

  const addPartToConflict = (conflict: ConflictNode, part: PartNode) => {
    updateNode(conflict.id, {
      data: {
        ...conflict.data,
        connectedNodes: [
          ...((conflict.data.connectedNodes as ConnectedNodeType[]) || []),
          { part, conflictDescription: "" },
        ],
      },
    });
  };

  const removePartFromConflict = (conflict: ConflictNode, partId: string) => {
    updateNode(conflict.id, {
      data: {
        ...conflict.data,
        connectedNodes: (
          conflict.data.connectedNodes as ConnectedNodeType[]
        ).filter((cn) => cn.part.id !== partId),
      },
    });
  };

  const updateConflictDescription = (
    conflict: ConflictNode,
    connectedNodeId: string,
    conflictDescription: string
  ) => {
    const newConnectedNodes = (
      conflict.data.connectedNodes as ConnectedNodeType[]
    ).reduce<ConnectedNodeType[]>((acc, connectedNode: ConnectedNodeType) => {
      if (connectedNode.part.id === connectedNodeId)
        connectedNode.conflictDescription = conflictDescription;
      acc.push(connectedNode);
      return acc;
    }, []);

    updateNode(conflict.id, {
      data: {
        ...conflict.data,
        connectedNodes: newConnectedNodes,
      },
    });
  };

  return {
    addPartToConflict,
    createNode,
    nodes,
    setNodes,
    onNodesChange,
    resetNodes,
    removePartFromConflict,
    getNodes,
    deleteNode,
    updateNode,
    detachImpressionFromPart,
    insertImpressionToPart,
    updateConflictDescription,
  };
};
