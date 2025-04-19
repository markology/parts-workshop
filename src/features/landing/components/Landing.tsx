"use client";

import React from "react";
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

const Landing = () => {
  return (
    <div
      className="relative h-screen w-screen"
      style={{ background: "linear-gradient(161deg, #643312, #327b86)" }}
    >
      {/*eslint-disable-next-line @next/next/no-img-element */}
      <img
        alt="hero"
        src="parts-hero.png"
        className="absolute top-0 bottom-0 left-0 right-0 h-full w-screen object-contain"
      />
      <div className="absolute z-10 inset-0 flex items-center justify-center flex-col">
        <h1 className="text-8xl mb-3">Parts Workshop</h1>
        <SignInButton />
      </div>
    </div>
  );
};

export default Landing;
