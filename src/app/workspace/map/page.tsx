"use client";

import dynamic from "next/dynamic";

// Dynamic import of the actual workspace shell
const WorkspaceShell = dynamic(() => import("../WorkspaceShell"), {
  ssr: false,
});

export default function MapPage() {
  return <WorkspaceShell />;
}
