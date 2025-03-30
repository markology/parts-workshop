import React from "react";
import ImpressionInput from "./Impressions/ImpressionInput";
import ImpressionDisplay from "./Impressions/ImpressionDisplay";
import PartInput from "./Impressions/PartInput";
import Modal from "../global/Modal";

import { useUIStore } from "@/stores/UI";
import { PersonStanding, Plus } from "lucide-react";

const SideBar = () => {
  const showPartModal = useUIStore((s) => s.showPartModal);
  const setShowPartModal = useUIStore((s) => s.setShowPartModal);
  const showImpressionModal = useUIStore((s) => s.showImpressionModal);
  const setShowImpressionModal = useUIStore((s) => s.setShowImpressionModal);

  return (
    <aside id="sidebar">
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setShowPartModal(true)}
          className="flex-2 text-white font-medium rounded shadow transition p-none flex justify-center"
          style={{
            alignItems: "center",
            background: "#ffffff",
            color: "#000000",
          }}
        >
          <PersonStanding strokeWidth={3} />
          <Plus size={20} strokeWidth={2} />
        </button>

        <button
          onClick={() => setShowImpressionModal(true)}
          className="flex-4 text-white font-medium rounded shadow transition p-none flex justify-evenly bg-[#45618a]"
          style={{ alignItems: "center", padding: "5px" }}
        >
          Impression
          <Plus size={20} strokeWidth={2} />
        </button>
      </div>

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
