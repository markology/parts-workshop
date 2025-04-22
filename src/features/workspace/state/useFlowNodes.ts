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
  PartNodeData,
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
import { Map as MapType } from "@/types/api/map";

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

export const useFlowNodes = (map?: MapType) => {
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
  const setContextMenuParentNodeId = useUIStore(
    (s) => s.setContextMenuParentNodeId
  );
  const setIsEditing = useUIStore((s) => s.setIsEditing);

  useEffect(() => {
    populateImpressions(
      map?.sidebarImpressions && "thoughts" in map.sidebarImpressions
        ? map.sidebarImpressions
        : undefined
    );
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

  // PART UPDATES

  const updatePartName = (partId: string, partName: string) => {
    updateNode<PartNodeData>(partId, {
      data: {
        label: partName,
      },
    });
    updateConflictConnectedNodesPartName(partId, partName);
  };

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

  function isConflictNode(node: WorkshopNode): node is ConflictNode {
    return node.type === "conflict" && "connectedNodes" in node.data;
  }

  const updateConflictConnectedNodesPartName = (
    partId: string,
    partName: string
  ) => {
    setNodes((prev) => {
      const conflictNodesContainingPartId: ConflictNode[] = prev.filter(
        (node): node is ConflictNode =>
          isConflictNode(node) &&
          node.data.connectedNodes.some(
            (connectedNode) => connectedNode.part.id === partId
          )
      );

      const remappedConflictNodes: ConflictNode[] =
        conflictNodesContainingPartId.map((conflictNode) => {
          const connectedNodes = conflictNode.data.connectedNodes;
          const updatedConnectedNodes = connectedNodes.map(
            (connectedNode: ConnectedNodeType) => {
              if (connectedNode.part.id === partId) {
                return {
                  ...connectedNode,
                  part: {
                    ...connectedNode.part,
                    data: {
                      ...connectedNode.part.data,
                      label: partName,
                    },
                  },
                };
              }

              return connectedNode;
            }
          );

          return {
            ...conflictNode,
            data: {
              ...conflictNode.data,
              connectedNodes: updatedConnectedNodes,
            },
          };
        });

      const remappedMap = new Map(remappedConflictNodes.map((n) => [n.id, n]));

      const newNodes = prev.map((node) =>
        remappedMap.has(node.id) ? remappedMap.get(node.id)! : node
      );

      return newNodes;
    });
  };

  const removePartFromAllConflicts = useCallback(
    (partId: string) => {
      setNodes((prev) => {
        const conflictNodesContainingPartId: ConflictNode[] = prev.filter(
          (node): node is ConflictNode =>
            isConflictNode(node) &&
            node.data.connectedNodes.some(
              (connectedNode) => connectedNode.part.id === partId
            )
        );

        const remappedConflictNodes: ConflictNode[] =
          conflictNodesContainingPartId.map((conflictNode) => {
            const connectedNodes = conflictNode.data.connectedNodes;
            const updatedConnectedNodes = connectedNodes.filter(
              (connectedNode: ConnectedNodeType) =>
                connectedNode.part.id !== partId
            );

            return {
              ...conflictNode,
              data: {
                ...conflictNode.data,
                connectedNodes: updatedConnectedNodes,
              },
            };
          });

        const remappedMap = new Map(
          remappedConflictNodes.map((n) => [n.id, n])
        );

        const newNodes = prev.map((node) =>
          remappedMap.has(node.id) ? remappedMap.get(node.id)! : node
        );

        return newNodes;
      });
    },
    [setNodes]
  );

  const deleteEdges = useCallback(
    (nodeId: string) => {
      setEdges((prev) => {
        return prev.filter(
          (edge) => edge.source !== nodeId && edge.target !== nodeId
        );
      });
    },
    [setEdges]
  );

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
    },
    [
      activeSidebarNode,
      screenToFlowPosition,
      nodes,
      insertImpressionToPart,
      setNodes,
    ]
  );

  const handlePaneClick = () => {
    setContextMenuParentNodeId("");
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
          if (node.type === "part") removePartFromAllConflicts(node.id);
          if (node.type === "part" || node.type === "conflict")
            deleteEdges(node.id);
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
    [
      deleteEdges,
      deleteNode,
      insertImpressionToPart,
      nodes,
      removePartFromAllConflicts,
      screenToFlowPosition,
    ]
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
    deleteEdges,
    deleteNode,
    onConnect,
    onDragOver,
    onDrop,
    onEdgeChange,
    updateNode,
    updatePartName,
    detachImpressionFromPart,
    insertImpressionToPart,
    removePartFromAllConflicts,
    updateConflictDescription,
  };
};
