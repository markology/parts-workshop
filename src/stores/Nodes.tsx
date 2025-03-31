// import { create } from "zustand";
// import { ImpressionNode, PartNode } from "@/types/Nodes";

// // Union type for React Flow nodes
// type Node = PartNode | ImpressionNode;

// type NodeStore = {
//   nodes: {
//     parts: PartNode[];
//     impressions: ImpressionNode[];
//   };
//   savedNodes: Node[];
//   addImpressionNode: (impressionNode: ImpressionNode) => void;
//   removeImpressionNode: (id: string) => void;
//   addPartNode: (partNode: PartNode) => void;
//   removePartNode: (id: string) => void;
//   saveNodes: (nodes: Node[]) => void;
//   clearSavedNodes: () => void;
//   getSavedNodes: () => Node[];
// };

// export const useNodeStore = create<NodeStore>((set, get) => ({
//   nodes: { parts: [], impressions: [] },
//   savedNodes: [],

//   addImpressionNode: (impressionNode) =>
//     set((state) => ({
//       nodes: {
//         ...state.nodes,
//         impressions: [...state.nodes.impressions, impressionNode],
//       },
//     })),

//   removeImpressionNode: (id) =>
//     set((state) => ({
//       nodes: {
//         ...state.nodes,
//         impressions: state.nodes.impressions.filter((node) => node.id !== id),
//       },
//     })),

//   addPartNode: (partNode) =>
//     set((state) => ({
//       nodes: {
//         ...state.nodes,
//         parts: [...state.nodes.parts, partNode],
//       },
//     })),

//   removePartNode: (id) =>
//     set((state) => ({
//       nodes: {
//         ...state.nodes,
//         parts: state.nodes.parts.filter((node) => node.id !== id),
//       },
//     })),

//   saveNodes: (nodes: Node[]) => set({ savedNodes: nodes }),
//   clearSavedNodes: () => set({ savedNodes: [] }),
//   getSavedNodes: () => get().savedNodes,
// }));
