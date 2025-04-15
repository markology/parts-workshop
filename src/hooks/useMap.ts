"use client";

import { Map } from "@prisma/client";
import { useEffect, useState } from "react";

export const useMap = (mapId: string) => {
  const [map, setMap] = useState<Map | null>(null);
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
