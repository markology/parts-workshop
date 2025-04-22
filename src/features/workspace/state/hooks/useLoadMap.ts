import { useQuery } from "@tanstack/react-query";

export const useLoadMap = (mapId: string) =>
  useQuery({
    queryKey: ["map", mapId],
    queryFn: async () => {
      console.log("📡 Fetching map from API...");
      const res = await fetch(`/api/maps/${mapId}`);
      if (!res.ok) throw new Error("Failed to load map");
      return res.json();
    },
    staleTime: Infinity,
  });
