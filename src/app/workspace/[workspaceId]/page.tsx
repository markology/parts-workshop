"use client";

import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { QueryClient, HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { ReactFlowProvider } from "@xyflow/react";
import JournalDrawer from "@/features/workspace/components/Journal/JournalDrawer";
import ViewportSizeSwitch from "@/components/ViewportSizeSwitch";

// Dynamic import of CanvasClient
const CanvasClient = dynamic(() => import("@/features/workspace/components/CanvasClient"), {
  ssr: false,
});

export default function WorkspacePage() {
  const params = useParams();
  const workspaceId = params?.workspaceId as string;
  const { status } = useSession();
  const router = useRouter();

  if (status === "loading") return null;
  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  if (!workspaceId) {
    return <div className="h-screen flex items-center justify-center">No workspace ID provided</div>;
  }

  // Create a query client for React Query
  const queryClient = new QueryClient();

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ReactFlowProvider>
        <div className="PW flex flex-row flex-grow h-[100vh] w-[100vw] overflow-hidden">
          <JournalDrawer />
          <ViewportSizeSwitch
            mobile={<CanvasClient mapId={workspaceId} showOnboarding={false} />}
            desktop={<CanvasClient mapId={workspaceId} showOnboarding={false} />}
          />
        </div>
      </ReactFlowProvider>
    </HydrationBoundary>
  );
}

