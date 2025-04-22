import ViewportSizeSwitch from "@/components/ViewportSizeSwitch";
import DesktopWorkspace from "@/features/workspace/components/DesktopWorkspace";
import MobileWorkspace from "@/features/workspace/components/MobileWorkspace";

export default function Page() {
  return (
    <ViewportSizeSwitch
      mobile={<MobileWorkspace />}
      desktop={<DesktopWorkspace />}
    />
  );
}
