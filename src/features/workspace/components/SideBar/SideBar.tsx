"use client";

import Modal from "@/components/Modal";
import { useFlowNodesContext } from "@/features/workspace/state/FlowNodesContext";
import { useUIStore } from "@/features/workspace/state/stores/UI";
import { Plus, SquareUserRound, Users, Sword } from "lucide-react";
import { useMemo, useState, useEffect } from "react";

import ImpressionDisplay from "./Impressions/ImpressionDisplay";
import PartInput from "./PartInput";
import PartDetailPanel from "./PartDetailPanel";
import { NodeBackgroundColors } from "../../constants/Nodes";
import React from "react";
import FeedbackForm from "@/components/FeedbackForm";

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
            className="flex-1 bg-white font-medium rounded shadow-md transition p-none flex justify-center items-center text-black"
          >
            <SquareUserRound size={21} strokeWidth={2} className="mr-1" />
            <Plus size={20} strokeWidth={2} />
          </button>
          <button
            id="create-relationship-button"
            onClick={() => setShowRelationshipTypeModal(true)}
            style={{ background: NodeBackgroundColors["tension"] }}
            className="flex-1 text-white font-medium rounded shadow-md shadow-black transition p-none flex justify-center items-center items-center p-[5px]"
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
      <aside 
        className={`bg-aside flex-[0_0_230px] p-[15px_10px] shadow-[var(--aside-shadow)_0px_0px_10px_0px] z-[70] transition-opacity duration-300 ${
          shouldHideSidebar ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
        {CreateButtons}
        <ImpressionDisplay />

        {/* Part Input Modal */}
        <Modal show={showPartModal} onClose={() => setShowPartModal(false)}>
          <PartInput />
        </Modal>
        <Modal
          show={showFeedbackModal}
          onClose={() => setShowFeedbackModal(false)}
          width="auto"
        >
          <FeedbackForm />
        </Modal>

        {/* Relationship Type Selection Modal */}
        <Modal
          show={showRelationshipTypeModal}
          onClose={() => setShowRelationshipTypeModal(false)}
          width="auto"
        >
          <div className="p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Choose Relationship Type</h3>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  createNode("tension", "Tension", undefined, undefined, { relationshipType: "tension" });
                  setShowRelationshipTypeModal(false);
                }}
                className="flex-1 p-4 rounded-lg border-2 border-purple-200 bg-purple-50 hover:bg-purple-100 transition-colors"
              >
                <div className="flex flex-col items-center gap-2">
                  <Sword size={24} className="text-purple-600" />
                  <span className="font-semibold text-purple-800">Tension</span>
                  <span className="text-xs text-purple-600">Parts in opposition</span>
                </div>
              </button>
              <button
                onClick={() => {
                  createNode("interaction", "Interaction", undefined, undefined, { relationshipType: "interaction" });
                  setShowRelationshipTypeModal(false);
                }}
                className="flex-1 p-4 rounded-lg border-2 border-sky-200 bg-sky-50 hover:bg-sky-100 transition-colors"
              >
                <div className="flex flex-col items-center gap-2">
                  <Users size={24} className="text-sky-600" />
                  <span className="font-semibold text-sky-800">Interaction</span>
                  <span className="text-xs text-sky-600">Parts working together</span>
                </div>
              </button>
            </div>
          </div>
        </Modal>
      </aside>
      
      {/* Part Detail Panel */}
      <PartDetailPanel />
    </>
  );
};

export default React.memo(SideBar);
