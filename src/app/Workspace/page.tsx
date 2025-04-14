import "@xyflow/react/dist/style.css";

import WorkspaceClient from "./WorkspaceClient";
import ProtectedRoute from "@/components/hoc/ProtectedRoute";

const WorkspacePage = async () => {
  return (
    <ProtectedRoute>
      <WorkspaceClient />
    </ProtectedRoute>
  );
};

export default WorkspacePage;
