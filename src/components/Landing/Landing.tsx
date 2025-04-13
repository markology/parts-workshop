"use client";

import React from "react";
import { signIn } from "next-auth/react";

const Landing = () => {
  return <button onClick={() => signIn()}>Sign in</button>;
};

export default Landing;
