"use client";

import "@xyflow/react/dist/style.css";

import { SessionProvider, signIn, signOut, useSession } from "next-auth/react";

export function AuthButton() {
  const { data: session } = useSession();

  if (session) {
    return (
      <div>
        <span>Signed in as {session.user?.email}</span>
        <button onClick={() => signOut()}>Sign out</button>
      </div>
    );
  }

  return <button onClick={() => signIn("github")}>Sign in with GitHub</button>;
}

const Landing = () => (
  <SessionProvider>
    <AuthButton />
  </SessionProvider>
);

export default Landing;
