import { useQuery } from "@tanstack/react-query";

export const useLoadMap = (mapId: string) => {
  return useQuery({
    queryKey: ["map", mapId],
    queryFn: async () => {
      const res = await fetch(`/api/maps/${mapId}`);
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to load map: ${res.status} ${res.statusText} - ${errorText}`);
      }
      
      const data = await res.json();
      return data;
    },
    staleTime: 0, // Always fetch fresh data
    gcTime: 0, // Don't cache data
    enabled: !!mapId, // Only run if mapId exists
  });
};
