"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, MailPlus } from "lucide-react";
import { useSession } from "next-auth/react";
import PartsStudioLogo from "@/components/PartsStudioLogo";
import AccountDropdown from "@/components/AccountDropdown";
import StudioAssistantButton from "@/components/StudioAssistantButton";
import StudioAssistant from "@/components/StudioAssistant";
import { useUIStore } from "@/features/workspace/state/stores/UI";

interface PageHeaderProps {
  /** The page name to display as subtitle (e.g., "Dashboard", "Mission + Roadmap") */
  pageName: string;
  /** Show the Studio Assistant search */
  showSearch?: boolean;
  /** Show the Contact button */
  showContact?: boolean;
  /** Show the Account dropdown (if logged in) or back button (if not logged in) */
  showAccount?: boolean;
  /** Show Dashboard link in account dropdown (defaults to true, set to false for dashboard page) */
  showDashboard?: boolean;
  /** Custom back button href (defaults to "/") */
  backButtonHref?: string;
  /** Custom back button title */
  backButtonTitle?: string;
}

export default function PageHeader({
  pageName,
  showSearch = true,
  showContact = true,
  showAccount = true,
  showDashboard = true,
  backButtonHref = "/",
  backButtonTitle = "Return to landing page",
}: PageHeaderProps) {
  const { data: session } = useSession();
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const searchBoxRef = useRef<HTMLDivElement>(null);
  const savedScrollY = useRef<number>(0);
  const setShowFeedbackModal = useUIStore((s) => s.setShowFeedbackModal);

  // Detect dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains("dark"));
    };

    checkDarkMode();
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  // Handle body scroll locking when search is expanded
  useEffect(() => {
    if (isSearchExpanded) {
      savedScrollY.current = window.scrollY;
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.top = `-${savedScrollY.current}px`;
      document.body.style.width = "100%";
    } else {
      const scrollY = savedScrollY.current;
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      // Restore scroll position immediately without animation
      requestAnimationFrame(() => {
        document.documentElement.scrollTop = scrollY;
        document.body.scrollTop = scrollY;
      });
    }

    return () => {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
    };
  }, [isSearchExpanded]);

  // Handle Escape key to close search
  useEffect(() => {
    if (!isSearchExpanded) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsSearchExpanded(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isSearchExpanded]);

  // Handle scroll to make header narrower when sticky
  useEffect(() => {
    let ticking = false;
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;

          // Use hysteresis to prevent rapid toggling:
          // - When scrolling down, use higher threshold (30px)
          // - When scrolling up, use lower threshold (10px)
          if (currentScrollY > lastScrollY) {
            // Scrolling down
            setIsScrolled(currentScrollY > 30);
          } else {
            // Scrolling up
            setIsScrolled(currentScrollY > 10);
          }

          lastScrollY = currentScrollY;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    // Check initial scroll position
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <>
      {/* Search overlay */}
      {showSearch && (
        <div
          className={`fixed inset-0 ${
            isSearchExpanded
              ? "opacity-100 pointer-events-auto"
              : "opacity-0 pointer-events-none"
          }`}
          style={{
            backgroundColor: isSearchExpanded
              ? "rgba(0,0,0,0.35)"
              : "transparent",
            backdropFilter: isSearchExpanded ? "blur(2px)" : "none",
            WebkitBackdropFilter: isSearchExpanded ? "blur(2px)" : "none",
            zIndex: isSearchExpanded ? 70 : 40,
          }}
          onClick={() => setIsSearchExpanded(false)}
        >
          {isSearchExpanded && (
            <div
              className="absolute left-1/2 -translate-x-1/2 w-full max-w-md px-6"
              style={{ top: "20px" }}
              ref={searchBoxRef}
              onClick={(e) => e.stopPropagation()}
            >
              <StudioAssistant
                isOpen={isSearchExpanded}
                onClose={() => setIsSearchExpanded(false)}
                containerRef={searchBoxRef}
              />
            </div>
          )}
        </div>
      )}

      {/* Header */}
      <header
        className={`sticky top-0 z-[65] dark:bg-[var(--component)] supports-[backdrop-filter]:backdrop-blur-xl dark:shadow-none transition-all duration-300 ${isScrolled ? "shadow-md" : "shadow-sm"}`}
        style={
          !isDarkMode
            ? {
                background:
                  "linear-gradient(to right, rgb(255 252 252), rgb(255, 255, 255), rgb(247 251 253))",
                boxShadow: "rgba(170, 228, 243, 0.33) 0px -4px 11px 1px",
                borderBottom: "1px solid #e8e8e8",
              }
            : undefined
        }
      >
        <div
          className={`relative max-w-6xl mx-auto px-6 flex items-center justify-between gap-4 transition-all duration-300 ${
            isScrolled ? "py-2" : "py-4"
          }`}
        >
          {/* Logo and Page Name */}
          <Link
            href={session ? "/dashboard" : "/"}
            className="flex items-center gap-4 hover:opacity-80 transition-opacity"
          >
            <div
              className="inline-flex items-center transition-all duration-300"
              style={{
                columnGap: isScrolled ? "3px" : "4px",
              }}
            >
              <PartsStudioLogo
                className="dark:invert transition-all duration-300"
                size={isScrolled ? "md" : "lg"}
                showText={false}
              />
              <div
                className={`flex flex-col transition-all duration-300 ${isScrolled ? "gap-0" : "gap-0.5"}`}
              >
                <span
                  className={`font-semibold leading-tight text-slate-900 dark:text-white transition-all duration-300 ${
                    isScrolled ? "text-base" : "text-lg"
                  }`}
                >
                  Parts Studio
                </span>
                <span
                  className={`uppercase tracking-[0.28em] text-slate-500 dark:text-[#ffffffb3] transition-all duration-300 ${
                    isScrolled ? "text-[10px]" : "text-xs"
                  }`}
                >
                  {pageName}
                </span>
              </div>
            </div>
          </Link>

          {/* Search Input - Absolutely positioned, centered */}
          {showSearch && (
            <div
              className="absolute left-1/2 -translate-x-1/2 w-full max-w-md px-6 pointer-events-none transition-all duration-300"
              style={{ zIndex: 60, top: isScrolled ? "12px" : "20px" }}
            >
              <div
                ref={searchBoxRef}
                className="relative pointer-events-auto flex justify-center"
              >
                {!isSearchExpanded && (
                  <StudioAssistantButton
                    onClick={() => {
                      setIsSearchExpanded(true);
                    }}
                    placeholder="Ask the Studio Assistant"
                    size={isScrolled ? "sm" : "md"}
                  />
                )}
              </div>
            </div>
          )}

          {/* Contact Button and Account Dropdown */}
          <div className="flex items-center gap-2 sm:gap-3">
            {showContact && (
              <>
                <button
                  onClick={() => setShowFeedbackModal(true)}
                  className={`hidden sm:inline-flex items-center justify-center rounded-full transition-all duration-300 ${
                    isScrolled ? "w-8 h-8" : "w-10 h-10"
                  }`}
                  style={
                    !isDarkMode
                      ? {
                          background:
                            "radial-gradient(circle, rgba(175, 211, 238, 0.04), rgb(255, 255, 255), rgba(255, 80, 105, 0.03))",
                          boxShadow: "rgb(3, 169, 244) 0px 2px 7px -8px",
                          borderWidth: "1.5px 1px 1px 1.5px",
                          borderStyle: "solid",
                          borderColor:
                            "rgb(255 200 210 / 72%) rgb(170 228 243 / 67%) rgb(170 228 243 / 63%) rgb(255 200 161 / 68%)",
                        }
                      : undefined
                  }
                  title="Contact"
                >
                  <MailPlus
                    className={isScrolled ? "w-4 h-4" : "w-5 h-5"}
                    style={!isDarkMode ? { color: "#484848" } : undefined}
                  />
                </button>
                <button
                  onClick={() => setShowFeedbackModal(true)}
                  className={`sm:hidden inline-flex items-center justify-center rounded-full transition-all duration-300 bg-white dark:bg-slate-900/80 text-slate-700 dark:text-white ${
                    isScrolled ? "w-8 h-8" : "w-10 h-10"
                  }`}
                  title="Contact"
                >
                  <MailPlus className={isScrolled ? "w-4 h-4" : "w-5 h-5"} />
                </button>
              </>
            )}

            {/* Account Dropdown or Back Button */}
            {showAccount &&
              (session ? (
                <AccountDropdown
                  showDashboard={showDashboard}
                  showHelp={true}
                  themeModeType="system"
                  isScrolled={isScrolled}
                />
              ) : (
                <Link
                  href={backButtonHref}
                  className={`flex items-center justify-center rounded-full border transition-all duration-300 bg-white dark:bg-slate-900/80 text-slate-700 dark:text-white border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 ${
                    isScrolled ? "w-8 h-8" : "w-10 h-10"
                  }`}
                  title={backButtonTitle}
                >
                  <ArrowLeft className={isScrolled ? "w-4 h-4" : "w-5 h-5"} />
                </Link>
              ))}
          </div>
        </div>
      </header>
    </>
  );
}
