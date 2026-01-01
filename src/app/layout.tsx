import type { Metadata } from "next";
import { Quicksand } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";

import AuthAndThemeProvider from "./providers";

const interFont = Quicksand({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Parts Studio",
  description: "Ceremonial Mapping for Parts Work",
};

/**
 * Server-side function to get initial theme from cookies
 * Reads themePref (mode) and activeTheme (workspace theme)
 */
async function getServerTheme(): Promise<{ themePref: string; activeTheme: string; isDark: boolean }> {
  try {
    const cookieStore = await cookies();
    const themePref = cookieStore.get("themePref")?.value;
    const activeTheme = cookieStore.get("activeTheme")?.value;
    
    // Use new format
    const pref = themePref || "system";
    const theme = activeTheme || "light"; // Default to light if not set
    
    // Determine isDark for SSR
    // If themePref is "system", we can't know server-side, so default to light
    // Client script will fix it immediately
    const isDark = pref === "dark";
    
    return { themePref: pref, activeTheme: theme, isDark };
  } catch {
    // If cookies() fails (e.g., in middleware or static generation), return defaults
    return { themePref: "system", activeTheme: "light", isDark: false };
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Get theme from cookies on server
  const serverTheme = await getServerTheme();
  
  // Build HTML classes: mode class (dark/light) + theme class (theme-{activeTheme})
  const htmlClasses = [
    serverTheme.isDark ? "dark" : "light",
    `theme-${serverTheme.activeTheme}`,
  ].filter(Boolean).join(" ");
  
  return (
    <html lang="en" className={htmlClasses} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  // Single source of truth: read themePref (mode) and activeTheme (workspace theme)
                  // This script runs before React mounts to prevent flicker
                  
                  // Check localStorage first, then cookie (for SSR fallback)
                  let themePref = localStorage.getItem("themePref");
                  let activeTheme = localStorage.getItem("activeTheme");
                  
                  // If still no themePref, check cookie (from SSR)
                  if (!themePref || !activeTheme) {
                    const cookies = document.cookie.split(';');
                    for (let cookie of cookies) {
                      const [key, value] = cookie.trim().split('=');
                      if (key === 'themePref') themePref = value;
                      if (key === 'activeTheme') activeTheme = value;
                    }
                    // Sync to localStorage if found in cookie
                    if (themePref) localStorage.setItem("themePref", themePref);
                    if (activeTheme) localStorage.setItem("activeTheme", activeTheme);
                  }
                  
                  // Defaults
                  themePref = themePref || "system";
                  
                  // Determine isDark based on themePref
                  let isDark = false;
                  if (themePref === "dark") {
                    isDark = true;
                  } else if (themePref === "light") {
                    isDark = false;
                  } else {
                    // themePref === "system" or missing - follow browser preference
                    isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
                  }
                  
                  // Default activeTheme based on mode if not set
                  if (!activeTheme || !["light", "dark", "cherry"].includes(activeTheme)) {
                    activeTheme = isDark ? "dark" : "light";
                  }
                  
                  // Apply mode class to <html> (for Tailwind dark:)
                  document.documentElement.classList.remove("light", "dark");
                  document.documentElement.classList.add(isDark ? "dark" : "light");
                  
                  // Apply theme class to <html> (theme-light, theme-dark, theme-cherry)
                  document.documentElement.classList.remove("theme-light", "theme-dark", "theme-cherry");
                  document.documentElement.classList.add("theme-" + activeTheme);
                  
                  // Set CSS custom property for background color (for loading screen)
                  const darkBg = "#3D434B";
                  const lightBg = "#f8fafc";
                  document.documentElement.style.setProperty("--initial-bg", isDark ? darkBg : lightBg);
                  
                  console.log('[Theme Script] Applied theme:', { 
                    themePref: themePref, 
                    activeTheme: activeTheme,
                    isDark: isDark 
                  });
                } catch (e) {
                  console.error('[Theme Script] Error:', e);
                  // Fallback to light theme on error
                  document.documentElement.classList.remove("light", "dark", "theme-light", "theme-dark", "theme-cherry");
                  document.documentElement.classList.add("light", "theme-light");
                  document.documentElement.style.setProperty("--initial-bg", "#f8fafc");
                }
              })();
            `,
          }}
        />
      </head>
      <body className={`${interFont.variable} antialiased`}>
        <AuthAndThemeProvider>{children}</AuthAndThemeProvider>
      </body>
    </html>
  );
}
