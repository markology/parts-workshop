import React from "react";
import Image from "next/image";
import SignInButton from "./SignInButton";

const Landing = () => {
  return (
    <div
      className="relative h-screen w-screen"
      style={{ background: "linear-gradient(161deg, #643312, #327b86)" }}
    >
      <Image
        className="absolute top-0 bottom-0 left-0 right-0 h-full w-screen object-contain"
        src="/parts-hero.png"
        alt="Parts Workshop Hero"
        width={2200} // <-- your actual image dimensions
        height={1500}
        priority
        placeholder="empty" // or use "blur" with local import
      />

      <div className="absolute z-10 inset-0 flex items-center justify-center flex-col">
        <h1 className="text-8xl mb-3">Parts Workshop</h1>
        <SignInButton />
      </div>
    </div>
  );
};

export default Landing;
