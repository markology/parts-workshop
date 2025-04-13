"use client";

import { useEffect, useState } from "react";

type MapData = {
  id: string;
  title: string | null;
  nodes: any[];
  edges: any[];
  sidebarImpressions: any[];
};

export const useMap = (mapId: string) => {
  const [map, setMap] = useState<MapData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMap = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/map/${mapId}`, {
          headers: { "x-user-id": "test-user-id" },
        });
        const data = await res.json();
        setMap(data);
      } catch (err) {
        console.error("Failed to fetch map", err);
        setMap(null);
      } finally {
        setLoading(false);
      }
    };

    fetchMap();
  }, [mapId]);

  return { map, loading };
};
