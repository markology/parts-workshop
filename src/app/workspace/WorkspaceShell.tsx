"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import JournalDrawer from "@/features/workspace/components/Journal/JournalDrawer";
import ViewportSizeSwitch from "@/components/ViewportSizeSwitch";

const DesktopWorkspace = dynamic(
  () => import("@/features/workspace/components/DesktopWorkspace"),
  { ssr: false }
);
const MobileWorkspace = dynamic(
  () => import("@/features/workspace/components/MobileWorkspace"),
  { ssr: false }
);

export default function WorkspaceShell() {
  const { status } = useSession();
  const router = useRouter();

  if (status === "loading") return null;
  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  return (
    <>
      <JournalDrawer />
      <ViewportSizeSwitch
        mobile={<MobileWorkspace />}
        desktop={<DesktopWorkspace />}
      />
    </>
  );
}
