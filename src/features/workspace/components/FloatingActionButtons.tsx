"use client";

import { Plus, Settings, X, Minus, User, Moon, Sun, LogOut, Save, SaveAll, Check, LoaderCircle, MailPlus, Mail, Map } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUIStore } from "../state/stores/UI";
import { useFlowNodesActions } from "../state/FlowNodesContext";
import { ImpressionList } from "@/features/workspace/constants/Impressions";
import { ImpressionType } from "@/features/workspace/types/Impressions";
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
  const [hoveredOption, setHoveredOption] = useState<string | null>(null);
  const [impressionDropdownStates, setImpressionDropdownStates] = useState<Partial<Record<ImpressionType, boolean>>>({
    emotion: true,
    thought: true,
    sensation: true,
    behavior: true,
    other: true,
  });
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
  const setShowImpressionModal = useUIStore((s) => s.setShowImpressionModal);
  const setShowFeedbackModal = useUIStore((s) => s.setShowFeedbackModal);
  const [showRelationshipTypeModal, setShowRelationshipTypeModal] = useState(true);
  const { isSaving, saveCheck } = useAutoSave();
  const saveMap = useSaveMap();
  const [localIsSaving, setLocalIsSaving] = useState(false);
  const [localSaveCheck, setLocalSaveCheck] = useState(false);
  
  const impressions = useWorkingStore((s) => s.sidebarImpressions);
  const { setActiveSidebarNode } = useSidebarStore();
  
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
    event.stopPropagation(); // critical if React Flow is interfering
    
    // Get the impression data
    const impression = impressions[type]?.[draggableId];
    
    if (!impression) {
      console.error('Impression not found:', type, draggableId);
      return;
    }

    // Set data for drop handling
    event.dataTransfer.setData(
      "parts-workshop/sidebar-impression",
      JSON.stringify({ type, id: draggableId })
    );

    // set ActiveSideBarNode - pass the full impression with label
    setActiveSidebarNode(draggableId, type);
    event.dataTransfer.effectAllowed = "move";
    
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
    
    if (action === 'save') {
      // Save functionality - just execute, don't change active button state
      handleSaveAndCleanup();
      return;
    }
    
    if (action === 'contact') {
      // Contact/Feedback functionality - open modal and reset to action button
      setShowFeedbackModal(true);
      setActiveButton('action');
      return;
    }
    
    if (action === 'settings') {
      // Toggle profile dropdown - don't change activeButton state
      setProfileDropdownOpen(!profileDropdownOpen);
      return;
    }

    if (action === 'action') {
      // Toggle everything: if active, close both menu and sidebar. If not active, open both.
      if (activeButton === 'action') {
        // Close everything: sidebar and menu
        setActiveButton(null);
        setShowRelationshipTypeModal(false);
      } else {
        // Open everything: sidebar and menu
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
                draggable="true"
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
    
    return (
      <div className="relative" ref={isSettingsAction ? profileDropdownRef : null}>
        <button
          onClick={(e) => handleActionClick(action, e)}
          className={`
            group
            w-12 h-12 rounded-full 
            ${isActive && !isSaveAction && !isContactAction
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
          {isActive && !isSettingsAction && !isSaveAction && !isContactAction ? (
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
                router.push('/workspace');
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
      {/* Plus button on the left */}
      <div className="absolute top-4 left-4 z-50">
        <ButtonComponent icon={Plus} action="action" label="Add" />
        
        {/* Impressions window underneath the + button */}
        {activeButton === 'action' && (
          <div 
            ref={impressionsRef} 
            className="absolute top-16 left-0 mt-2 bg-white rounded-lg shadow-xl p-4 w-64 h-[calc(100vh-160px)] overflow-auto" 
            style={{ zIndex: 40 }}
          >
            <div className="space-y-2">
              {ImpressionList.filter(type => type !== 'default').map((type) => (
                <ImpressionDropdown
                  key={type}
                  type={type}
                  filteredImpressions={impressions[type] || {}}
                  onDragStart={onDragStart}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Other 3 buttons on the right */}
      <div className="absolute top-4 right-4 z-50 flex flex-row gap-3">
        {buttons.filter(b => b.action !== 'action').map(({ icon, action, label }) => (
          <ButtonComponent key={action} icon={icon} action={action} label={label} />
        ))}
      </div>

      {/* Quick Action Menu (shown when "Add" is clicked) */}
      {showRelationshipTypeModal && (
        <div ref={menuRef} className="absolute top-4 left-20 z-50">
          <div className="bg-white rounded-full shadow-xl flex items-center overflow-hidden">
            {/* Part option */}
            <button
              onMouseEnter={() => setHoveredOption('part')}
              onMouseLeave={() => setHoveredOption(null)}
              onClick={() => {
                setShowPartModal(true);
                setShowRelationshipTypeModal(false);
                // Keep action button active so impressions sidebar stays open
              }}
              className="px-6 py-3 hover:bg-gray-50 transition-colors text-gray-700 font-medium flex items-center gap-2 relative"
            >
              Part
              <span className="w-4 h-4 flex items-center justify-center">
                <Plus className={`w-4 h-4 transition-colors ${hoveredOption === 'part' ? 'text-gray-700' : 'text-gray-400'}`} />
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
              <span className="w-4 h-4 flex items-center justify-center">
                <Plus className={`w-4 h-4 transition-colors ${hoveredOption === 'relationship' ? 'text-gray-700' : 'text-gray-400'}`} />
              </span>
            </button>
            
            <div className="w-px h-6 bg-gray-200" />
            
            {/* Impressions option */}
            <button
              onMouseEnter={() => setHoveredOption('impressions')}
              onMouseLeave={() => setHoveredOption(null)}
              onClick={() => {
                setShowImpressionModal(true);
                // Keep options menu open - don't close it
                // Keep action button active so impressions sidebar stays open
              }}
              className="px-6 py-3 hover:bg-gray-50 transition-colors text-gray-700 font-medium flex items-center gap-2 relative"
            >
              Impressions
              <span className="w-4 h-4 flex items-center justify-center">
                <Plus className={`w-4 h-4 transition-colors ${hoveredOption === 'impressions' ? 'text-gray-700' : 'text-gray-400'}`} />
              </span>
            </button>
          </div>
        </div>
      )}

    </>
  );
};

export default FloatingActionButtons;
