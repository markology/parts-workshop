"use client";

import Modal from "@/components/Modal";
import { useFlowNodesContext } from "@/features/workspace/state/FlowNodesContext";
import { useUIStore } from "@/state/UI";
import { MessageCircleWarning, Plus, SquareUserRound } from "lucide-react";
import { useMemo } from "react";

import ImpressionDisplay from "./Impressions/ImpressionDisplay";
import ImpressionInput from "./Impressions/ImpressionInput";
import PartInput from "./PartInput";
import { NodeBackgroundColors } from "../../constants/Nodes";
import React from "react";

const SideBar = () => {
  const { createNode } = useFlowNodesContext();
  const showPartModal = useUIStore((s) => s.showPartModal);
  const setShowPartModal = useUIStore((s) => s.setShowPartModal);
  const showImpressionModal = useUIStore((s) => s.showImpressionModal);
  const setShowImpressionModal = useUIStore((s) => s.setShowImpressionModal);

  const CreateButtons = useMemo(
    () => (
      <div id="sidebar-buttons" className="mb-4">
        <div className="flex gap-2 mb-[8px]">
          <button
            id="create-part-button"
            onClick={() => setShowPartModal(true)}
            className="flex-1 bg-white font-medium rounded shadow transition p-none flex justify-center items-center "
            style={{
              color: "black",
            }}
          >
            <SquareUserRound size={21} strokeWidth={2} className="mr-1" />
            <Plus size={20} strokeWidth={2} />
          </button>
          <button
            id="create-conflict-button"
            onClick={() => {
              createNode("conflict", "Conflict");
            }}
            style={{ background: NodeBackgroundColors["conflict"] }}
            className="flex-1 text-white font-medium rounded shadow transition p-none flex justify-center items-center items-center p-[5px]"
          >
            <MessageCircleWarning size={20} strokeWidth={2} />
            <Plus className="ml-1" size={20} strokeWidth={2} />
          </button>
        </div>

        <button
          id="create-impression-button"
          onClick={() => setShowImpressionModal(true)}
          className="flex-1 w-full text-white font-medium rounded shadow transition p-none flex justify-center items-center bg-[#45618a] items-center p-[5px]"
        >
          Impression
          <Plus className="ml-1" size={20} strokeWidth={2} />
        </button>
      </div>
    ),
    [createNode, setShowImpressionModal, setShowPartModal]
  );

  return (
    <aside id="sidebar">
      {CreateButtons}
      <ImpressionDisplay />

      {/* Part Input Modal */}
      <Modal show={showPartModal} onClose={() => setShowPartModal(false)}>
        <PartInput />
      </Modal>
      {/* Impression Input Modal */}
      <Modal
        show={showImpressionModal}
        onClose={() => setShowImpressionModal(false)}
      >
        <ImpressionInput />
      </Modal>
    </aside>
  );
};

export default React.memo(SideBar);
