import { authOptions } from "@/lib/authOptions";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

const ProtectedRoute = async ({ children }: { children: React.ReactNode }) => {
  const session = await getServerSession(authOptions);
  console.log("CURRENT SESSION", session);
  if (!session?.user) {
    console.log("REDIRECTING TO LANDING");
    redirect("/login");
  }

  return children;
};

export default ProtectedRoute;
