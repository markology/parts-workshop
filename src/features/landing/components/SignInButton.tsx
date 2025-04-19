"use client";
import { signIn } from "next-auth/react";

const SignInButton = () => (
  <button
    className="text-3xl bg-[#3a3a3a] text-white pt-1 pb-2 px-5 rounded-full"
    style={{ boxShadow: "0px 4px 8px 0px black" }}
    onClick={() => signIn("google", { callbackUrl: "/" })}
  >
    Sign in
  </button>
);

export default SignInButton;
