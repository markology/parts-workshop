"use client";

import {
  ReactFlow,
  Controls,
  Background,
  BackgroundVariant,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  type Node,
  type Edge,
  //   type FitViewOptions,
  //   type OnConnect,
  //   type OnNodesChange,
  //   type OnEdgesChange,
  //   type OnNodeDrag,
  //   type NodeTypes,
  //   type DefaultEdgeOptions,
  NodeChange,
  EdgeChange,
  useReactFlow,
  useNodesState,
  useEdgesState,
} from "@xyflow/react";
import { useRef, useState } from "react";
import { useDrag, useDrop } from "react-dnd";

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

type HeapItem = {
  id: string;
  label: string;
};

interface ConnectParams {
  source: string;
  sourceHandle: string | null;
  target: string;
  targetHandle: string | null;
}

function Sidebar({
  selectedNode,
  onUpdateNode,
}: {
  selectedNode: Node | null;
  onUpdateNode: ({ id, label }: HeapItem) => void;
}) {
  const [items, setItems] = useState<HeapItem[]>([]);
  const [traitInput, setTraitInput] = useState<string>("");

  // Move useDrag inside a separate component for each item
  const DraggableItem = ({ item }: { item: HeapItem }) => {
    const [{ isDragging }, drag] = useDrag(() => ({
      type: "newNode",
      item: { type: "newNode", label: item.label }, // Pass the item label
      collect: (monitor) => ({ isDragging: !!monitor.isDragging() }),
    }));

    const ref = useRef<HTMLLIElement | null>(null);
    drag(ref);
    return (
      <li
        ref={ref}
        className={`p-2 bg-gray-200 ${isDragging ? "opacity-50" : ""}`}
      >
        {item.label}
      </li>
    );
  };

  const handleTraitSubmit = (e: { key: string }) => {
    if (e.key === "Enter") {
      setItems([...items, { id: `${Date.now()}`, label: traitInput }]);
      setTraitInput("");
    }
  };

  return (
    <div className="w-64 p-4 border-r">
      <input
        type="text"
        onChange={(e) => setTraitInput(e.target.value)}
        value={traitInput}
        onKeyDown={handleTraitSubmit}
      />
      <h3 className="font-bold mb-2">Unlabeled Impressions</h3>
      <ul className="space-y-2">
        {items.map((item, idx) => (
          <DraggableItem key={idx} item={item} />
        ))}
      </ul>
      {/* {selectedNode && (
        <div className="mt-4">
          <h3 className="font-bold">
            Edit Node: {String(selectedNode?.data?.label)}
          </h3>
          <input
            type="text"
            value={String(selectedNode.data.label)}
            onChange={(e) =>
              onUpdateNode({ id: selectedNode.id, label: e.target.value })
            }
            className="w-full p-2 border rounded mt-2"
          />
        </div>
      )} */}
    </div>
  );
}

export default function Workspace() {
  const [nodes, setNodes] = useNodesState(initialNodes);
  const [edges, setEdges] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  const onNodesChange = (changes: NodeChange<Node>[]) =>
    setNodes((nds) => applyNodeChanges(changes, nds));
  const onEdgesChange = (changes: EdgeChange<Edge>[]) =>
    setEdges((eds) => applyEdgeChanges(changes, eds));
  const onConnect = (params: ConnectParams) =>
    setEdges((eds: Edge[]) => addEdge(params, eds));

  const { screenToFlowPosition } = useReactFlow(); // Access React Flow utilities
  const ref = useRef<HTMLDivElement | null>(null);

  const [, drop] = useDrop(() => ({
    accept: "newNode",
    drop: (item, monitor) => {
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;

      // Convert screen coordinates to flow coordinates
      const flowPosition = screenToFlowPosition({
        x: 400,
        y: 400,
      });

      const newNode = {
        id: `${Date.now()}`,
        type: "default",
        data: { label: item.label },
        position: flowPosition,
      };

      setNodes((nds) => [...nds, newNode]);
    },
  }));

  drop(ref);

  const updateNode = ({ id, label }: HeapItem) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === id ? { ...node, data: { ...node.data, label } } : node
      )
    );
  };

  return (
    <div style={{ width: "100%", display: "flex" }}>
      <Sidebar selectedNode={selectedNode} onUpdateNode={updateNode} />
      <div ref={ref} style={{ flex: 1, height: 800 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={(event, node) => setSelectedNode(node)}
          style={{ width: "100%", height: "100%" }}
          panOnDrag={false}
        >
          <Controls />
          <Background color="red" variant={BackgroundVariant.Dots} />
        </ReactFlow>
      </div>
    </div>
  );
}
