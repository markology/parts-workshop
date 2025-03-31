"use client";

import {
  ReactFlow,
  addEdge,
  useEdgesState,
  Controls,
  useReactFlow,
  Background,
  Edge,
  Connection,
  Node,
  OnNodesChange,
  XYPosition,
} from "@xyflow/react";
import { useCallback, useRef } from "react";
import { nodeTypes } from "@/components/Nodes/NodeManager";
import { useFlowNodesContext } from "@/context/FlowNodesContext";
import { useSidebarStore } from "@/stores/Sidebar";
import { ImpressionNode, PartNode } from "@/types/Nodes";
import { PartDataLabels } from "@/constants/Nodes";
import TrashCan from "./TrashCan";
import { ImpressionType } from "@/types/Impressions";

let id = 0;
const getId = () => `pwnode_${id++}`;

const Workspace = () => {
  const reactFlowWrapper = useRef(null);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const { screenToFlowPosition } = useReactFlow();
  const { setNodes, nodes, onNodesChange } = useFlowNodesContext();
  const activeSidebarNode = useSidebarStore((s) => s.activeSidebarNode);
  const removeImpression = useSidebarStore((s) => s.removeImpression);
  const onConnect = useCallback(
    (params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)),
    []
  );

  const onDragOver = useCallback(
    (event: {
      preventDefault: () => void;
      dataTransfer: { dropEffect: string };
    }) => {
      console.log("onDragOver");

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
          setNodes((prev) => prev.filter((n) => n.id !== node.id));
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
            n.type === "part" && isPointInsideNode(position, node)
        );

      console.log(partNodeToInsertImpression, nodes);

      if (partNodeToInsertImpression) {
        setNodes((prevNodes) => {
          return prevNodes.reduce((acc: Node[], n) => {
            if (n.id === node.id) return acc;
            if (n.id === partNodeToInsertImpression.id) {
              // const partDataLabelKey = node.type as keyof typeof PartDataLabels;
              const partDataLabel = PartDataLabels[node.type as ImpressionType];
              // Clone the part node and safely add the impression node
              const updatedPartNode = {
                ...n,
                data: {
                  ...n.data,
                  [partDataLabel]: [
                    ...((n.data[partDataLabel] as ImpressionNode[]) || []),
                    node,
                  ],
                },
              };

              console.log(updatedPartNode);

              acc.push(updatedPartNode);
            } else acc.push(n);
            return acc;
          }, []);
        });
      }
    },
    [nodes, setNodes]
  );

  function isPointInsideNode(position: XYPosition, node: Node): boolean {
    console.log("isPointInsideNode");

    if (node?.measured?.width == null || node?.measured?.height == null)
      return false;

    return (
      position.x >= node.position.x &&
      position.x <= node.position.x + node.measured.width &&
      position.y >= node.position.y &&
      position.y <= node.position.y + node.measured.height
    );
  }

  const onDrop = useCallback(
    (event: {
      preventDefault: () => void;
      clientX: number;
      clientY: number;
    }) => {
      console.log("onDrop");

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
      removeImpression(type, id);

      const newNode = {
        id: getId(),
        type,
        position,
        hidden: !!partNodeToInsertImpression,
        data: {
          label,
          parentNode: partNodeToInsertImpression || null,
          reactFlowWrapper,
        },
        style: {
          backgroundColor: "transparent",
          border: "none",
          boxShadow: "none",
        },
      };

      setNodes((nds: Node[]) => {
        const updatedNodes = [...nds];
        console.log("esetting node", partNodeToInsertImpression);

        if (partNodeToInsertImpression) {
          // i dont like this strung together typescript
          const partDataLabelKey = type as keyof typeof PartDataLabels;
          const partDataLabel = PartDataLabels[partDataLabelKey];
          console.log(partDataLabel);
          if (
            partDataLabel &&
            Array.isArray(partNodeToInsertImpression.data[partDataLabel])
          ) {
            console.log("made it to here");
            // 1. Find the index of the part node
            const index = updatedNodes.findIndex(
              (node) => node.id === partNodeToInsertImpression.id
            );

            if (index !== -1) {
              // 2. Clone the part node and mutate its data
              const updatedPartNode = {
                ...partNodeToInsertImpression,
                data: {
                  ...partNodeToInsertImpression.data,
                  [partDataLabel]: [
                    ...partNodeToInsertImpression.data[partDataLabel],
                    newNode,
                  ],
                },
              };

              // 3. Replace the original part node in the array
              updatedNodes[index] = updatedPartNode;
              console.log("here");
              // 4. Don't add newNode separately
              return updatedNodes;
            }
          }
        }

        // Default: add newNode normally
        return [...updatedNodes, newNode];
      });
    },
    [screenToFlowPosition, activeSidebarNode]
  );

  return (
    <div className="reactflow-wrapper" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange as OnNodesChange<Node>}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={handleNodeDragStop}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        fitView
        nodeTypes={nodeTypes}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        style={{
          height: "4000px",
          width: "4000px",
        }}
        minZoom={0}
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
