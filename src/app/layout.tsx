import type { Metadata } from "next";
import { Quicksand } from "next/font/google";
import "./globals.css";

import AuthAndThemeProvider from "./providers";
import { PostHogProvider } from "../components/PostHogProvider";

const interFont = Quicksand({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Parts Workshop",
  description: "Ceremonial Mapping for Parts Work",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${interFont.variable} antialiased`}>
        <PostHogProvider>
          <AuthAndThemeProvider>{children}</AuthAndThemeProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
