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
} from "@xyflow/react";
import { useCallback, useRef } from "react";
import { NodeStateType } from "@/app/page";
import { nodeTypes } from "./Nodes/NodeManager";
import { SideBarItem } from "./SideBar/SideBar";

let id = 0;
const getId = () => `pwnode_${id++}`;

const Workspace = ({
  activeSideBarNode,
  nodes,
  setNodes,
  onNodesChange,
}: {
  activeSideBarNode: SideBarItem | null;
} & NodeStateType) => {
  const reactFlowWrapper = useRef(null);
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

      const { type, label } = activeSideBarNode;
      const data: { label: string; connectedNodeIds?: string[] } = { label };
      if (type === "conflict") {
        data.connectedNodeIds = [];
      }
      const newNode = {
        id: getId(),
        type,
        position,
        data: { label },
        style: {
          backgroundColor: "transparent",
          border: "none",
          boxShadow: "none",
          ...(activeSideBarNode.type === "part" ? { zIndex: -1 } : {}),
        },
      };

      setNodes((nds: Node[]) => nds.concat(newNode));
    },
    [screenToFlowPosition, activeSideBarNode]
  );

  return (
    <div className="reactflow-wrapper" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange as OnNodesChange<Node>}
        onEdgesChange={onEdgesChange}
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
    </div>
  );
};

export default Workspace;
