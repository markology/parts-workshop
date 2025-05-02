import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import WorkspaceClientEntry from "./WorkspaceClientEntry"; // ⬅️ This is the client-only wrapper
import { authOptions } from "@/lib/authOptions";

export default async function WorkspacePage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return <WorkspaceClientEntry />;
}
