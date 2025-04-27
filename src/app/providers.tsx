"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeContextProvider } from "@/context/ThemeContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { PostHogProvider } from "@/components/PostHogProvider";

export default function AuthAndThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [client] = useState(() => new QueryClient());

  return (
    <PostHogProvider>
      <ThemeContextProvider>
        <QueryClientProvider client={client}>
          <SessionProvider>{children}</SessionProvider>
          <ReactQueryDevtools initialIsOpen={true} />
        </QueryClientProvider>
      </ThemeContextProvider>
    </PostHogProvider>
  );
}
