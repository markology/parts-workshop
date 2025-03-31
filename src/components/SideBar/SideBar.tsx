import React, { useMemo } from "react";
import { PersonStanding, Plus } from "lucide-react";

import ImpressionInput from "./Impressions/ImpressionInput";
import ImpressionDisplay from "./Impressions/ImpressionDisplay";
import PartInput from "./Impressions/PartInput";
import Modal from "@/components/global/Modal";

import { useUIStore } from "@/stores/UI";

const SideBar = () => {
  const showPartModal = useUIStore((s) => s.showPartModal);
  const setShowPartModal = useUIStore((s) => s.setShowPartModal);
  const showImpressionModal = useUIStore((s) => s.showImpressionModal);
  const setShowImpressionModal = useUIStore((s) => s.setShowImpressionModal);

  const CreateButtons = useMemo(
    () => (
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setShowPartModal(true)}
          className="flex-2 bg-white font-medium rounded shadow transition p-none flex justify-center items-center"
          style={{
            color: "black",
          }}
        >
          <PersonStanding strokeWidth={3} />
          <Plus size={20} strokeWidth={2} />
        </button>

        <button
          onClick={() => setShowImpressionModal(true)}
          className="flex-4 text-white font-medium rounded shadow transition p-none flex justify-evenly bg-[#45618a] items-center p-[5px]"
        >
          Impression
          <Plus size={20} strokeWidth={2} />
        </button>
      </div>
    ),
    [setShowImpressionModal, setShowPartModal]
  );

  return (
    <aside id="sidebar">
      {CreateButtons}
      <ImpressionDisplay />
      {showPartModal && (
        <Modal show={showPartModal} onClose={() => setShowPartModal(false)}>
          <PartInput />
        </Modal>
      )}
      {showImpressionModal && (
        <Modal
          show={showImpressionModal}
          onClose={() => setShowImpressionModal(false)}
        >
          <ImpressionInput />
        </Modal>
      )}
    </aside>
  );
};

export default SideBar;
