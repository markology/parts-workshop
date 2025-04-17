import ProtectedRoute from "@/components/ProtectedRoute";
import "@xyflow/react/dist/style.css";

const WorkspaceLayout = async ({ children }: { children: React.ReactNode }) => {
  return <ProtectedRoute>{children}</ProtectedRoute>;
};

export default WorkspaceLayout;
