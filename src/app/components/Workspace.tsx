"use client";

import {
  ReactFlow,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  useReactFlow,
  Background,
  Edge,
  Connection,
  Node,
} from "@xyflow/react";
import { useCallback, useRef } from "react";
import { nodeTypes } from "./WorkshopNode";
import { SideBarItem } from "./SideBar/SideBar";

let id = 0;
const getId = () => `pwnode_${id++}`;

const Workspace = ({
  activeSideBarNode,
}: {
  activeSideBarNode: SideBarItem | null;
}) => {
  const reactFlowWrapper = useRef(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const { screenToFlowPosition } = useReactFlow();
  // const {user} = useWorkshopContext();

  const onConnect = useCallback(
    (params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)),
    []
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

  const onDrop = useCallback(
    (event: {
      preventDefault: () => void;
      clientX: number;
      clientY: number;
    }) => {
      event.preventDefault();

      // check if the dropped element is valid
      if (!activeSideBarNode?.type) {
        return;
      }

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode = {
        id: getId(),
        type: activeSideBarNode.type,
        position,
        data: { label: activeSideBarNode.label },
        style: {
          backgroundColor: "transparent",
          border: "none",
          boxShadow: "none",
          ...(activeSideBarNode.type === "part" ? { zIndex: -1 } : {}),
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [screenToFlowPosition, activeSideBarNode]
  );

  return (
    <div
      className="reactflow-wrapper"
      style={{ height: "100vh", width: "80vh" }}
      ref={reactFlowWrapper}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        fitView
        nodeTypes={nodeTypes}
      >
        <Controls />
        <Background />
      </ReactFlow>
    </div>
  );
};

export default Workspace;
