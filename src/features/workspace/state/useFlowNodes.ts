import { ImpressionType } from "@/types/Impressions";
import {
  ConflictNode,
  ConflictNodeData,
  ConnectedNodeType,
  ImpressionNode,
  NodeDataTypes,
  NodeType,
  NodeTypes,
  PartNode,
  WorkshopNode,
} from "@/types/Nodes";
import { useNodesState, XYPosition } from "@xyflow/react";
import { useCallback, useEffect, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import insertImpressionToPartCB from "./updaters/insertImpressionToPart";
import updateNodeCB from "./updaters/updateNode";
import detachImpressionFromPartCB from "./updaters/detachImpressionFromPart";

export type NodeActions = ReturnType<typeof useFlowNodes>;

export const useFlowNodes = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState<WorkshopNode>([]);
  const getNodes = useRef(() => nodes);

  useEffect(() => {
    getNodes.current = () => nodes;
  }, [nodes]);

  const deleteNode = useCallback(
    (id: string) => {
      setNodes((prev) => prev.filter((n) => n.id !== id));
    },
    [setNodes]
  );

  const updateNode = useCallback(
    <NodeDataType>(id: string, updater: { data: Partial<NodeDataType> }) => {
      setNodes((prev) =>
        updateNodeCB<NodeDataType>({ nodes: prev, id, updater })
      );
    },
    [setNodes]
  );

  const detachImpressionFromPart = useCallback(
    (impressionId: string, partId: string, type: ImpressionType) => {
      setNodes((prevNodes) =>
        detachImpressionFromPartCB({
          nodes: prevNodes,
          impressionId,
          partId,
          type,
        })
      );
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
      setNodes((prevNodes) =>
        insertImpressionToPartCB(
          prevNodes,
          impressionNode,
          impressionId,
          partId,
          type
        )
      );
    },
    [setNodes]
  );

  const createNode = (type: NodeType, position: XYPosition, label: string) => {
    let newNode = {
      id: uuidv4(),
      type,
      position,
      style: {
        backgroundColor: "transparent",
        border: "none",
        boxShadow: "none",
      },
      data: {
        label,
      },
    };

    if (type === NodeTypes.ConflictNode) {
      newNode = {
        ...newNode,
        data: {
          ...newNode.data,
          connectedNodes: [],
          type: NodeDataTypes.ConflictNodeData,
        } as ConflictNodeData,
      };
      setNodes((prev) => [...prev, newNode as ConflictNode]);
      return;
    }
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
    removePartFromConflict,
    getNodes,
    deleteNode,
    updateNode,
    detachImpressionFromPart,
    insertImpressionToPart,
    updateConflictDescription,
  };
};
