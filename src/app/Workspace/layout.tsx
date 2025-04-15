import ProtectedRoute from "@/components/ProtectedRoute";
import "@xyflow/react/dist/style.css";
import Page from "../page";

const WorkspaceLayout = async () => {
  return (
    <ProtectedRoute>
      <Page />
    </ProtectedRoute>
  );
};

export default WorkspaceLayout;
