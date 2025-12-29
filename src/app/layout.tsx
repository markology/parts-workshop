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

// Server-side function to get initial theme from cookies
async function getServerTheme(): Promise<{ themeName: string; isDark: boolean }> {
  try {
    const cookieStore = await cookies();
    const themeName = cookieStore.get("themeName")?.value;
    const themeGlobal = cookieStore.get("themeGlobal")?.value;
    
    // If user has manually set a global theme, use it
    if (themeGlobal === "1" && themeName && ["light", "dark", "red"].includes(themeName)) {
      return { themeName, isDark: themeName === "dark" };
    }
    
    // Otherwise, we'll let the client-side script handle browser preference
    // Return default that will be overridden by client script
    return { themeName: "light", isDark: false };
  } catch {
    // If cookies() fails (e.g., in middleware or static generation), return default
    return { themeName: "light", isDark: false };
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Get theme from cookies on server
  const serverTheme = await getServerTheme();
  
  return (
    <html lang="en" className={serverTheme.isDark ? "dark" : "light"} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  // Check if server already set the theme class (from cookies)
                  const hasServerTheme = document.documentElement.classList.contains("dark") || 
                                        document.documentElement.classList.contains("light");
                  
                  if (hasServerTheme) {
                    // Server already set it from cookies, just sync localStorage
                    const serverTheme = document.documentElement.classList.contains("dark") ? "dark" : "light";
                    const isDark = serverTheme === "dark";
                    
                    // Sync to localStorage if not already set
                    if (!localStorage.getItem("themeName")) {
                      localStorage.setItem("themeName", serverTheme);
                      localStorage.setItem("themeGlobal", "1");
                    }
                    
                    // Set CSS custom property
                    const darkBg = "#3D434B";
                    const lightBg = "#f8fafc";
                    document.documentElement.style.setProperty("--initial-bg", isDark ? darkBg : lightBg);
                    
                    console.log('[Theme Script] Using server theme:', serverTheme);
                    return;
                  }
                  
                  // Server didn't set theme (no cookie), check localStorage and browser
                  document.documentElement.classList.remove("light", "dark");
                  
                  // Check if user has manually set a global theme preference
                  const savedThemeName = localStorage.getItem("themeName");
                  const themeGlobal = localStorage.getItem("themeGlobal");
                  
                  let isDark = false;
                  
                  // If user has explicitly chosen a global theme, use it
                  if (themeGlobal === "1" && savedThemeName) {
                    isDark = savedThemeName === "dark";
                  } else {
                    // Otherwise, use browser/device preference
                    isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
                  }
                  
                  // Apply theme class immediately
                  document.documentElement.classList.add(isDark ? "dark" : "light");
                  
                  // Set CSS custom property for background color (for loading screen)
                  const darkBg = "#3D434B";
                  const lightBg = "#f8fafc";
                  document.documentElement.style.setProperty("--initial-bg", isDark ? darkBg : lightBg);
                  
                  console.log('[Theme Script] Applied client theme:', isDark ? 'dark' : 'light', 'savedTheme:', savedThemeName, 'themeGlobal:', themeGlobal);
                } catch (e) {
                  console.error('[Theme Script] Error:', e);
                  // Fallback to light theme on error
                  document.documentElement.classList.remove("light", "dark");
                  document.documentElement.classList.add("light");
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
