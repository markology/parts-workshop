"use client";

import JournalDrawer from "@/features/workspace/components/Journal/JournalDrawer";
import ViewportSizeSwitch from "@/components/ViewportSizeSwitch";
import dynamic from "next/dynamic";

const DesktopWorkspace = dynamic(
  () => import("@/features/workspace/components/DesktopWorkspace"),
  {
    ssr: false,
  }
);

const MobileWorkspace = dynamic(
  () => import("@/features/workspace/components/MobileWorkspace"),
  {
    ssr: false,
  }
);

export default function Page() {
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
