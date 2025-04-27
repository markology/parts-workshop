"use client";
import { redirect } from "next/navigation";

const SignInButton = () => (
  <button
    className="text-3xl bg-[#3a3a3a] text-white pt-1 pb-2 px-5 rounded-full shadow-[0px_4px_8px_0px_black]"
    onClick={() => redirect("/login")}
  >
    Sign in
  </button>
);

export default SignInButton;
