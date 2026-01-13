"use client";
import { useRouter } from "next/navigation";

const SignInButton = () => {
  const router = useRouter();
  
  return (
    <button
      className="text-sm font-medium text-slate-700 hover:text-slate-900 px-4 py-2 rounded-lg bg-white hover:bg-slate-50 transition-all"
      onClick={() => router.push("/login")}
    >
      Sign in
    </button>
  );
};

export default SignInButton;
