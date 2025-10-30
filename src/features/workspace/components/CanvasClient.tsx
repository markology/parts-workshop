"use client";

import { useEffect, useState, useRef } from "react";
import { useLoadMap } from "../state/hooks/useLoadMap";
import Canvas from "./Canvas";
import { useWorkingStore } from "../state/stores/useWorkingStore";
import { FlowNodesProvider } from "../state/FlowNodesContext";
import { useIsMobile } from "@/hooks/useIsMobile";
import OnboardingModal from "@/components/OboardingModal";
import { createEmptyImpressionGroups } from "../state/stores/useWorkingStore";
import FloatingActionButtons from "./FloatingActionButtons";
import PartInput from "./SideBar/PartInput";
import ImpressionInput from "./SideBar/Impressions/ImpressionInput";
import FeedbackForm from "@/components/FeedbackForm";
import Modal from "@/components/Modal";
import { useUIStore } from "../state/stores/UI";
import PartDetailPanel from "./SideBar/PartDetailPanel";
import { useSession, signOut } from "next-auth/react";
import { User, Settings, Moon, Mail, LogOut, HelpCircle } from "lucide-react";
import Image from "next/image";
// import TourOverlay from "./TourOverlay";

// Function to normalize sidebarImpressions data structure
const normalizeSidebarImpressions = (sidebarImpressions: any) => {
  if (!sidebarImpressions || typeof sidebarImpressions !== 'object') {
    return createEmptyImpressionGroups();
  }

  // Check if it's already in the correct format
  const expectedKeys = ['emotion', 'thought', 'sensation', 'behavior', 'other'];
  const hasExpectedKeys = expectedKeys.every(key => key in sidebarImpressions);
  
  if (hasExpectedKeys) {
    return sidebarImpressions;
  }

  // If it's an array or different structure, create empty structure
  return createEmptyImpressionGroups();
};

export default function CanvasClient({
  mapId,
  showOnboarding,
}: {
  mapId: string;
  showOnboarding: boolean;
}) {
  const { data, isLoading, error } = useLoadMap(mapId);
  const [hydrated, setHydrated] = useState(false);
  const isMobile = useIsMobile();
  const { data: session } = useSession();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [profileDropdownPosition, setProfileDropdownPosition] = useState<{ top: number; right: number } | null>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  
  // Use individual selectors - Zustand handles this efficiently with shallow comparison
  const showPartModal = useUIStore((s) => s.showPartModal);
  const setShowPartModal = useUIStore((s) => s.setShowPartModal);
  const showImpressionModal = useUIStore((s) => s.showImpressionModal);
  const setShowImpressionModal = useUIStore((s) => s.setShowImpressionModal);
  const showFeedbackModal = useUIStore((s) => s.showFeedbackModal);
  const setShowFeedbackModal = useUIStore((s) => s.setShowFeedbackModal);

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

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (data && typeof data === 'object' && 'id' in data) {
      const normalizedSidebarImpressions = normalizeSidebarImpressions(data.sidebarImpressions);

      // Clear the store completely before setting new data to prevent cross-map contamination
      useWorkingStore.getState().setState({
        mapId: "",
        nodes: [],
        edges: [],
        sidebarImpressions: createEmptyImpressionGroups(),
        journalEntries: [],
        hydrated: false,
      });

      // Then set the new map data
      useWorkingStore.getState().setState({
        mapId: data.id,
        nodes: data.nodes || [],
        edges: data.edges || [],
        sidebarImpressions: normalizedSidebarImpressions,
        journalEntries: data.journalEntries ?? [],
        hydrated: true,
      });

      setHydrated(true); // ✅ only now render FlowNodesProvider
    }
  }, [data, mapId]); // Added mapId dependency to ensure re-hydration on map change

  // Cleanup effect to clear store when component unmounts or mapId changes
  useEffect(() => {
    return () => {
      // Clear the store when leaving this map to prevent data leakage
      useWorkingStore.getState().setState({
        mapId: "",
        nodes: [],
        edges: [],
        sidebarImpressions: createEmptyImpressionGroups(),
        journalEntries: [],
        hydrated: false,
      });
    };
  }, [mapId]);

  if (typeof window !== "undefined") {
    window.onerror = function (msg, url, lineNo, columnNo, error) {
      document.body.innerHTML = `
        <pre style="white-space: pre-wrap; font-size: 14px;">
          ⚠️ JS Error:
          ${msg}
          At: ${url}:${lineNo}:${columnNo}
          ${error?.stack || ""}
        </pre>
      `;
      return false;
    };
  }

  if (isLoading || !data || !hydrated) {
    return <p>Loading workspace...</p>;
  }
  if (error) {
    return <p>Failed to load map.</p>;
  }
  // const showTour = !map;

  return (
    <FlowNodesProvider>
      {showOnboarding && <OnboardingModal />}
      {/* <TourOverlay /> */}
      <FloatingActionButtons />
      <Canvas />
      <PartDetailPanel />
      
      {/* Modals for actions */}
      <Modal show={showPartModal} onClose={() => setShowPartModal(false)}>
        <PartInput />
      </Modal>
      
      <Modal
        show={showImpressionModal}
        onClose={() => setShowImpressionModal(false)}
      >
        <ImpressionInput />
      </Modal>
      
      <Modal
        show={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        width="auto"
      >
        <FeedbackForm />
      </Modal>
    </FlowNodesProvider>
  ); // now fully local + Zustand-based
}
