"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Login from "@/features/login/Login";

export default function LoginPage() {
  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/workspace");
    }
  }, [status, router]);

  if (status === "loading") {
    return <p className="text-center p-8">Checking session...</p>;
  }

  return <Login />;
}
