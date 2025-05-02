"use client";
import dynamic from "next/dynamic";

// Dynamic import of the actual shell
const WorkspaceShell = dynamic(() => import("./WorkspaceShell"), {
  ssr: false,
});

export default function WorkspaceClientEntry() {
  return <WorkspaceShell />;
}
