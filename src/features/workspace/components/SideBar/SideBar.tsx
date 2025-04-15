"use client";

import Modal from "@/components/Modal";
import { useFlowNodesContext } from "@/features/workspace/state/FlowNodesContext";
import { useUIStore } from "@/state/UI";
import { useReactFlow } from "@xyflow/react";
import { PersonStanding, Plus, ShieldAlert } from "lucide-react";
import { useMemo } from "react";

import ImpressionDisplay from "./Impressions/ImpressionDisplay";
import ImpressionInput from "./Impressions/ImpressionInput";
import PartInput from "./PartInput";

const SideBar = () => {
  const { getViewport } = useReactFlow();
  const { createNode } = useFlowNodesContext();
  const showPartModal = useUIStore((s) => s.showPartModal);
  const setShowPartModal = useUIStore((s) => s.setShowPartModal);
  const showImpressionModal = useUIStore((s) => s.showImpressionModal);
  const setShowImpressionModal = useUIStore((s) => s.setShowImpressionModal);

  const CreateButtons = useMemo(
    () => (
      <div className="mb-4">
        <div className="flex gap-2 mb-[8px]">
          <button
            onClick={() => setShowPartModal(true)}
            className="flex-1 bg-white font-medium rounded shadow transition p-none flex justify-center items-center "
            style={{
              color: "black",
            }}
          >
            <PersonStanding strokeWidth={3} />
            <Plus size={20} strokeWidth={2} />
          </button>
          <button
            onClick={() => {
              const viewport = getViewport();
              createNode("conflict", viewport, "Conflict");
            }}
            className="flex-1 text-white font-medium rounded shadow transition p-none flex justify-center items-center bg-[#d24c4c] items-center p-[5px]"
          >
            <ShieldAlert size={20} strokeWidth={2} />
            <Plus className="ml-1" size={20} strokeWidth={2} />
          </button>
        </div>

        <button
          onClick={() => setShowImpressionModal(true)}
          className="flex-1 w-full text-white font-medium rounded shadow transition p-none flex justify-center items-center bg-[#45618a] items-center p-[5px]"
        >
          Impression
          <Plus className="ml-1" size={20} strokeWidth={2} />
        </button>
      </div>
    ),
    [createNode, getViewport, setShowImpressionModal, setShowPartModal]
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

export default SideBar;
