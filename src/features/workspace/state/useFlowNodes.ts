"use client";

import { useUIStore } from "@/features/workspace/state/stores/UI";
import { useCallback, useEffect, useRef } from "react";
import createNodeFN from "./updaters/createNode";
import detachImpressionFromPartCB from "./updaters/detachImpressionFromPart";
import insertImpressionToPartCB from "./updaters/insertImpressionToPart";
import updateNodeCB from "./updaters/updateNode";

import { useSidebarStore } from "@/features/workspace/state/stores/Sidebar";
import { useWorkingStore } from "@/features/workspace/state/stores/useWorkingStore";
import { ImpressionType } from "@/features/workspace/types/Impressions";
import {
  TensionNode,
  ConnectedNodeType,
  ImpressionNode,
  NodeType,
  PartNode,
  PartNodeData,
  WorkshopNode,
} from "@/features/workspace/types/Nodes";
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
import { useDeleteJournalEntry } from "@/features/workspace/state/hooks/useDeleteJournalEntry";

export type NodeActions = ReturnType<typeof useFlowNodes>;

const requestIdle = (cb: IdleRequestCallback): number => {
  return typeof window !== "undefined" && "requestIdleCallback" in window
    ? requestIdleCallback(cb)
    : (setTimeout(
        () => cb({ didTimeout: false, timeRemaining: () => 0 } as IdleDeadline),
        1
      ) as unknown as number);
};

const cancelIdle = (id: number) => {
  if (typeof window !== "undefined" && "cancelIdleCallback" in window) {
    cancelIdleCallback(id);
  } else {
    clearTimeout(id);
  }
};

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
// add and remove tensions
// update, delete and create new nodes
// update part title / needs
// update tension descriptions
// add / remove impressions from parts
// return impressions to sidebar
// move impressions from sidebar to canvas
// handle various events on ReactFlow

// manages interactivity of flow nodes state and canvas

export const useFlowNodes = () => {
  const initialNodes = useWorkingStore.getState().nodes;
  const initialEdges = useWorkingStore.getState().edges;

  const [nodes, setNodes, onNodesChange] = useNodesState<WorkshopNode>(
    initialNodes || []
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(
    initialEdges || []
  );
  const { getViewport, setCenter, getEdge, getNode, screenToFlowPosition } =
    useReactFlow();
  const getNodes = useRef(() => nodes);
  const { mutate: deleteJournalEntry } = useDeleteJournalEntry();

  const activeSidebarNode = useSidebarStore((s) => s.activeSidebarNode);

  const setContextMenuParentNodeId = useUIStore(
    (s) => s.setContextMenuParentNodeId
  );
  const setIsEditing = useUIStore((s) => s.setIsEditing);

  useEffect(() => {
    getNodes.current = () => nodes;
  }, [nodes]);

  useEffect(() => {
    const handle = requestIdle(() => {
      useWorkingStore.getState().setState({ nodes });
    });

    return () => cancelIdle(handle);
  }, [nodes]);

  useEffect(() => {
    const handle = requestIdle(() => {
      useWorkingStore.getState().setState({ edges });
    });

    return () => cancelIdle(handle);
  }, [edges]);

  // GENERAL NODE MANAGENT

  // Memoize createNode to prevent unnecessary re-renders in components that only need this function
  const createNode = useCallback((
    type: NodeType,
    label: string,
    impressionType?: ImpressionType,
    position?: XYPosition,
    style?: unknown
  ) => {
    const viewport = getViewport();
    const currentNodes = getNodes.current ? getNodes.current() : [];

    const paddingX = 220;
    let rightmostX = -Infinity;
    let rightmostY = viewport && typeof viewport.y === "number" ? viewport.y : 0;
    let rightmostNodeFound = false;

    currentNodes.forEach((n) => {
      const width = (n as any)?.measured?.width ?? (n as any)?.width ?? 0;
      const candidateX = n.position.x + width;
      if (candidateX > rightmostX) {
        rightmostX = candidateX;
        rightmostY = n.position.y;
        rightmostNodeFound = true;
      }
    });

    const fallbackX =
      viewport && typeof viewport.x === "number" ? viewport.x : 0;
    const fallbackY =
      viewport && typeof viewport.y === "number" ? viewport.y : 0;

    const defaultPosition =
      position ||
      (rightmostNodeFound
        ? { x: rightmostX + paddingX, y: rightmostY }
        : { x: fallbackX, y: fallbackY });
    
    const newNode = createNodeFN({
      type,
      position: position || defaultPosition,
      label,
      impressionType,
      style,
    });
    setNodes((prev: WorkshopNode[]) => [...prev, newNode]);
    const offsets: Record<NodeType, Record<string, number>> = {
      tension: {
        x: 200,
        y: 100,
      },
      interaction: {
        x: 200,
        y: 100,
      },
      relationship: {
        x: 200,
        y: 100,
      },
      part: {
        x: 500,
        y: 300,
      },
      impression: {
        x: 40,
        y: 20,
      },
    };
    setTimeout(() => {
      setCenter(
        newNode.position.x + offsets[type].x,
        newNode.position.y + offsets[type].y,
        {
          zoom: type === "relationship" ? 1.0 : 0.6,
          duration: 500,
        }
      );
    }, 0);
    
    return newNode;
  }, [setNodes, getViewport, setCenter]);

  const deleteNode = useCallback(
    (id: string) => {
      setNodes((prev) => prev.filter((n) => n.id !== id));
      deleteJournalEntry({ nodeId: id });
    },
    [deleteJournalEntry, setNodes]
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
        name: partName,
      },
    });
    updateTensionConnectedNodesPartName(partId, partName);
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

  // TENSIONS

  const addPartToTension = useCallback(
    (tension: TensionNode, part: PartNode) => {
      updateNode(tension.id, {
        data: {
          ...tension.data,
          connectedNodes: [
            ...((tension.data.connectedNodes as ConnectedNodeType[]) || []),
            { part, tensionDescription: "" },
          ],
        },
      });
    },
    [updateNode]
  );

  const removePartFromTension = useCallback(
    (tension: TensionNode, partId: string) => {
      updateNode(tension.id, {
        data: {
          ...tension.data,
          connectedNodes: (
            tension.data.connectedNodes as ConnectedNodeType[]
          ).filter((cn) => cn.part.id !== partId),
        },
      });
    },
    [updateNode]
  );

  const updateTensionDescription = (
    tension: TensionNode,
    connectedNodeId: string,
    tensionDescription: string
  ) => {
    const newConnectedNodes = (
      tension.data.connectedNodes as ConnectedNodeType[]
    ).reduce<ConnectedNodeType[]>((acc, connectedNode: ConnectedNodeType) => {
      if (connectedNode.part.id === connectedNodeId)
        connectedNode.tensionDescription = tensionDescription;
      acc.push(connectedNode);
      return acc;
    }, []);

    updateNode(tension.id, {
      data: {
        ...tension.data,
        connectedNodes: newConnectedNodes,
      },
    });
  };


  function isTensionNode(node: WorkshopNode): node is TensionNode {
    return (node.type === "tension" || node.type === "interaction") && "connectedNodes" in node.data;
  }

  const updateTensionConnectedNodesPartName = (
    partId: string,
    partName: string
  ) => {
    setNodes((prev) => {
      const tensionNodesContainingPartId: TensionNode[] = prev.filter(
        (node): node is TensionNode =>
          isTensionNode(node) &&
          node.data.connectedNodes.some(
            (connectedNode) => connectedNode.part.id === partId
          )
      );

      const remappedTensionNodes: TensionNode[] =
        tensionNodesContainingPartId.map((tensionNode) => {
          const connectedNodes = tensionNode.data.connectedNodes;
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
            ...tensionNode,
            data: {
              ...tensionNode.data,
              connectedNodes: updatedConnectedNodes,
            },
          };
        });

      const remappedMap = new Map(remappedTensionNodes.map((n) => [n.id, n]));

      const newNodes = prev.map((node) =>
        remappedMap.has(node.id) ? remappedMap.get(node.id)! : node
      );

      return newNodes;
    });
  };

  const removePartFromAllTensions = useCallback(
    (partId: string) => {
      setNodes((prev) => {
        const tensionNodesContainingPartId: TensionNode[] = prev.filter(
          (node): node is TensionNode =>
            isTensionNode(node) &&
            node.data.connectedNodes.some(
              (connectedNode) => connectedNode.part.id === partId
            )
        );

        const remappedTensionNodes: TensionNode[] =
          tensionNodesContainingPartId.map((tensionNode) => {
            const connectedNodes = tensionNode.data.connectedNodes;
            const updatedConnectedNodes = connectedNodes.filter(
              (connectedNode: ConnectedNodeType) =>
                connectedNode.part.id !== partId
            );

            return {
              ...tensionNode,
              data: {
                ...tensionNode.data,
                connectedNodes: updatedConnectedNodes,
              },
            };
          });

        const remappedMap = new Map(
          remappedTensionNodes.map((n) => [n.id, n])
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
    (event: React.DragEvent) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
    },
    []
  );

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      // Check if this is a canvas impression being dropped (should go to sidebar, not canvas)
      if (event.dataTransfer.types.includes("parts-workshop/canvas-impression")) {
        // Check if drop coordinates are over the sidebar using elementFromPoint
        const elementAtPoint = document.elementFromPoint(event.clientX, event.clientY);
        const sidebarElement = elementAtPoint?.closest('#impression-dropdown-container') || 
                               document.getElementById("impression-dropdown-container");
        
        if (sidebarElement) {
          // The drop is over the sidebar - handle it directly
          try {
            const data = event.dataTransfer.getData("parts-workshop/canvas-impression");
            if (data) {
              const parsed = JSON.parse(data) as { id: string; type: ImpressionType; label: string };
              
              // Add impression back to sidebar
              useWorkingStore.getState().addImpression({
                id: parsed.id,
                type: parsed.type,
                label: parsed.label,
              });

              // Delete the node from canvas
              deleteNode(parsed.id);
            }
          } catch (error) {
            console.error("Failed to handle canvas impression drop:", error);
          }
          
          // Don't handle it further in React Flow
          return;
        }
        
        // If dropping on canvas but it's a canvas impression, don't handle it
        // Canvas impressions should only go back to sidebar
        return;
      }

      event.preventDefault();

      console.log('Drop event fired', { 
        activeSidebarNode, 
        dataTransferTypes: Array.from(event.dataTransfer.types),
        clientX: event.clientX,
        clientY: event.clientY
      });

      // Try to get impression data from activeSidebarNode first, then fallback to dataTransfer
      let impressionData: { id: string; type: ImpressionType; label: string } | null = null;

      if (activeSidebarNode?.type) {
        console.log('Using activeSidebarNode:', activeSidebarNode);
        impressionData = {
          id: activeSidebarNode.id,
          type: activeSidebarNode.type,
          label: activeSidebarNode.label,
        };
      } else {
        // Fallback: read from dataTransfer
        const data = event.dataTransfer.getData("parts-workshop/sidebar-impression");
        console.log('Trying dataTransfer fallback:', data);
        if (data) {
          try {
            const parsed = JSON.parse(data) as { type: ImpressionType; id: string };
            const impressions = useWorkingStore.getState().sidebarImpressions;
            const impression = impressions[parsed.type]?.[parsed.id];
            if (impression) {
              impressionData = {
                id: impression.id,
                type: impression.type,
                label: impression.label,
              };
              console.log('Found impression from dataTransfer:', impressionData);
            }
          } catch (e) {
            console.error("Failed to parse drag data:", e);
            return;
          }
        }
      }

      // check if the dropped element is valid
      if (!impressionData) {
        console.warn('No impression data found, drop cancelled');
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
      const { id, type, label } = impressionData;

      const newNode: ImpressionNode = {
        id: uuidv4(),
        type,
        position,
        hidden: !!partNodeToInsertImpression,
        data: {
          label, // Ensure label is included
          parentNodeId: partNodeToInsertImpression?.id || null,
        },
        style: {
          backgroundColor: "transparent",
          border: "none",
          borderRadius: 5,
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

      // Remove the impression from sidebar after successful drop
      useWorkingStore.getState().removeImpression({ type, id });
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
            const tensionNode = getNode(target);
            if (
              change.type === "remove" &&
              "connectedNodes" in (tensionNode?.data ?? {})
            ) {
              removePartFromTension(tensionNode as TensionNode, source);
            }
          }
        }
      });
      // // Apply other edge changes (e.g., position updates)
      onEdgesChange(changes);
    },
    [getEdge, getNode, onEdgesChange, removePartFromTension]
  );

  const onConnect = useCallback(
    (params: Connection) => {
      const partNode = getNode(params.source) as PartNode;
      const tensionNode = getNode(params.target) as TensionNode;
      if (
        tensionNode.data.connectedNodes.find(
          (connectedPartNode) => connectedPartNode.part.id === partNode.id
        )
      )
        return;
      if (partNode && tensionNode) addPartToTension(tensionNode, partNode);
      else return;

      const newParams = {
        ...params,
        sourceHandle: params.sourceHandle,
        targetHandle: params.targetHandle,
        data: {
          relationshipType: tensionNode.data.relationshipType || "tension",
        },
      };

      setEdges((eds) => addEdge(newParams, eds));
    },
    [addPartToTension, getNode, setEdges]
  );

  const snapToGrid = (position: XYPosition, gridSize: number = 32): XYPosition => {
    return {
      x: Math.round(position.x / gridSize) * gridSize,
      y: Math.round(position.y / gridSize) * gridSize,
    };
  };

  const handleNodeDrag = useCallback(
    (event: React.MouseEvent, node: Node) => {
      // Check if Shift key is pressed
      if (event.shiftKey) {
        const currentPosition = node.position;
        const snappedPosition = snapToGrid(currentPosition, 32);
        
        // Update node position to snapped position
        if (snappedPosition.x !== currentPosition.x || snappedPosition.y !== currentPosition.y) {
          setNodes((nds) =>
            nds.map((n) =>
              n.id === node.id
                ? { ...n, position: snappedPosition }
                : n
            )
          );
        }
      }
    },
    [setNodes]
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
          if (node.type === "part") removePartFromAllTensions(node.id);
          if (node.type === "part" || node.type === "tension" || node.type === "interaction")
            deleteEdges(node.id);
          return;
        }
      }

      // Snap to grid on drag stop if Shift was held
      if (event.shiftKey) {
        const snappedPosition = snapToGrid(node.position, 32);
        setNodes((nds) =>
          nds.map((n) =>
            n.id === node.id ? { ...n, position: snappedPosition } : n
          )
        );
      }

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      if (node.type !== "tension" && node.type !== "interaction" && node.type !== "part") {
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
      }
    },
    [
      deleteEdges,
      deleteNode,
      insertImpressionToPart,
      nodes,
      removePartFromAllTensions,
      screenToFlowPosition,
      setNodes,
    ]
  );

  return {
    addPartToTension,
    createNode,
    edges,
    handleNodeDrag,
    handleNodeDragStop,
    handlePaneClick,
    nodes,
    setNodes,
    onNodesChange,
    removePartFromTension,
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
    removePartFromAllTensions,
    updateTensionDescription,
  };
};
