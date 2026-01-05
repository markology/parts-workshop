"use client";

import { useState, useEffect, useRef, memo } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import {
  User,
  Settings,
  Moon,
  Sun,
  Monitor,
  LogOut,
  HelpCircle,
  Map,
  Paintbrush,
} from "lucide-react";
import { useThemeContext } from "@/state/context/ThemeContext";
import { useUIStore } from "@/features/workspace/state/stores/UI";
import { useTheme } from "@/features/workspace/hooks/useTheme";

interface AccountDropdownProps {
  /** Show Dashboard link */
  showDashboard?: boolean;
  /** Show Help link */
  showHelp?: boolean;
  /** Show workspace theme picker (for workspace page) */
  showWorkspaceTheme?: boolean;
  /** Theme mode type: 'system' for light/dark/system, 'toggle' for simple light/dark toggle, 'none' to hide */
  themeModeType?: "system" | "toggle" | "none";
  /** Custom className for the button */
  buttonClassName?: string;
  /** Custom className for the dropdown menu */
  menuClassName?: string;
  /** Use workspace theme styling (for workspace page) */
  useWorkspaceTheme?: boolean;
  /** External trigger ref - if provided, clicking this element will toggle the dropdown */
  triggerRef?: React.RefObject<HTMLElement>;
  /** Container ref for positioning */
  containerRef?: React.RefObject<HTMLElement>;
  /** External state control - if provided, this controls the dropdown open state */
  isOpen?: boolean;
  /** Callback when dropdown should close */
  onClose?: () => void;
}

function AccountDropdown({
  showDashboard = false,
  showHelp = false,
  showWorkspaceTheme = false,
  themeModeType = "system",
  buttonClassName,
  menuClassName,
  useWorkspaceTheme = false,
  triggerRef,
  containerRef,
  isOpen: externalIsOpen,
  onClose,
}: AccountDropdownProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const { themePref, setThemePref, isDark } = useThemeContext();
  const setShowFeedbackModal = useUIStore((s) => s.setShowFeedbackModal);
  const workspaceTheme = useWorkspaceTheme ? useTheme() : null;
  const [internalDropdownOpen, setInternalDropdownOpen] = useState(false);
  const dropdownOpen =
    externalIsOpen !== undefined ? externalIsOpen : internalDropdownOpen;
  const setDropdownOpen = (value: boolean) => {
    if (externalIsOpen === undefined) {
      setInternalDropdownOpen(value);
    } else if (!value && onClose) {
      onClose();
    }
  };
  const [dropdownPosition, setDropdownPosition] = useState<{
    top: number;
    right: number;
  } | null>(null);
  const [showThemePanel, setShowThemePanel] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const internalTriggerRef = useRef<HTMLDivElement>(null);
  const actualTriggerRef = triggerRef || internalTriggerRef;
  // Use refs to track state across re-renders to prevent autosave from closing dropdown
  const dropdownOpenRef = useRef(dropdownOpen);
  const triggerRefStable = useRef(triggerRef);
  const containerRefStable = useRef(containerRef);

  // Update refs when props change
  useEffect(() => {
    dropdownOpenRef.current = dropdownOpen;
    triggerRefStable.current = triggerRef;
    containerRefStable.current = containerRef;
  }, [dropdownOpen, triggerRef, containerRef]);

  // Reset theme panel when dropdown closes
  useEffect(() => {
    if (!dropdownOpen) {
      setShowThemePanel(false);
    }
  }, [dropdownOpen]);

  // Handle external trigger clicks - listen for clicks on the trigger element
  // Note: This is handled by the parent component's onClick handler when using external trigger
  // So this effect is only needed if we want to handle it here, but currently the workspace
  // handles it via handleActionClick, so this can be removed or left as a no-op

  // Calculate dropdown position - only recalculate when dropdown opens, not on every render
  useEffect(() => {
    if (dropdownOpen) {
      // Use requestAnimationFrame to ensure DOM is ready and avoid unnecessary recalculations
      const updatePosition = () => {
        const triggerElement =
          triggerRefStable.current?.current ||
          containerRefStable.current?.current ||
          internalTriggerRef.current;
        if (triggerElement) {
          const rect = triggerElement.getBoundingClientRect();
          setDropdownPosition((prev) => {
            // Only update if position actually changed to prevent unnecessary re-renders
            const newPos = {
              top: rect.bottom + 8,
              right: window.innerWidth - rect.right,
            };
            if (
              prev &&
              prev.top === newPos.top &&
              prev.right === newPos.right
            ) {
              return prev;
            }
            return newPos;
          });
        }
      };
      // Small delay to ensure DOM is ready
      const timeoutId = setTimeout(updatePosition, 0);
      return () => clearTimeout(timeoutId);
    } else {
      setDropdownPosition(null);
    }
    // Only depend on dropdownOpen, not refs (refs are stable via useRef)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dropdownOpen]);

  // Close dropdown when clicking outside - use stable refs to prevent re-creation
  useEffect(() => {
    if (!dropdownOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      // Use ref to check current state instead of closure value
      if (!dropdownOpenRef.current) return;

      const target = event.target as Node;
      const triggerElement =
        triggerRefStable.current?.current || internalTriggerRef.current;
      const dropdownMenu = (
        dropdownRef.current as { dropdownMenu?: HTMLElement }
      )?.dropdownMenu;

      const clickedInsideTrigger = triggerElement?.contains(target);
      const clickedInsideMenu = dropdownMenu?.contains(target);

      if (!clickedInsideTrigger && !clickedInsideMenu) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
    // Only depend on dropdownOpen to add/remove listener, but use refs inside handler
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dropdownOpen]);

  const handleAccountClick = () => {
    router.push("/account");
    setDropdownOpen(false);
  };

  const handleDashboardClick = () => {
    router.push("/dashboard");
    setDropdownOpen(false);
  };

  const handleHelpClick = () => {
    setShowFeedbackModal(true);
    setDropdownOpen(false);
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/login" });
    setDropdownOpen(false);
  };

  const handleWorkspaceThemeClick = () => {
    window.dispatchEvent(new CustomEvent("open-theme-picker"));
    setDropdownOpen(false);
  };

  // Default button className if not provided
  const defaultButtonClassName =
    "flex items-center justify-center w-10 h-10 rounded-full border transition-all duration-200 overflow-hidden bg-[var(--theme-account-icon-bg)] border-[var(--theme-account-icon-border)] hover:border-[var(--theme-account-icon-border-hover)]";

  const menuItemClassName =
    "w-full text-left px-4 py-2 text-sm flex items-center gap-2 hover:bg-[var(--theme-account-dropdown-item-bg-hover)] text-[var(--theme-account-dropdown-item-text-color)]";

  return (
    <>
      {!triggerRef && (
        <div className="relative" ref={internalTriggerRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className={buttonClassName || defaultButtonClassName}
            style={
              useWorkspaceTheme && workspaceTheme
                ? {
                    backgroundColor: workspaceTheme.button,
                    color: workspaceTheme.buttonText,
                    ...(isDark
                      ? { boxShadow: "rgb(0 0 0 / 20%) 0px 2px 4px" }
                      : {}),
                  }
                : undefined
            }
            onMouseEnter={
              useWorkspaceTheme && workspaceTheme && isDark
                ? (e) => {
                    // Darken the button on hover by reducing RGB values
                    let r: number, g: number, b: number;

                    if (workspaceTheme.button.startsWith("#")) {
                      const hex = workspaceTheme.button.replace("#", "");
                      r = parseInt(hex.substr(0, 2), 16);
                      g = parseInt(hex.substr(2, 2), 16);
                      b = parseInt(hex.substr(4, 2), 16);
                    } else if (workspaceTheme.button.startsWith("rgb")) {
                      const matches = workspaceTheme.button.match(/\d+/g);
                      if (matches && matches.length >= 3) {
                        r = parseInt(matches[0]);
                        g = parseInt(matches[1]);
                        b = parseInt(matches[2]);
                      } else {
                        return;
                      }
                    } else {
                      return;
                    }

                    const darkerR = Math.max(0, r - 20);
                    const darkerG = Math.max(0, g - 20);
                    const darkerB = Math.max(0, b - 20);
                    e.currentTarget.style.backgroundColor = `rgb(${darkerR}, ${darkerG}, ${darkerB})`;
                  }
                : useWorkspaceTheme && workspaceTheme && !isDark
                  ? (e) => {
                      e.currentTarget.style.backgroundImage =
                        "linear-gradient(to right, rgb(240, 249, 255), rgb(238, 242, 255), rgb(255, 241, 242))";
                    }
                  : undefined
            }
            onMouseLeave={
              useWorkspaceTheme && workspaceTheme
                ? (e) => {
                    if (isDark) {
                      e.currentTarget.style.backgroundColor =
                        workspaceTheme.button;
                    } else {
                      e.currentTarget.style.backgroundImage = "none";
                      e.currentTarget.style.backgroundColor =
                        workspaceTheme.button;
                    }
                  }
                : undefined
            }
          >
            {session?.user?.image ? (
              <Image
                src={session.user.image}
                alt={session.user.name || "User"}
                width={40}
                height={40}
                className="rounded-full w-auto h-auto"
              />
            ) : (
              <User
                className={`w-5 h-5 ${useWorkspaceTheme ? "" : "text-slate-700 dark:text-slate-300"}`}
              />
            )}
          </button>
        </div>
      )}
      {dropdownOpen && dropdownPosition && (
        <div
          ref={(el) => {
            if (el) {
              dropdownRef.current = el;
              (
                dropdownRef.current as { dropdownMenu?: HTMLElement }
              ).dropdownMenu = el;
            }
          }}
          className={`fixed rounded-lg shadow-lg z-[100] bg-[image:var(--theme-account-dropdown-bg)] bg-[var(--theme-account-dropdown-bg)] border-none overflow-hidden`}
          style={{
            ...(useWorkspaceTheme
              ? {
                  minWidth: "150px",
                  top: `${dropdownPosition.top}px`,
                  right: `${dropdownPosition.right}px`,
                }
              : {
                  minWidth: "160px",
                  top: `${dropdownPosition.top}px`,
                  right: `${dropdownPosition.right}px`,
                }),
          }}
        >
          {/* Theme Panel - slides out from the right */}
          <div
            className={`absolute inset-0 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 border-none dark:bg-[image:var(--background-gradient)] rounded-lg transition-transform duration-300 ease-in-out z-10 ${
              showThemePanel ? "translate-x-0" : "translate-x-full"
            }`}
            style={{
              minWidth: useWorkspaceTheme ? "150px" : "160px",
            }}
          >
            <div className="px-4 py-0 border-b border-slate-200 dark:border-[var(--border)] flex items-center gap-2">
              <button
                onClick={() => setShowThemePanel(false)}
                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <svg
                  className="w-4 h-4 text-gray-600 dark:text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Appearance
              </div>
            </div>
            <div className="py-2">
              {themeModeType === "system" ? (
                (["light", "dark", "system"] as const).map((mode) => {
                  const isActive = themePref === mode;
                  const getIcon = () => {
                    if (mode === "system")
                      return <Monitor className="w-4 h-4" />;
                    if (mode === "dark") return <Moon className="w-4 h-4" />;
                    return <Sun className="w-4 h-4" />;
                  };
                  const getLabel = () => {
                    if (mode === "system") return "System";
                    if (mode === "dark") return "Dark Mode";
                    return "Light Mode";
                  };
                  return (
                    <button
                      key={mode}
                      onClick={() => {
                        setThemePref(mode, true);
                        setShowThemePanel(false);
                        setDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${
                        isActive
                          ? "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                          : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
                      }`}
                    >
                      {getIcon()}
                      {getLabel()}
                    </button>
                  );
                })
              ) : (
                <button
                  onClick={() => {
                    const nextTheme = isDark ? "light" : "dark";
                    setThemePref(nextTheme, true);
                    setShowThemePanel(false);
                    setDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {isDark ? (
                    <>
                      <Sun className="w-4 h-4" />
                      Light Mode
                    </>
                  ) : (
                    <>
                      <Moon className="w-4 h-4" />
                      Dark Mode
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Main Menu - slides out to the left when theme panel is open */}
          <div
            className={`transition-transform duration-300 ease-in-out ${
              showThemePanel ? "-translate-x-full" : "translate-x-0"
            }`}
          >
            {showDashboard && (
              <button
                onClick={handleDashboardClick}
                className={`${menuItemClassName} first:rounded-t-lg`}
                style={useWorkspaceTheme ? {} : undefined}
                // onMouseEnter={
                //   useWorkspaceTheme
                //     ? (e) => {
                //         e.currentTarget.style.backgroundColor =
                //           "var(--theme-button-hover)";
                //       }
                //     : undefined
                // }
                // onMouseLeave={
                //   useWorkspaceTheme
                //     ? (e) => {
                //         e.currentTarget.style.backgroundColor = "transparent";
                //       }
                //     : undefined
                // }
              >
                <Map className="w-4 h-4" />
                Dashboard
              </button>
            )}

            <button
              onClick={handleAccountClick}
              className={`${menuItemClassName} ${!showDashboard ? "first:rounded-t-lg" : ""}`}
              style={useWorkspaceTheme ? {} : undefined}
              // onMouseEnter={
              //   useWorkspaceTheme
              //     ? (e) => {
              //         e.currentTarget.style.backgroundColor =
              //           "var(--theme-button-hover)";
              //       }
              //     : undefined
              // }
              // onMouseLeave={
              //   useWorkspaceTheme
              //     ? (e) => {
              //         e.currentTarget.style.backgroundColor = "transparent";
              //       }
              //     : undefined
              // }
            >
              <Settings className="w-4 h-4" />
              Account
            </button>

            {(themeModeType === "system" || themeModeType === "toggle") && (
              <button
                onClick={() => setShowThemePanel(true)}
                className={menuItemClassName}
                style={useWorkspaceTheme ? {} : undefined}
                // onMouseEnter={
                //   useWorkspaceTheme
                //     ? (e) => {
                //         e.currentTarget.style.backgroundColor =
                //           "var(--theme-button-hover)";
                //       }
                //     : undefined
                // }
                // onMouseLeave={
                //   useWorkspaceTheme
                //     ? (e) => {
                //         e.currentTarget.style.backgroundColor = "transparent";
                //       }
                //     : undefined
                // }
              >
                {themeModeType === "system" ? (
                  <>
                    <Monitor className="w-4 h-4" />
                    Appearance
                  </>
                ) : (
                  <>
                    {isDark ? (
                      <Sun className="w-4 h-4" />
                    ) : (
                      <Moon className="w-4 h-4" />
                    )}
                    Appearance
                  </>
                )}
              </button>
            )}

            {showWorkspaceTheme && (
              <button
                onClick={handleWorkspaceThemeClick}
                className={menuItemClassName}
                style={useWorkspaceTheme ? {} : undefined}
                // onMouseEnter={
                //   useWorkspaceTheme
                //     ? (e) => {
                //         e.currentTarget.style.backgroundColor =
                //           "var(--theme-button-hover)";
                //       }
                //     : undefined
                // }
                // onMouseLeave={
                //   useWorkspaceTheme
                //     ? (e) => {
                //         e.currentTarget.style.backgroundColor = "transparent";
                //       }
                //     : undefined
                // }
              >
                <Paintbrush className="w-4 h-4" />
                Themes
              </button>
            )}

            {showHelp && (
              <button
                onClick={handleHelpClick}
                className={menuItemClassName}
                style={useWorkspaceTheme ? {} : undefined}
                // onMouseEnter={
                //   useWorkspaceTheme
                //     ? (e) => {
                //         e.currentTarget.style.backgroundColor =
                //           "var(--theme-button-hover)";
                //       }
                //     : undefined
                // }
                // onMouseLeave={
                //   useWorkspaceTheme
                //     ? (e) => {
                //         e.currentTarget.style.backgroundColor = "transparent";
                //       }
                //     : undefined
                // }
              >
                <HelpCircle className="w-4 h-4" />
                Help
              </button>
            )}

            <button
              onClick={handleSignOut}
              className={`${menuItemClassName} last:rounded-b-lg`}
              style={useWorkspaceTheme ? {} : undefined}
              // onMouseEnter={
              //   useWorkspaceTheme
              //     ? (e) => {
              //         e.currentTarget.style.backgroundColor =
              //           "var(--theme-button-hover)";
              //       }
              //     : undefined
              // }
              // onMouseLeave={
              //   useWorkspaceTheme
              //     ? (e) => {
              //         e.currentTarget.style.backgroundColor = "transparent";
              //       }
              //     : undefined
              // }
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// Memoize to prevent re-renders when parent re-renders due to autosave
export default memo(AccountDropdown);
