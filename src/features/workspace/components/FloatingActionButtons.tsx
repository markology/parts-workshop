"use client";

import { Plus, Settings, X, Minus, User, Moon, Sun, LogOut, Save, SaveAll, Check, LoaderCircle, MailPlus, Mail, Map, Sparkles } from "lucide-react";
import StudioSparkleInput from "@/components/StudioSparkleInput";
import { useState, useEffect, useLayoutEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUIStore } from "../state/stores/UI";
import { useFlowNodesActions } from "../state/FlowNodesContext";
import { ImpressionList } from "@/features/workspace/constants/Impressions";
import { ImpressionType } from "@/features/workspace/types/Impressions";
import ImpressionDisplay from "./SideBar/Impressions/ImpressionDisplay";
import { SidebarImpression } from "@/features/workspace/types/Sidebar";
import { useWorkingStore } from "../state/stores/useWorkingStore";
import { NodeBackgroundColors } from "../constants/Nodes";
import { useSidebarStore } from "../state/stores/Sidebar";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import { useAutoSave } from "../state/hooks/useAutoSave";
import { useSaveMap } from "../state/hooks/useSaveMap";
import { cleanupOrphanedJournalEntriesFromMap } from "../state/lib/cleanupOrphanedJournalEntriesFromMap";
import { toast } from "react-hot-toast";
import { useThemeContext } from "@/state/context/ThemeContext";
import { HelpCircle } from "lucide-react";

const FloatingActionButtons = () => {
  const router = useRouter();
  const [activeButton, setActiveButton] = useState<string | null>('action');
  const [windowWidth, setWindowWidth] = useState(0);
  const [hoveredOption, setHoveredOption] = useState<string | null>(null);
  const [impressionDropdownStates, setImpressionDropdownStates] = useState<Partial<Record<ImpressionType, boolean>>>({
    emotion: true,
    thought: true,
    sensation: true,
    behavior: true,
    other: true,
  });
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [isCollapsing, setIsCollapsing] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ id: string; role: "user" | "assistant"; content: string }>>([
    {
      id: "assistant-initial",
      role: "assistant",
      content: "Hi! I'm here to help you navigate Parts Studio. Ask me anything."
    }
  ]);
  const [isChatSending, setIsChatSending] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchInputContainerRef = useRef<HTMLDivElement>(null);
  const searchBoxRef = useRef<HTMLDivElement>(null);
  const expandedInputRef = useRef<HTMLTextAreaElement>(null);
  const chatMessagesEndRef = useRef<HTMLDivElement>(null);
  const menuWidthRef = useRef<number>(0);
  const [menuWidthMeasured, setMenuWidthMeasured] = useState(false);
  const [chatboxPosition, setChatboxPosition] = useState<{ top: number; left: number } | null>(null);
  // Use actions-only hook to prevent re-renders when nodes/edges change
  const { createNode } = useFlowNodesActions();
  const menuRef = useRef<HTMLDivElement>(null);
  const impressionsRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const { data: session } = useSession();
  const { darkMode, toggleDarkMode } = useThemeContext();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [profileDropdownPosition, setProfileDropdownPosition] = useState<{ top: number; right: number } | null>(null);
  
  const setShowPartModal = useUIStore((s) => s.setShowPartModal);
  const showImpressionModal = useUIStore((s) => s.showImpressionModal);
  const setShowImpressionModal = useUIStore((s) => s.setShowImpressionModal);
  const setShowFeedbackModal = useUIStore((s) => s.setShowFeedbackModal);
  const shouldCollapseSidebar = useUIStore((s) => s.shouldCollapseSidebar);
  const setShouldCollapseSidebar = useUIStore((s) => s.setShouldCollapseSidebar);
  const selectedPartId = useUIStore((s) => s.selectedPartId);
  const showPartDetailImpressionInput = useUIStore((s) => s.showPartDetailImpressionInput);
  const [showRelationshipTypeModal, setShowRelationshipTypeModal] = useState(true);
  const { isSaving, saveCheck } = useAutoSave();
  const saveMap = useSaveMap();
  const [localIsSaving, setLocalIsSaving] = useState(false);
  const [localSaveCheck, setLocalSaveCheck] = useState(false);
  
  const impressions = useWorkingStore((s) => s.sidebarImpressions);
  const { setActiveSidebarNode } = useSidebarStore();
  
  // Handle click outside and escape key for chatbox
  useEffect(() => {
    if (!isSearchExpanded) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(event.target as Node)) {
        handleSearchClose();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleSearchClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isSearchExpanded]);

  // Scroll to bottom of chat messages
  useEffect(() => {
    if (!isSearchExpanded) {
      return;
    }

    requestAnimationFrame(() => {
      chatMessagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    });
  }, [chatMessages, isSearchExpanded]);

  // Track window width for responsive behavior
  useEffect(() => {
    const updateWindowWidth = () => {
      setWindowWidth(window.innerWidth);
    };
    updateWindowWidth();
    window.addEventListener('resize', updateWindowWidth);
    return () => window.removeEventListener('resize', updateWindowWidth);
  }, []);

  // Measure input position when chatbox opens or window resizes
  useLayoutEffect(() => {
    const updatePosition = () => {
      if (isSearchExpanded && searchInputContainerRef.current) {
        const rect = searchInputContainerRef.current.getBoundingClientRect();
        setChatboxPosition({
          top: rect.top,
          left: rect.left
        });
      } else {
        setChatboxPosition(null);
      }
    };

    updatePosition();

    if (isSearchExpanded) {
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition, true);
      return () => {
        window.removeEventListener('resize', updatePosition);
        window.removeEventListener('scroll', updatePosition, true);
      };
    }
  }, [isSearchExpanded]);

  // Focus input when expanded
  useEffect(() => {
    if (isSearchExpanded && expandedInputRef.current && !isCollapsing) {
      setTimeout(() => {
        expandedInputRef.current?.focus();
      }, 50);
    }
  }, [isSearchExpanded, isCollapsing]);

  // Measure menu width when it opens - use useLayoutEffect for synchronous measurement
  useLayoutEffect(() => {
    if (showRelationshipTypeModal && menuRef.current) {
      // Measure synchronously before paint to minimize delay
      const menuElement = menuRef.current?.querySelector('div') as HTMLElement;
      if (menuElement) {
        // Force a layout calculation by reading offsetWidth
        menuWidthRef.current = menuElement.offsetWidth;
        setMenuWidthMeasured(true);
      }
    } else {
      setMenuWidthMeasured(false);
    }
  }, [showRelationshipTypeModal]);

  // Handle collapse trigger from PartDetailPanel
  useEffect(() => {
    if (shouldCollapseSidebar) {
      // Collapse the options menu and sidebar
      setActiveButton(null);
      setShowRelationshipTypeModal(false);
    }
  }, [shouldCollapseSidebar, setShouldCollapseSidebar]);

  const handleSearchClose = () => {
    // Start the collapse animation
    setIsCollapsing(true);
    setIsSearchExpanded(false);
    
    // Clear the input and reset state after the animation completes (300ms)
    setTimeout(() => {
      setIsCollapsing(false);
      setSearchInput("");
    }, 300);
  };

  const handleSendChat = async () => {
    const trimmedMessage = searchInput.trim();
    if (!trimmedMessage || isChatSending) {
      return;
    }

    const userMessage = {
      id: `user-${Date.now()}`,
      role: "user" as const,
      content: trimmedMessage
    };

    const assistantMessageId = `assistant-${Date.now()}-${Math.random().toString(16).slice(2)}`;

    setChatMessages(prev => [
      ...prev,
      userMessage,
      {
        id: assistantMessageId,
        role: "assistant" as const,
        content: ""
      }
    ]);

    setSearchInput("");
    setIsChatSending(true);

    try {
      const response = await fetch("/api/ai/ifs-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          userMessage: trimmedMessage
        })
      });

      if (!response.ok) {
        throw new Error("Failed to reach assistant");
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body");
      }

      const decoder = new TextDecoder();
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        fullContent += decoder.decode(value, { stream: true });

        const content = fullContent;
        setChatMessages(prev =>
          prev.map(message =>
            message.id === assistantMessageId ? { ...message, content } : message
          )
        );
      }

      setChatMessages(prev =>
        prev.map(message =>
          message.id === assistantMessageId ? { ...message, content: fullContent } : message
        )
      );
    } catch (error) {
      console.error("Chat error:", error);
      setChatMessages(prev =>
        prev.map(message =>
          message.id === assistantMessageId
            ? {
                ...message,
                content:
                  "I'm sorry, I'm having trouble responding right now. Please try again in a moment."
              }
            : message
        )
      );
    } finally {
      setIsChatSending(false);
    }
  };
  
  const handleSaveAndCleanup = async () => {
    setLocalIsSaving(true);
    setLocalSaveCheck(false);
    
    try {
      await saveMap.mutateAsync(undefined);
      const nodeIds = useWorkingStore.getState().nodes.map((n) => n.id);
      await cleanupOrphanedJournalEntriesFromMap(nodeIds);
      setLocalIsSaving(false);
      setLocalSaveCheck(true);
      toast.success("Orphaned journal entries cleaned up.");
      setTimeout(() => setLocalSaveCheck(false), 1000);
    } catch (error) {
      setLocalIsSaving(false);
      toast.error("Failed to save map");
    }
  };
  
  const onDragStart = (
    event: React.DragEvent<HTMLDivElement>,
    draggableId: string,
    type: ImpressionType
  ) => {
    // Get the impression data
    const impression = impressions[type]?.[draggableId];
    
    if (!impression) {
      console.error('Impression not found:', type, draggableId);
      event.preventDefault();
      return;
    }

    // Set data for drop handling - same as ImpressionDisplay
    event.dataTransfer.setData(
      "parts-workshop/sidebar-impression",
      JSON.stringify({ type, id: draggableId })
    );

    // set ActiveSideBarNode - same pattern as ImpressionDisplay
    const activeSideBarNode = impressions[type]?.[draggableId];
    setActiveSidebarNode(activeSideBarNode?.id || null, type);
    event.dataTransfer.effectAllowed = "move";
    
    // Create a custom drag image from the element itself to ensure it appears
    const dragElement = event.currentTarget as HTMLElement;
    const rect = dragElement.getBoundingClientRect();
    
    // Create a temporary element for the drag image
    const dragImage = document.createElement('div');
    dragImage.innerHTML = dragElement.innerHTML;
    dragImage.style.cssText = window.getComputedStyle(dragElement).cssText;
    dragImage.style.position = 'absolute';
    dragImage.style.top = '-9999px';
    dragImage.style.opacity = '0.8';
    dragImage.style.pointerEvents = 'none';
    document.body.appendChild(dragImage);
    
    // Calculate offset to maintain cursor position
    const offsetX = event.clientX - rect.left;
    const offsetY = event.clientY - rect.top;
    event.dataTransfer.setDragImage(dragImage, offsetX, offsetY);
    
    // Clean up after a short delay
    setTimeout(() => {
      if (document.body.contains(dragImage)) {
        document.body.removeChild(dragImage);
      }
    }, 0);
    
    console.log('Drag started:', { type, id: draggableId, label: impression.label });
  };
  
  // Don't close the menu when clicking outside - it should only close when clicking the X button


  // Update dropdown position when it opens
  useEffect(() => {
    if (profileDropdownOpen && profileDropdownRef.current) {
      const rect = profileDropdownRef.current.getBoundingClientRect();
      setProfileDropdownPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right
      });
    } else {
      setProfileDropdownPosition(null);
    }
  }, [profileDropdownOpen]);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    if (!profileDropdownOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current) {
        const dropdownMenu = (profileDropdownRef.current as any).dropdownMenu;
        const clickedInsideButton = profileDropdownRef.current.contains(event.target as Node);
        const clickedInsideMenu = dropdownMenu && dropdownMenu.contains(event.target as Node);
        if (!clickedInsideButton && !clickedInsideMenu) {
          setProfileDropdownOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [profileDropdownOpen]);

  const handleActionClick = (action: string, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    
    // If the assistant chat is open and another action is clicked, close the chat first.
    if (isSearchExpanded) {
      handleSearchClose();
    }

    if (action === 'save') {
      // Save functionality - just execute, don't change any UI state
      handleSaveAndCleanup();
      return;
    }
    
    if (action === 'contact') {
      // Allow clicks that land inside the feedback modal to go through without closing it
      setTimeout(() => {
        const activeElement = document.activeElement;
        if (activeElement instanceof HTMLElement) {
          activeElement.blur();
        }
      });

      setShowFeedbackModal(true);
      return;
    }
    
    if (action === 'settings') {
      // Toggle profile dropdown - don't change activeButton state or other UI
      setProfileDropdownOpen(!profileDropdownOpen);
      return;
    }

    if (action === 'action') {
      // Toggle action button and its associated menu/sidebar only
      if (activeButton === 'action') {
        // Close action button's menu and sidebar
        setActiveButton(null);
        setShowRelationshipTypeModal(false);
      } else {
        // Open action button's menu and sidebar
        setActiveButton('action');
        setShowRelationshipTypeModal(true);
      }
      return;
    }

    if (action === 'options') {
      // Toggle options button - if active, close everything. If not active, activate it and close action menu
      if (activeButton === 'options') {
        // Clicking X on options button closes everything
        setActiveButton(null);
        setShowRelationshipTypeModal(false);
        setProfileDropdownOpen(false);
      } else {
        // Clicking options button activates it and closes action menu
        setActiveButton('options');
        setShowRelationshipTypeModal(false);
        setProfileDropdownOpen(false);
      }
      return;
    }

    if (activeButton === action) {
      // If clicking the same button, toggle it but keep action button active
      setActiveButton('action'); // Return to action button being active
      // Don't close the relationship type modal - keep it open
    } else {
      // Switch to other button but keep action button active and menu open
      setProfileDropdownOpen(false);
      setActiveButton(action);
    }
  };

  const ImpressionDropdown = ({
    type,
    filteredImpressions,
    onDragStart,
  }: {
    type: ImpressionType;
    filteredImpressions: Record<string, SidebarImpression>;
    onDragStart: (
      event: React.DragEvent<HTMLDivElement>,
      draggableId: string,
      type: ImpressionType
    ) => void;
  }) => {
    const open = impressionDropdownStates[type] ?? true;
    const isImpressionsEmpty = !filteredImpressions || !Object.keys(filteredImpressions).length;
    const emptyOpacityStyle = isImpressionsEmpty ? 0.4 : 1;
    
    const toggleOpen = () => {
      setImpressionDropdownStates(prev => ({
        ...prev,
        [type]: !prev[type]
      }));
    };
    
    return (
      <div className="mb-3">
        <button
          className="capitalize flex items-center justify-between w-full p-2 text-left font-semibold rounded transition-colors"
          disabled={isImpressionsEmpty}
          onClick={toggleOpen}
          style={{
            color: NodeBackgroundColors[type],
            opacity: emptyOpacityStyle,
          }}
        >
          <p
            style={{
              color: NodeBackgroundColors[type],
            }}
          >
            {type}
          </p>
          {open ? (
            <Minus
              style={{
                opacity: emptyOpacityStyle,
              }}
              size={16}
              strokeWidth={3}
            />
          ) : (
            <Plus
              style={{
                opacity: emptyOpacityStyle,
              }}
              size={16}
              strokeWidth={3}
            />
          )}
        </button>
        <hr className="pb-2 border-gray-300" />
        <div className="flex flex-col gap-2">
          {open &&
            filteredImpressions &&
            Object.values(filteredImpressions).map((item) => (
              <div
                key={item.id}
                className="sidebar-impression text-white rounded-lg px-3 py-2 cursor-grab flex justify-between items-center shadow-sm transition-transform hover:scale-[1.02] active:cursor-grabbing"
                onDragStart={(event) => onDragStart(event, item.id, item.type)}
                draggable
                style={{
                  background: NodeBackgroundColors[item.type],
                  userSelect: 'none',
                }}
              >
                <span>{item.label}</span>
                <button
                  className="px-1 hover:bg-white/20 rounded transition-colors"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    useWorkingStore
                      .getState()
                      .removeImpression({ type: item.type, id: item.id });
                  }}
                >
                  ×
                </button>
              </div>
            ))}
        </div>
      </div>
    );
  };

  const buttons = [
    { icon: Plus, action: 'action', label: 'Add' },
    { icon: 'dots', action: 'options', label: 'Options' },
    { icon: 'save', action: 'save', label: 'Save' },
    { icon: 'contact', action: 'contact', label: 'Contact' },
    { icon: User, action: 'settings', label: 'Settings' },
  ];

  const DotsIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="5" cy="5" r="2" />
      <circle cx="12" cy="5" r="2" />
      <circle cx="19" cy="5" r="2" />
      <circle cx="5" cy="12" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="19" cy="12" r="2" />
      <circle cx="5" cy="19" r="2" />
      <circle cx="12" cy="19" r="2" />
      <circle cx="19" cy="19" r="2" />
    </svg>
  );

  const ButtonComponent = ({ icon, action, label }: { icon: any, action: string, label: string }) => {
    const isActive = activeButton === action;
    const isSettingsAction = action === 'settings';
    const isSaveAction = action === 'save';
    const isContactAction = action === 'contact';
    const isActionButton = action === 'action';
    const isOptionsButton = action === 'options';
    const showXForAction = isActionButton && showRelationshipTypeModal;
    const showXForOptions = isOptionsButton && isActive;
    
    return (
      <div className="relative" ref={isSettingsAction ? profileDropdownRef : null}>
        <button
          onClick={(e) => handleActionClick(action, e)}
          className={`
            group
            w-12 h-12 rounded-full 
            ${isActive && !isSaveAction && !isContactAction && !isActionButton
              ? 'bg-gray-800 text-white' 
              : showXForAction || showXForOptions
              ? 'bg-gray-800 text-white'
              : 'bg-white text-gray-700'
            }
            shadow-sm
            flex items-center justify-center
            transition-all duration-200
            ${isSettingsAction ? 'overflow-hidden' : ''}
            ${isSaveAction || isContactAction ? 'relative' : ''}
          `}
          title={label}
        >
          {showXForAction ? (
            <X className="w-6 h-6" />
          ) : showXForOptions ? (
            <X className="w-6 h-6" />
          ) : icon === 'dots' ? (
            <div className="group-hover:rotate-90 transition-transform">
              <DotsIcon />
            </div>
          ) : icon === Plus ? (
            <div className="group-hover:rotate-90 transition-transform">
              <Plus className="w-6 h-6" />
            </div>
          ) : isSaveAction ? (
            <>
              {(localIsSaving || isSaving) && !(localSaveCheck || saveCheck) ? (
                <LoaderCircle className="w-6 h-6 animate-spin" />
              ) : (localSaveCheck || saveCheck) ? (
                <Check className="w-6 h-6" />
              ) : (
                <>
                  <SaveAll className="w-6 h-6 opacity-0 group-hover:opacity-100 absolute" />
                  <Save className="w-6 h-6 opacity-100 group-hover:opacity-0" />
                </>
              )}
            </>
          ) : isContactAction ? (
            <>
              <MailPlus className="w-6 h-6 opacity-0 group-hover:opacity-100 absolute" />
              <Mail className="w-6 h-6 opacity-100 group-hover:opacity-0" />
            </>
          ) : isSettingsAction ? (
            session?.user?.image ? (
              <Image
                src={session.user.image}
                alt={session.user.name || "User"}
                width={48}
                height={48}
                className="rounded-full"
              />
            ) : (
              <User className="w-6 h-6" />
            )
          ) : null}
        </button>

        {/* Profile Dropdown */}
        {isSettingsAction && profileDropdownOpen && profileDropdownPosition && (
          <div 
            ref={(el) => {
              if (el && profileDropdownRef.current) {
                // Store reference to dropdown menu for click-outside detection
                (profileDropdownRef.current as any).dropdownMenu = el;
              }
            }}
            className={`fixed rounded-lg shadow-lg z-[100] ${
              darkMode 
                ? 'bg-gray-800 border border-gray-700' 
                : 'bg-white border border-gray-200'
            }`}
            style={{ 
              minWidth: '150px',
              top: `${profileDropdownPosition.top}px`,
              right: `${profileDropdownPosition.right}px`
            }}
          >
            <button
              onClick={() => {
                // Navigate to account settings
                setProfileDropdownOpen(false);
              }}
              className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 first:rounded-t-lg ${
                darkMode 
                  ? 'hover:bg-gray-700 text-white' 
                  : 'hover:bg-gray-100 text-gray-900'
              }`}
            >
              <Settings className="w-4 h-4" />
              Account
            </button>
            <button
              onClick={() => {
                router.push('/workspaces');
                setProfileDropdownOpen(false);
              }}
              className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${
                darkMode 
                  ? 'hover:bg-gray-700 text-white' 
                  : 'hover:bg-gray-100 text-gray-900'
              }`}
            >
              <Map className="w-4 h-4" />
              Workspaces
            </button>
            <button
              onClick={() => {
                toggleDarkMode(!darkMode);
                setProfileDropdownOpen(false);
              }}
              className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${
                darkMode 
                  ? 'hover:bg-gray-700 text-white' 
                  : 'hover:bg-gray-100 text-gray-900'
              }`}
            >
              {darkMode ? (
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
            <button
              onClick={() => {
                setShowFeedbackModal(true);
                setProfileDropdownOpen(false);
              }}
              className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${
                darkMode 
                  ? 'hover:bg-gray-700 text-white' 
                  : 'hover:bg-gray-100 text-gray-900'
              }`}
            >
              <HelpCircle className="w-4 h-4" />
              Help
            </button>
            <button
              onClick={async () => {
                await signOut({ callbackUrl: '/login' });
                setProfileDropdownOpen(false);
              }}
              className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 last:rounded-b-lg ${
                darkMode 
                  ? 'hover:bg-gray-700 text-white' 
                  : 'hover:bg-gray-100 text-gray-900'
              }`}
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {isSearchExpanded && (
        <div
          className="fixed inset-0 bg-black/35 backdrop-blur-[2px] transition-opacity duration-300 z-[76]"
          onClick={handleSearchClose}
        />
      )}

      {isSearchExpanded && chatboxPosition && (
        <div
          ref={searchBoxRef}
          className="fixed w-[320px] pointer-events-auto z-[80]"
          style={{
            top: `${chatboxPosition.top}px`,
            left: `${chatboxPosition.left}px`
          }}
        >
          <div className="relative w-full h-[60vh]  h-auto max-h-[600px] rounded-3xl overflow-hidden border flex flex-col bg-white border-gray-200 shadow-[0_18px_35px_rgba(105,99,255,0.18)]">
            <button
              onClick={handleSearchClose}
              className={`absolute top-2 right-2 p-1.5 rounded-lg transition-colors z-10 ${
                darkMode
                  ? "hover:bg-gray-700 text-gray-400 hover:text-white"
                  : "hover:bg-gray-100 text-gray-500 hover:text-gray-900"
              }`}
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex-1 px-6 pt-6 pb-4 flex flex-col min-h-0">
              <div>
                <p className={`text-[11px] tracking-[0.32em] uppercase ${darkMode ? "text-purple-500/80" : "text-purple-500/70"}`}>
                  Studio Assistant
                </p>
                <p className={`mt-3 text-sm leading-relaxed ${darkMode ? "text-gray-600" : "text-gray-500"}`}>
                  Ask for guidance, shortcuts, or reflections tailored to your Parts Studio flow.
                </p>
              </div>

              <div className="mt-5 space-y-3 flex-1 overflow-y-auto pr-1 min-h-0">
                {chatMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                        message.role === "user"
                          ? "bg-purple-500 text-white"
                          : "bg-gray-100 text-gray-800 border border-gray-200"
                      }`}
                    >
                      {message.content.trim().length > 0 ? message.content : "..."}
                    </div>
                  </div>
                ))}
                <div ref={chatMessagesEndRef} />
              </div>
            </div>

            <div className="px-6 pb-6 border-0">
                    <div className="relative">
                      <textarea
                        ref={expandedInputRef}
                        autoFocus
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') {
                            e.preventDefault();
                            setIsSearchExpanded(false);
                          } else if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendChat();
                          }
                        }}
                        placeholder="Ask me anything..."
                        className="w-full min-h-[56px] resize-none rounded-xl px-5 py-2 text-sm leading-5 focus:outline-none focus:ring-2 focus:ring-purple-400/60 focus:border-transparent bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400"
                      />
                    </div>
                  </div>
          </div>
        </div>
      )}
 
      {/* Plus button and 9 dots on the left */}
      <div className={`absolute top-4 left-4 flex flex-row gap-3 items-center`} 
      style={{ zIndex: showPartDetailImpressionInput ? 49 : (selectedPartId && windowWidth < 1400 ? 49 : (selectedPartId ? 51 : (showImpressionModal ? 49 : 50))), pointerEvents: (showImpressionModal || showPartDetailImpressionInput) ? 'none' : 'auto' }}>
        {/* Plus/X button - slides to end of options pill when menu opens */}
        <div
          className="relative"
          style={{
            transform: selectedPartId 
              ? 'translateX(0)' 
              : (showRelationshipTypeModal && menuWidthMeasured
                ? `translateX(calc(${menuWidthRef.current}px + 16px))` 
                : 'translateX(0)'),
            transition: 'transform 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
            zIndex: (showImpressionModal || showPartDetailImpressionInput) ? 30 : (showRelationshipTypeModal ? 76 : 75),
            pointerEvents: (showImpressionModal || showPartDetailImpressionInput) ? 'none' : 'auto'
          }}
        >
          <ButtonComponent icon={Plus} action="action" label="Add" />
        </div>
        
        {/* 9 dots button - stays to the right of +/X */}
        <div
          className="relative"
          style={{
            transform: selectedPartId 
              ? 'translateX(0)' 
              : (showRelationshipTypeModal && menuWidthMeasured
                ? `translateX(calc(${menuWidthRef.current}px + 16px))` 
                : 'translateX(0)'),
            transition: 'transform 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
            zIndex: (showImpressionModal || showPartDetailImpressionInput) ? 30 : (showRelationshipTypeModal ? 76 : 75),
            pointerEvents: (showImpressionModal || showPartDetailImpressionInput) ? 'none' : 'auto'
          }}
        >
          <ButtonComponent icon="dots" action="options" label="Options" />
        </div>
        
        {/* Impressions window underneath the + button */}
        {activeButton === 'action' && (
          <div 
            ref={impressionsRef} 
            className="absolute top-16 left-0 mt-2 bg-white rounded-lg shadow-xl h-[calc(100vh-160px)] overflow-hidden flex flex-col" 
            style={{ 
              zIndex: (showImpressionModal || showPartDetailImpressionInput) ? 30 : 75, 
              width: '313px',
              transform: 'scaleX(0)',
              transformOrigin: 'left center',
              animation: 'expandMenu 0.3s cubic-bezier(0.4, 0.0, 0.2, 1) forwards',
              pointerEvents: (showImpressionModal || showPartDetailImpressionInput) ? 'none' : 'auto'
            }}
          >
            <div className="pt-[10px] pb-[15px] px-[10px] h-full flex flex-col">
              <ImpressionDisplay />
            </div>
          </div>
        )}
      </div>

      {/* Quick Action Menu (shown when "Add" is clicked) - aligned with impression sidebar */}
      {showRelationshipTypeModal && !selectedPartId && (
        <div 
          ref={menuRef} 
          className="absolute top-4 z-50"
          style={{
            left: '16px', // Aligned with impression sidebar (left-4 = 16px)
            overflow: 'visible'
          }}
        >
          <div 
            className="bg-white rounded-full shadow-xl flex items-center overflow-hidden"
            style={{
              width: 'max-content',
              transform: 'scaleX(0)',
              transformOrigin: 'left center',
              animation: 'expandMenu 0.3s cubic-bezier(0.4, 0.0, 0.2, 1) forwards'
            }}
          >
            {/* Part option */}
            <button
              onMouseEnter={() => setHoveredOption('part')}
              onMouseLeave={() => setHoveredOption(null)}
              onClick={() => {
                createNode("part", "New Part");
                // Keep action button active so impressions sidebar stays open
                // Keep options menu open
              }}
              className="px-6 py-3 hover:bg-gray-50 transition-colors text-gray-700 font-medium flex items-center gap-2 relative"
            >
              Part
              <span className="h-6 px-2 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-700">
                Add
              </span>
            </button>
            
            <div className="w-px h-6 bg-gray-200" />
            
            {/* Relationship option */}
            <button
              onMouseEnter={() => setHoveredOption('relationship')}
              onMouseLeave={() => setHoveredOption(null)}
              onClick={() => {
                createNode("relationship", "Choose Relationship Type");
                // Keep action button active so impressions sidebar stays open
                // Keep options menu open
              }}
              className="px-6 py-3 hover:bg-gray-50 transition-colors text-gray-700 font-medium flex items-center gap-2 relative"
            >
              Relationship
              <span className="h-6 px-2 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-700">
                Add
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Right side: Assistant input and action buttons */}
      <div
        className="absolute top-4 right-4 flex flex-row gap-3 items-start z-50"
      >
        {/* Assistant input (hidden when chat open) */}
        <div ref={searchInputContainerRef} className="relative w-[320px] pointer-events-auto">
          <StudioSparkleInput
            inputRef={searchInputRef}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onFocus={() => setIsSearchExpanded(true)}
            onClick={() => setIsSearchExpanded(true)}
            placeholder="Ask the Studio Assistant"
            className={`${
              isSearchExpanded ? "opacity-0 pointer-events-none" : "opacity-100"
            } transition-opacity duration-200`}
          />
        </div>

        {/* Other action buttons */}
        <div className="flex flex-row gap-3 pointer-events-auto">
          {buttons
            .filter((b) => b.action !== "action" && b.action !== "options")
            .map(({ icon, action, label }) => (
              <ButtonComponent key={action} icon={icon} action={action} label={label} />
            ))}
        </div>
      </div>

    </>
  );
};

export default FloatingActionButtons;
