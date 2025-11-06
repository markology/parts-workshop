"use client";

import Modal from "@/components/Modal";
import { useFlowNodesContext } from "@/features/workspace/state/FlowNodesContext";
import { useUIStore } from "@/features/workspace/state/stores/UI";
import { Plus, SquareUserRound, Users, Sword, Sparkles, X } from "lucide-react";
import { useMemo, useState, useEffect } from "react";

import ImpressionDisplay from "./Impressions/ImpressionDisplay";
import ImpressionInput from "./Impressions/ImpressionInput";
import PartInput from "./PartInput";
import PartDetailPanel from "./PartDetailPanel";
import { NodeBackgroundColors, NodeTextColors } from "../../constants/Nodes";
import React from "react";
import FeedbackForm from "@/components/FeedbackForm";
import { useThemeContext } from "@/state/context/ThemeContext";
import { ImpressionType, ImpressionTextType } from "@/features/workspace/types/Impressions";

const SideBar = () => {
  const { createNode } = useFlowNodesContext();
  const showPartModal = useUIStore((s) => s.showPartModal);
  const setShowPartModal = useUIStore((s) => s.setShowPartModal);
  const showImpressionModal = useUIStore((s) => s.showImpressionModal);
  const setShowImpressionModal = useUIStore((s) => s.setShowImpressionModal);
  const showFeedbackModal = useUIStore((s) => s.showFeedbackModal);
  const setShowFeedbackModal = useUIStore((s) => s.setShowFeedbackModal);
  const [showRelationshipTypeModal, setShowRelationshipTypeModal] = useState(false);
  const { darkMode } = useThemeContext();

  const [sidebarImpressionType, setSidebarImpressionType] = useState<ImpressionType>("emotion");

  useEffect(() => {
    if (showImpressionModal) {
      setSidebarImpressionType("emotion");
    }
  }, [showImpressionModal]);

  const toRgba = (hex: string, opacity: number) => {
    if (!hex) return `rgba(99, 102, 241, ${opacity})`;
    const sanitized = hex.replace("#", "");
    const bigint = parseInt(sanitized, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  const accentHex =
    NodeBackgroundColors[sidebarImpressionType as keyof typeof NodeBackgroundColors] ?? "#6366f1";
  const accentTextHex =
    NodeTextColors[sidebarImpressionType as keyof typeof NodeTextColors] ?? "#312e81";
  const accentSoftBg = toRgba(accentHex, darkMode ? 0.26 : 0.14);
  const accentBorder = toRgba(accentHex, darkMode ? 0.55 : 0.28);
  const accentGlow = toRgba(accentHex, darkMode ? 0.42 : 0.24);
  const impressionTypeLabel =
    ImpressionTextType[sidebarImpressionType] ?? "Impression";

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
            style={{ background: NodeBackgroundColors["conflict"] }}
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
      <aside className="bg-aside flex-[0_0_230px] p-[15px_10px] shadow-[var(--aside-shadow)_0px_0px_10px_0px] z-[70]">
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
                  createNode("conflict", "Conflict", undefined, undefined, { relationshipType: "conflict" });
                  setShowRelationshipTypeModal(false);
                }}
                className="flex-1 p-4 rounded-lg border-2 border-purple-200 bg-purple-50 hover:bg-purple-100 transition-colors"
              >
                <div className="flex flex-col items-center gap-2">
                  <Sword size={24} className="text-purple-600" />
                  <span className="font-semibold text-purple-800">Conflict</span>
                  <span className="text-xs text-purple-600">Parts in opposition</span>
                </div>
              </button>
              <button
                onClick={() => {
                  createNode("ally", "Ally", undefined, undefined, { relationshipType: "ally" });
                  setShowRelationshipTypeModal(false);
                }}
                className="flex-1 p-4 rounded-lg border-2 border-sky-200 bg-sky-50 hover:bg-sky-100 transition-colors"
              >
                <div className="flex flex-col items-center gap-2">
                  <Users size={24} className="text-sky-600" />
                  <span className="font-semibold text-sky-800">Ally</span>
                  <span className="text-xs text-sky-600">Parts working together</span>
                </div>
              </button>
            </div>
          </div>
        </Modal>
      </aside>
      
      {/* Part Detail Panel */}
      <PartDetailPanel />
      {showImpressionModal && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center px-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowImpressionModal(false);
            }
          }}
        >
          <div
            className={`absolute inset-0 pointer-events-none ${
              darkMode ? "bg-slate-950/70" : "bg-slate-900/20"
            } backdrop-blur-sm`}
          />
          <div
            className="relative w-full max-w-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={`relative overflow-hidden rounded-[28px] border ${
                darkMode
                  ? "border-slate-700/60 bg-slate-900/85"
                  : "border-slate-200/80 bg-white/95"
              } shadow-[0_30px_70px_rgba(15,23,42,0.36)]`}
            >
              <div
                className="pointer-events-none absolute inset-x-16 -top-40 h-64 rounded-full blur-3xl"
                style={{ backgroundColor: accentGlow }}
              />
              <div className="relative px-8 pt-8 pb-6 space-y-7">
                <div className="flex items-start justify-between gap-6">
                  <div className="space-y-3">
                    <span
                      className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.28em]"
                      style={{
                        backgroundColor: accentSoftBg,
                        color: accentTextHex,
                      }}
                    >
                      <Sparkles size={14} />
                      {impressionTypeLabel}
                    </span>
                    <div>
                      <h3
                        className={`text-2xl font-semibold ${
                          darkMode ? "text-white" : "text-slate-900"
                        }`}
                      >
                        Capture a new {impressionTypeLabel.toLowerCase()}
                      </h3>
                        <p
                          className={`mt-2 text-sm leading-relaxed ${
                            darkMode ? "text-slate-300" : "text-slate-600"
                          }`}
                        >
                          Share what this impression wants to express.
                        </p>
                        <div className={`mt-3 flex items-center gap-3 flex-wrap ${
                          darkMode ? "text-slate-400" : "text-slate-500"
                        }`}>
                          <div className="flex items-center gap-1.5">
                            <kbd className={`px-2 py-1 rounded text-[10px] font-semibold ${
                              darkMode ? "bg-slate-800 border border-slate-700 text-slate-300" : "bg-slate-100 border border-slate-200 text-slate-700"
                            }`}>
                              Tab
                            </kbd>
                            <span className="text-xs">Switch types</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <kbd className={`px-2 py-1 rounded text-[10px] font-semibold ${
                              darkMode ? "bg-slate-800 border border-slate-700 text-slate-300" : "bg-slate-100 border border-slate-200 text-slate-700"
                            }`}>
                              Enter
                            </kbd>
                            <span className="text-xs">Submit</span>
                          </div>
                        </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowImpressionModal(false)}
                    className={`h-10 w-10 flex items-center justify-center rounded-full border transition-colors ${
                      darkMode
                        ? "border-slate-700 text-slate-300 hover:bg-slate-800/70"
                        : "border-slate-200 text-slate-500 hover:bg-slate-100"
                    }`}
                    aria-label="Close"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div
                  className="rounded-2xl border px-6 py-6 shadow-inner"
                  style={{
                    backgroundColor: accentSoftBg,
                    borderColor: accentBorder,
                  }}
                >
                  <ImpressionInput
                    onTypeChange={(type) => setSidebarImpressionType(type)}
                    defaultType={sidebarImpressionType}
                  />
                </div>

                <div
                  className={`flex items-center gap-3 rounded-2xl border px-5 py-4 text-sm ${
                    darkMode
                      ? "border-slate-700/60 bg-slate-900/60 text-slate-300"
                      : "border-slate-200 bg-slate-50 text-slate-600"
                  }`}
                >
                  <Sparkles
                    size={16}
                    className={darkMode ? "text-slate-200" : "text-slate-500"}
                  />
                  <p className="leading-relaxed">
                    We’ll add this impression to your canvas immediately so you can connect it with parts and relationships.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default React.memo(SideBar);
