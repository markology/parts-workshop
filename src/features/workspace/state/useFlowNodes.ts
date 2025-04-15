"use client";

import { useUIStore } from "@/state/UI";
import { useCallback, useEffect, useRef } from "react";
import createNodeFN from "./updaters/createNode";
import detachImpressionFromPartCB from "./updaters/detachImpressionFromPart";
import insertImpressionToPartCB from "./updaters/insertImpressionToPart";
import updateNodeCB from "./updaters/updateNode";

import { useSidebarStore } from "@/state/Sidebar";
import { ImpressionType } from "@/types/Impressions";
import {
  ConflictNode,
  ConnectedNodeType,
  ImpressionNode,
  NodeType,
  PartNode,
  WorkshopNode,
} from "@/types/Nodes";
import {
  Connection,
  Edge,
  EdgeChange,
  Node,
  XYPosition,
  addEdge,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from "@xyflow/react";
import { v4 as uuidv4 } from "uuid";
import { Map } from "@/types/api/map";

export type NodeActions = ReturnType<typeof useFlowNodes>;

function isPointInsideNode(position: XYPosition, node: Node): boolean {
  if (node?.measured?.width == null || node?.measured?.height == null)
    return false;

  return (
    position.x >= node.position.x &&
    position.x <= node.position.x + node.measured.width &&
    position.y >= node.position.y &&
    position.y <= node.position.y + node.measured.height
  );
}

// Hook Features
// add and remove conflicts
// update, delete and create new nodes
// update part title / needs
// update conflict descriptions
// add / remove impressions from parts
// return impressions to sidebar
// move impressions from sidebar to canvas
// handle various events on ReactFlow

// manages interactivity of flow nodes state and canvas

export const useFlowNodes = (map?: Map) => {
  const [nodes, setNodes, onNodesChange] = useNodesState<WorkshopNode>(
    map?.nodes || []
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(
    map?.edges || []
  );
  const { getEdge, getNode, screenToFlowPosition } = useReactFlow();
  const getNodes = useRef(() => nodes);

  const populateImpressions = useSidebarStore((s) => s.populateImpressions);
  const activeSidebarNode = useSidebarStore((s) => s.activeSidebarNode);
  const removeImpression = useSidebarStore((s) => s.removeImpression);
  const setRightClickMenuOpen = useUIStore((s) => s.setRightClickMenuOpen);
  const setIsEditing = useUIStore((s) => s.setIsEditing);

  useEffect(() => {
    populateImpressions(map?.sidebarImpressions);
  }, [map, populateImpressions]);

  useEffect(() => {
    getNodes.current = () => nodes;
  }, [nodes]);

  // GENERAL NODE MANAGENT

  const createNode = (
    type: NodeType,
    position: XYPosition,
    label: string,
    impressionType?: ImpressionType
  ) => {
    const newNode = createNodeFN({ type, position, label, impressionType });
    setNodes((prev: WorkshopNode[]) => [...prev, newNode]);
  };

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

  // PART IMPRESSIONS

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

  // CONFLICTS

  const addPartToConflict = useCallback(
    (conflict: ConflictNode, part: PartNode) => {
      updateNode(conflict.id, {
        data: {
          ...conflict.data,
          connectedNodes: [
            ...((conflict.data.connectedNodes as ConnectedNodeType[]) || []),
            { part, conflictDescription: "" },
          ],
        },
      });
    },
    [updateNode]
  );

  const removePartFromConflict = useCallback(
    (conflict: ConflictNode, partId: string) => {
      updateNode(conflict.id, {
        data: {
          ...conflict.data,
          connectedNodes: (
            conflict.data.connectedNodes as ConnectedNodeType[]
          ).filter((cn) => cn.part.id !== partId),
        },
      });
    },
    [updateNode]
  );

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

  // REACT FLOW USER INTERACTIVITY

  const onDragOver = useCallback(
    (event: {
      preventDefault: () => void;
      dataTransfer: { dropEffect: string };
    }) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
    },
    []
  );

  const onDrop = useCallback(
    (event: {
      preventDefault: () => void;
      clientX: number;
      clientY: number;
    }) => {
      event.preventDefault();

      // check if the dropped element is valid
      if (!activeSidebarNode?.type) {
        return;
      }

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const partNodeToInsertImpression: PartNode | undefined = nodes
        .filter((node) => node.type === "part")
        .find(
          (node): node is PartNode =>
            node.type === "part" && isPointInsideNode(position, node)
        );
      const { id, type, label } = activeSidebarNode;

      const newNode: ImpressionNode = {
        id: uuidv4(),
        type,
        position,
        hidden: !!partNodeToInsertImpression,
        data: {
          label, // Ensure label is included
          parentNode: partNodeToInsertImpression || null,
        },
        style: {
          backgroundColor: "transparent",
          border: "none",
          boxShadow: "none",
        },
      };

      if (partNodeToInsertImpression) {
        insertImpressionToPart(
          newNode,
          id,
          partNodeToInsertImpression.id,
          type
        );
      } else {
        setNodes((prev) => [...prev, newNode]);
      }
      removeImpression(type, id);
    },
    [
      activeSidebarNode,
      screenToFlowPosition,
      nodes,
      removeImpression,
      insertImpressionToPart,
      setNodes,
    ]
  );

  const handlePaneClick = () => {
    setRightClickMenuOpen(false);
    setIsEditing(false);
  };

  const onEdgeChange = useCallback(
    (changes: EdgeChange<Edge>[]) => {
      changes.forEach((change) => {
        if ("id" in change) {
          const { target, source } = getEdge(change?.id) || {};
          if (target && source) {
            const conflictNode = getNode(target);
            if (
              change.type === "remove" &&
              "connectedNodes" in (conflictNode?.data ?? {})
            ) {
              removePartFromConflict(conflictNode as ConflictNode, source);
            }
          }
        }
      });
      // // Apply other edge changes (e.g., position updates)
      onEdgesChange(changes);
    },
    [getEdge, getNode, onEdgesChange, removePartFromConflict]
  );

  const onConnect = useCallback(
    (params: Connection) => {
      const partNode = getNode(params.source) as PartNode;
      const conflictNode = getNode(params.target) as ConflictNode;
      if (
        conflictNode.data.connectedNodes.find(
          (connectedPartNode) => connectedPartNode.part.id === partNode.id
        )
      )
        return;
      if (partNode && conflictNode) addPartToConflict(conflictNode, partNode);
      else return;

      const newParams = {
        ...params,
        sourceHandle: params.sourceHandle,
        targetHandle: params.targetHandle,
      };

      setEdges((eds) => addEdge(newParams, eds));
    },
    [addPartToConflict, getNode, setEdges]
  );

  const handleNodeDragStop = useCallback(
    (event: React.MouseEvent, node: Node) => {
      const trashBucket = document.getElementById("trash-bucket");
      if (trashBucket) {
        const bucketRect = trashBucket.getBoundingClientRect();

        const mouseX = event.clientX;
        const mouseY = event.clientY;

        const isOverBucket =
          mouseX >= bucketRect.left &&
          mouseX <= bucketRect.right &&
          mouseY >= bucketRect.top &&
          mouseY <= bucketRect.bottom;

        if (isOverBucket) {
          // Delete the node:
          deleteNode(node.id);
          return;
        }
      }

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      if (node.type === "part") return;

      const partNodeToInsertImpression: PartNode | undefined = nodes
        .filter((n) => n.type === "part")
        .find(
          (n): n is PartNode =>
            n.type === "part" && isPointInsideNode(position, n)
        );

      if (partNodeToInsertImpression) {
        insertImpressionToPart(
          node as ImpressionNode,
          node.id,
          partNodeToInsertImpression.id,
          node?.type as ImpressionType
        );
      }
    },
    [deleteNode, insertImpressionToPart, nodes, screenToFlowPosition]
  );

  return {
    addPartToConflict,
    createNode,
    edges,
    handleNodeDragStop,
    handlePaneClick,
    nodes,
    setNodes,
    onNodesChange,
    removePartFromConflict,
    getNodes,
    deleteNode,
    onConnect,
    onDragOver,
    onDrop,
    onEdgeChange,
    updateNode,
    detachImpressionFromPart,
    insertImpressionToPart,
    updateConflictDescription,
  };
};
