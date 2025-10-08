"use client";

import { useParams } from "next/navigation";
import dynamic from "next/dynamic";

// Dynamic import of the actual workspace shell
const WorkspaceShell = dynamic(() => import("../WorkspaceShell"), {
  ssr: false,
});

export default function MapPage() {
  const params = useParams();
  const mapId = params?.mapId as string;

  return (
    <div className="h-screen">
      <WorkspaceShell mapId={mapId} />
    </div>
  );
}
