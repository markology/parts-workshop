import { ImpressionTextType, ImpressionType } from "@/types/Impressions";
import {
  ConflictNode,
  ConnectedNodeType,
  ImpressionNode,
  NodeDataTypes,
  NodeType,
  PartNode,
  WorkshopNode,
} from "@/types/Nodes";
import { Node, useNodesState, XYPosition } from "@xyflow/react";
import { useCallback, useEffect, useRef } from "react";
import { v4 as uuidv4 } from "uuid";

export type NodeActions = ReturnType<typeof useFlowNodes>;

export const useFlowNodes = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState<WorkshopNode>([]);

  const getNodes = useRef(() => nodes);

  useEffect(() => {
    getNodes.current = () => nodes;
  }, [nodes]);

  const resetNodes = useCallback(
    (newNodes: WorkshopNode[]) => {
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
    <NodeDataType>(id: string, updater: { data: Partial<NodeDataType> }) => {
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
        return prevNodes.reduce((acc: WorkshopNode[], node: WorkshopNode) => {
          if (impressionId === node.id) {
            // Skip the impression node we're deleting
            return acc;
          }

          if (node.id === partId) {
            // Update the parent node by removing the impression from its data
            const updatedImpressions = (
              node.data[ImpressionTextType[type]] as Node[]
            ) // fix typescript
              .filter((impression) => impression.id !== impressionId);
            const updatedNode = {
              ...node,
              data: {
                ...node.data,
                [ImpressionTextType[type]]: updatedImpressions,
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
        return prevNodes.reduce((acc: WorkshopNode[], n) => {
          if (n.id === impressionId) return acc;
          if (n.id === partId) {
            const partDataLabel = ImpressionTextType[type];
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
    const newNode: WorkshopNode = {
      id: uuidv4(),
      type,
      position,
      data: {
        label, // Ensure label is included
        ...(type === "conflict"
          ? { connectedNodes: [], type: NodeDataTypes.ConflictNodeData }
          : {}),
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
