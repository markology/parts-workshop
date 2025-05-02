import { authOptions } from "@/lib/authOptions";
import { getServerSession } from "next-auth";
import dynamic from "next/dynamic";

const WorkspaceShell = dynamic(() => import("@/components/WorkspaceShell"), {
  ssr: false,
});

export async function getServerSideProps(context) {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session) {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  }

  return {
    props: {
      user: session.user,
    },
  };
}

export default function WorkspacePage({ user }) {
  return <WorkspaceShell user={user} />;
}
