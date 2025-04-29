"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeContextProvider } from "@/state/context/ThemeContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { PostHogProvider } from "@/components/PostHogProvider";
import { Toaster } from "react-hot-toast";

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
          <Toaster position="bottom-right" />
        </QueryClientProvider>
      </ThemeContextProvider>
    </PostHogProvider>
  );
}
