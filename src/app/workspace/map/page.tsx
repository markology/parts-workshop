"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function MapPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to maps selection page since /map should not exist in the new multi-map system
    router.push("/workspace/maps");
  }, [router]);

  return <div>Redirecting to maps...</div>;
}
