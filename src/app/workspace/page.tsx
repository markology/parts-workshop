import JournalDrawer from "@/components/JournalDrawer";
import ViewportSizeSwitch from "@/components/ViewportSizeSwitch";
import DesktopWorkspace from "@/features/workspace/components/DesktopWorkspace";
import MobileWorkspace from "@/features/workspace/components/MobileWorkspace";

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
