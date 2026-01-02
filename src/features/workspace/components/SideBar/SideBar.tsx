/**
 * @deprecated This file is deprecated and no longer in use.
 * The sidebar functionality has been moved to FloatingActionButtons.tsx.
 * This file is kept for reference but should not be used.
 */

"use client";

import Modal from "@/components/Modal";
import { useFlowNodesContext } from "@/features/workspace/state/FlowNodesContext";
import { useUIStore } from "@/features/workspace/state/stores/UI";
import { Plus, SquareUserRound, Users, Sword } from "lucide-react";
import { useMemo, useState, useEffect } from "react";

import ImpressionDisplay from "./Impressions/ImpressionSidebar";
import PartInput from "./PartInput";
import PartDetailPanel from "./PartDetailPanel";
import { NodeBackgroundColors } from "../../constants/Nodes";
import React from "react";
import FeedbackForm from "@/components/FeedbackForm";
import { useThemeContext } from "@/state/context/ThemeContext";
import { useTheme } from "@/features/workspace/hooks/useTheme";

const SideBar = () => {
  const { createNode } = useFlowNodesContext();
  const showPartModal = useUIStore((s) => s.showPartModal);
  const setShowPartModal = useUIStore((s) => s.setShowPartModal);
  const showImpressionModal = useUIStore((s) => s.showImpressionModal);
  const setShowImpressionModal = useUIStore((s) => s.setShowImpressionModal);
  const showFeedbackModal = useUIStore((s) => s.showFeedbackModal);
  const setShowFeedbackModal = useUIStore((s) => s.setShowFeedbackModal);
  const [showRelationshipTypeModal, setShowRelationshipTypeModal] = useState(false);
  const selectedPartId = useUIStore((s) => s.selectedPartId);
  const [shouldHideSidebar, setShouldHideSidebar] = useState(false);
  const { darkMode } = useThemeContext();
  const theme = useTheme();

  // Calculate if sidebar should be hidden due to part details panel collision
  useEffect(() => {
    if (!selectedPartId) {
      setShouldHideSidebar(false);
      return;
    }

    const checkCollision = () => {
      const windowWidth = window.innerWidth;
      const sidebarWidth = 230; // Sidebar is flex-[0_0_230px]
      const panelMaxWidth = 896; // max-w-5xl = 896px
      const panelPadding = 32; // p-4 = 16px on each side
      const buffer = 16; // Extra buffer for safety

      // When panel is at max width, it's centered
      // Panel left edge = (windowWidth - panelMaxWidth) / 2
      // They collide when: (windowWidth - panelMaxWidth) / 2 < sidebarWidth + buffer
      // Solving: windowWidth < panelMaxWidth + 2*(sidebarWidth + buffer) - panelPadding
      const collisionThreshold = panelMaxWidth + 2 * (sidebarWidth + buffer);

      // If panel would be smaller than max width due to padding, use actual width
      const actualPanelWidth = Math.min(panelMaxWidth, windowWidth - panelPadding);
      const panelLeftEdge = (windowWidth - actualPanelWidth) / 2;

      // Hide sidebar if panel would overlap with sidebar
      setShouldHideSidebar(panelLeftEdge < sidebarWidth + buffer);
    };

    checkCollision();
    window.addEventListener('resize', checkCollision);
    return () => window.removeEventListener('resize', checkCollision);
  }, [selectedPartId]);

  const CreateButtons = useMemo(
    () => (
      <div id="sidebar-buttons" className="mb-4">
        <button
          id="create-impression-button"
          onClick={() => setShowImpressionModal(true)}
          className="flex-1 w-full text-white font-medium shadow-md  rounded transition p-none flex justify-center items-center bg-[#45618a] items-center p-[5px] mb-[8px]"
        >
          Impression
          <Plus className="ml-1" size={20} strokeWidth={2} />
        </button>
        <div className="flex gap-2">
          <button
            id="create-part-button"
            onClick={() => setShowPartModal(true)}
            className={`flex-1 font-medium rounded shadow-md transition p-none flex justify-center items-center ${
              darkMode ? "text-white" : "text-black"
            }`}
            style={darkMode ? {
              backgroundColor: theme.button,
              boxShadow: "rgb(0 0 0 / 20%) 0px 2px 4px",
            } : {
              backgroundColor: 'white'
            }}
            onMouseEnter={(e) => {
              if (darkMode) {
                // Darken the button on hover by reducing RGB values
                const matches = theme.button.match(/\d+/g);
                if (matches && matches.length >= 3) {
                  const r = parseInt(matches[0]);
                  const g = parseInt(matches[1]);
                  const b = parseInt(matches[2]);
                  const darkerR = Math.max(0, r - 20);
                  const darkerG = Math.max(0, g - 20);
                  const darkerB = Math.max(0, b - 20);
                  e.currentTarget.style.backgroundColor = `rgb(${darkerR}, ${darkerG}, ${darkerB})`;
                }
              } else {
                e.currentTarget.style.backgroundImage = 'linear-gradient(to right, rgb(240, 249, 255), rgb(238, 242, 255), rgb(255, 241, 242))';
              }
            }}
            onMouseLeave={(e) => {
              if (darkMode) {
                e.currentTarget.style.backgroundColor = theme.button;
              } else {
                e.currentTarget.style.backgroundImage = 'none';
                e.currentTarget.style.backgroundColor = 'white';
              }
            }}
          >
            <SquareUserRound size={21} strokeWidth={2} className="mr-1" />
            <Plus size={20} strokeWidth={2} />
          </button>
          <button
            id="create-relationship-button"
            onClick={() => setShowRelationshipTypeModal(true)}
            style={{ 
              background: NodeBackgroundColors["tension"],
              ...(darkMode ? { boxShadow: "rgb(0 0 0 / 20%) 0px 2px 4px" } : {})
            }}
            className="flex-1 text-white font-medium rounded shadow-md shadow-black transition p-none flex justify-center items-center items-center p-[5px]"
            onMouseEnter={(e) => {
              if (darkMode) {
                // Darken the relationship button on hover
                const color = NodeBackgroundColors["tension"];
                if (color.startsWith('#')) {
                  const hex = color.replace('#', '');
                  const r = parseInt(hex.substr(0, 2), 16);
                  const g = parseInt(hex.substr(2, 2), 16);
                  const b = parseInt(hex.substr(4, 2), 16);
                  const darkerR = Math.max(0, r - 20);
                  const darkerG = Math.max(0, g - 20);
                  const darkerB = Math.max(0, b - 20);
                  e.currentTarget.style.backgroundColor = `rgb(${darkerR}, ${darkerG}, ${darkerB})`;
                }
              }
            }}
            onMouseLeave={(e) => {
              if (darkMode) {
                e.currentTarget.style.backgroundColor = NodeBackgroundColors["tension"];
              }
            }}
          >
            <Users size={20} strokeWidth={2} />
            <Plus className="ml-1" size={20} strokeWidth={2} />
          </button>
        </div>
      </div>
    ),
    [createNode, setShowImpressionModal, setShowPartModal]
  );

  return (
    <>
    
    </>
  );
};

export default React.memo(SideBar);
