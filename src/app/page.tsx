import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import Landing from "@/components/Landing/Landing";

export default async function Page() {
  const session = await getServerSession(authOptions);
  console.log("MARK ACOSTA");
  if (session) {
    redirect("/workspace");
  }

  return <Landing />;
}
