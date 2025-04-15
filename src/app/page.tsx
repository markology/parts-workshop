import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import Landing from "@/features/landing/components/Landing";

export default async function Page() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/workspace");
  }

  return <Landing />;
}
