"use client";

import { nodeTypes } from "@/components/Nodes/NodeManager";
import { useFlowNodesContext } from "@/context/FlowNodesContext";
import { useSidebarStore } from "@/stores/Sidebar";
import { useUIStore } from "@/stores/UI";
import { ImpressionType } from "@/types/Impressions";
import { ConflictNode, ImpressionNode, PartNode } from "@/types/Nodes";
import {
  Background,
  Connection,
  Controls,
  Edge,
  EdgeChange,
  Node,
  OnNodesChange,
  ReactFlow,
  XYPosition,
  addEdge,
  useEdgesState,
  useReactFlow,
} from "@xyflow/react";
import { useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import TrashCan from "./TrashCan";

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

const Workspace = () => {
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const { getEdge, getNode, screenToFlowPosition } = useReactFlow();
  const {
    addPartToConflict,
    deleteNode,
    insertImpressionToPart,
    nodes,
    onNodesChange,
    setNodes,
    removePartFromConflict,
  } = useFlowNodesContext();
  const activeSidebarNode = useSidebarStore((s) => s.activeSidebarNode);
  const removeImpression = useSidebarStore((s) => s.removeImpression);
  const setRightClickMenuOpen = useUIStore((s) => s.setRightClickMenuOpen);

  const handlePaneClick = () => {
    setRightClickMenuOpen(false);
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
    (params: Edge | Connection) => {
      const partNode = getNode(params.source) as PartNode;
      const conflictNode = getNode(params.target) as ConflictNode;
      if (partNode && conflictNode) addPartToConflict(conflictNode, partNode);
      else return;

      setEdges((eds) => addEdge(params, eds));
    },
    [addPartToConflict, getNode, setEdges]
  );

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
        label, // Add label property here to satisfy BaseNodeData
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

      //   if (partNodeToInsertImpression) {
      //     // i dont like this strung together typescript
      //     const partDataLabelKey = type as keyof typeof PartDataLabels;
      //     const partDataLabel = PartDataLabels[partDataLabelKey];
      //     console.log(partDataLabel);
      //     if (
      //       partDataLabel &&
      //       Array.isArray(partNodeToInsertImpression.data[partDataLabel])
      //     ) {
      //       console.log("made it to here");
      //       // 1. Find the index of the part node
      //       const index = updatedNodes.findIndex(
      //         (node) => node.id === partNodeToInsertImpression.id
      //       );

      //       if (index !== -1) {
      //         // 2. Clone the part node and mutate its data
      //         const updatedPartNode = {
      //           ...partNodeToInsertImpression,
      //           data: {
      //             ...partNodeToInsertImpression.data,
      //             [partDataLabel]: [
      //               ...partNodeToInsertImpression.data[partDataLabel],
      //               newNode,
      //             ],
      //           },
      //         };

      //         // 3. Replace the original part node in the array
      //         updatedNodes[index] = updatedPartNode;
      //         console.log("here");
      //         // 4. Don't add newNode separately
      //         return updatedNodes;
      //       }
      //     }
      //   }

      //   // Default: add newNode normally
      //   return [...updatedNodes, newNode];
      // });
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

  return (
    <div className="reactflow-wrapper">
      <ReactFlow
        className="h-[4000px] w-[4000px]"
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange as OnNodesChange<Node>}
        onEdgesChange={onEdgeChange}
        onNodeDragStop={handleNodeDragStop}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        fitView
        onPaneClick={handlePaneClick}
        nodeTypes={nodeTypes}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        minZoom={0}
        deleteKeyCode="Delete"
        maxZoom={2}
      >
        <Background />
        <Controls className="absolute bottom-4 left-4" />
      </ReactFlow>
      <TrashCan />
    </div>
  );
};

export default Workspace;
