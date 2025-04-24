import Landing from "@/features/landing/components/Landing";
import { authOptions } from "@/lib/authOptions";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function Page() {
  const session = await getServerSession(authOptions);

  if (session?.user) {
    console.log("SESSION FOUND - REDIRECTING TO WORKSPACE");
    redirect("/workspace");
  }

  return <Landing />;
}
