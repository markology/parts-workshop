import type { Metadata } from "next";
import Script from "next/script";
import { Quicksand } from "next/font/google";
import "./globals.css";

import AuthAndThemeProvider from "./providers";

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
      <Script
        defer
        data-domain="parts-workshop.vercel.app"
        src="https://plausible.io/js/script.js"
        strategy="afterInteractive"
      />
      <Script id="plausible-setup" strategy="afterInteractive">
        {`
          window.plausible = window.plausible || function() {
            (window.plausible.q = window.plausible.q || []).push(arguments)
          }
        `}
      </Script>

      <body className={`${interFont.variable} antialiased`}>
        <AuthAndThemeProvider>{children}</AuthAndThemeProvider>
      </body>
    </html>
  );
}
