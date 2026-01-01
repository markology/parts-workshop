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
    
    // If user has a saved theme preference, use it
    if (themeName && ["light", "dark", "cherry", "system"].includes(themeName)) {
      // For "system", we can't detect browser preference server-side, so default to light
      // Client script will handle the actual system preference
      if (themeName === "system") {
        return { themeName: "system", isDark: false }; // Will be overridden by client
      }
      return { themeName, isDark: themeName === "dark" };
    }
    
    // Otherwise, we'll let the client-side script handle browser preference
    // Return default that will be overridden by client script
    return { themeName: "system", isDark: false };
  } catch {
    // If cookies() fails (e.g., in middleware or static generation), return default
    return { themeName: "system", isDark: false };
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
    <html lang="en" className={[serverTheme.isDark ? "dark" : "light", serverTheme.themeName ? serverTheme.themeName : ""].join(" ")} suppressHydrationWarning>
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
                  
                  // Check if user has a saved theme preference
                  const savedThemeName = localStorage.getItem("themeName");
                  
                  let isDark = false;
                  
                  // If user has a saved theme preference, use it
                  if (savedThemeName) {
                    if (savedThemeName === "system") {
                      // System mode: follow browser preference
                      isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
                    } else {
                      isDark = savedThemeName === "dark";
                    }
                  } else {
                    // No preference saved: default to system mode (follow browser)
                    isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
                  }
                  
                  // Apply theme class immediately
                  document.documentElement.classList.add(isDark ? "dark" : "light");
                  
                  // Set CSS custom property for background color (for loading screen)
                  const darkBg = "#3D434B";
                  const lightBg = "#f8fafc";
                  document.documentElement.style.setProperty("--initial-bg", isDark ? darkBg : lightBg);
                  
                  console.log('[Theme Script] Applied client theme:', isDark ? 'dark' : 'light', 'savedTheme:', savedThemeName || 'system (default)');
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
