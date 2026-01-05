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
  const searchBoxRef = useRef<HTMLDivElement>(null);
  const savedScrollY = useRef<number>(0);
  const setShowFeedbackModal = useUIStore((s) => s.setShowFeedbackModal);

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
      <header className="sticky top-0 z-[65] bg-white/75 dark:bg-[var(--component)] border-b border-slate-200/70 supports-[backdrop-filter]:backdrop-blur-xl shadow-[0_18px_42px_rgba(15,23,42,0.08)] dark:shadow-none dark:border-[var(--border)]">
        <div className="relative max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          {/* Logo and Page Name */}
          <Link
            href={session ? "/dashboard" : "/"}
            className="flex items-center gap-4 hover:opacity-80 transition-opacity"
          >
            <div
              className="inline-flex items-center"
              style={{ columnGap: "4px", marginLeft: "6px" }}
            >
              <PartsStudioLogo
                className="dark:invert"
                size="lg"
                showText={false}
              />
              <div className="flex flex-col gap-0.5">
                <span className="text-lg font-semibold leading-tight text-slate-900 dark:text-white">
                  Parts Studio
                </span>
                <span className="text-xs uppercase tracking-[0.28em] text-slate-500 dark:text-[#ffffffb3]">
                  {pageName}
                </span>
              </div>
            </div>
          </Link>

          {/* Search Input - Absolutely positioned, centered */}
          {showSearch && (
            <div
              className="absolute left-1/2 -translate-x-1/2 w-full max-w-md px-6 pointer-events-none"
              style={{ zIndex: 60, top: "20px" }}
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
                  className="hidden sm:inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 text-white bg-[image:var(--button-jazz-gradient)]"
                  title="Contact"
                >
                  <MailPlus className="w-4 h-4" />
                  <span>Contact</span>
                </button>
                <button
                  onClick={() => setShowFeedbackModal(true)}
                  className="sm:hidden inline-flex items-center justify-center w-10 h-10 rounded-full transition-colors bg-white dark:bg-slate-900/80 text-slate-700 dark:text-white"
                  title="Contact"
                >
                  <MailPlus className="w-5 h-5" />
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
                />
              ) : (
                <Link
                  href={backButtonHref}
                  className="flex items-center justify-center w-10 h-10 rounded-full border transition-all duration-200 bg-white dark:bg-slate-900/80 text-slate-700 dark:text-white border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500"
                  title={backButtonTitle}
                >
                  <ArrowLeft className="w-5 h-5" />
                </Link>
              ))}
          </div>
        </div>
      </header>
    </>
  );
}
