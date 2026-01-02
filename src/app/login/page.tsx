"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Auth from "@/features/login/Auth";
import PageLoader from "@/components/PageLoader";

export default function LoginPage() {
  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <PageLoader
        title="Checking your session"
        subtitle="Making sure you're signed in before entering Parts Studio."
        message="Authenticating..."
      />
    );
  }

  return <Auth />;
}
