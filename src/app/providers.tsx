"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeContextProvider } from "@/context/ThemeContext";

export default function AuthAndThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <ThemeContextProvider>{children}</ThemeContextProvider>
    </SessionProvider>
  );
}
