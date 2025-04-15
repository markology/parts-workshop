// import { SerializedMap, HydratedMap } from "@/types/api/map";
// import { WorkshopNode } from "@/types/Nodes";
// import { Edge } from "@xyflow/react";

// export function hydrateMap(raw: SerializedMap): HydratedMap {
//   console.log("hydrating map", raw);
//   return {
//     ...raw,
//     nodes: safeParse<WorkshopNode[]>(raw.nodes),
//     edges: safeParse<Edge[]>(raw.edges),
//     sidebarImpressions: safeParse<any[]>(raw.sidebarImpressions),
//   };
// }

// function safeParse<T>(value: string): T {
//   try {
//     return JSON.parse(value);
//   } catch (err) {
//     console.warn("Failed to parse", value);
//     return [] as unknown as T;
//   }
// }
