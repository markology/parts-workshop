import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Landing from "@/features/landing/components/Landing";
import { authOptions } from "@/lib/authOptions";
export const dynamic = "force-static"; // ✅ Next.js SSG

export default async function Page() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/workspace");
  }

  return <Landing />;
}
