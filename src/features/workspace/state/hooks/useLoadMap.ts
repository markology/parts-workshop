import { useQuery } from "@tanstack/react-query";

export const useLoadMap = (mapId: string) => {
  console.log("🔄 useLoadMap called with mapId:", mapId);
  
  return useQuery({
    queryKey: ["map", mapId],
    queryFn: async () => {
      console.log("📡 Fetching map from API for mapId:", mapId);
      const res = await fetch(`/api/maps/${mapId}`);
      console.log("📡 API response status:", res.status, res.ok);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error("❌ API Error:", {
          status: res.status,
          statusText: res.statusText,
          errorText,
          mapId,
          url: `/api/maps/${mapId}`
        });
        throw new Error(`Failed to load map: ${res.status} ${res.statusText} - ${errorText}`);
      }
      
      const data = await res.json();
      console.log("📡 Received map data for mapId:", mapId, "with", data.nodes?.length || 0, "nodes");
      return data;
    },
    staleTime: 0, // Always fetch fresh data
    gcTime: 0, // Don't cache data
    enabled: !!mapId, // Only run if mapId exists
  });
};
