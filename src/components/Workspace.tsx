"use client";

import {
  ReactFlow,
  Controls,
  Background,
  BackgroundVariant,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
} from "@xyflow/react";
import { useState } from "react";
import { useDrag, useDrop } from "react-dnd";

const initialNodes = [
  {
    id: "1",
    type: "default",
    data: { label: "Protector" },
    position: { x: 250, y: 5 },
  },
];
const initialEdges = [];

function Sidebar({ selectedNode, onUpdateNode }) {
  const [items, setItems] = useState(["Anxiety", "Overwhelm"]);

  const [{ isDragging }, drag] = useDrag(() => ({
    type: "newNode",
    item: { type: "newNode" },
    collect: (monitor) => ({ isDragging: !!monitor.isDragging() }),
  }));

  return (
    <div className="w-64 p-4 border-r">
      <h3 className="font-bold mb-2">Unlabeled Impressions</h3>
      <ul className="space-y-2">
        {items.map((item, idx) => (
          <li
            key={idx}
            ref={drag}
            className={`p-2 bg-gray-200 ${isDragging ? "opacity-50" : ""}`}
          >
            {item}
          </li>
        ))}
      </ul>
      {selectedNode && (
        <div className="mt-4">
          <h3 className="font-bold">Edit Node: {selectedNode.data.label}</h3>
          <input
            type="text"
            value={selectedNode.data.label}
            onChange={(e) => onUpdateNode(selectedNode.id, e.target.value)}
            className="w-full p-2 border rounded mt-2"
          />
        </div>
      )}
    </div>
  );
}

export default function Workspace() {
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);
  const [selectedNode, setSelectedNode] = useState(null);

  const onNodesChange = (changes) => setNodes((nds) => applyNodeChanges(changes, nds));
  const onEdgesChange = (changes) => setEdges((eds) => applyEdgeChanges(changes, eds));
  const onConnect = (params) => setEdges((eds) => addEdge(params, eds));

  const [, drop] = useDrop(() => ({
    accept: "newNode",
    drop: (item, monitor) => {
      const offset = monitor.getClientOffset();
      const newNode = {
        id: `${Date.now()}`,
        type: "default",
        data: { label: "New Part" },
        position: { x: offset.x - 50, y: offset.y - 50 },
      };
      setNodes((nds) => [...nds, newNode]);
    },
  }));

  const updateNode = (id, label) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === id ? { ...node, data: { ...node.data, label } } : node
      )
    );
  };

  return (
    <div ref={drop} style={{ height: "80vh", width: "100%" }}>
      <Sidebar selectedNode={selectedNode} onUpdateNode={updateNode} />
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={(event, node) => setSelectedNode(node)}
      >
        <Controls />
        <Background color="red" variant={BackgroundVariant.Dots} />
      </ReactFlow>
    </div>
  );
}