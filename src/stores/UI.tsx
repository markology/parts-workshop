import { create } from "zustand";

type UIState = {
  selectedNodeId?: string;
  showPartModal: boolean;
  showImpressionModal: boolean;
  showConflictModal: boolean;
  // setSelectedNodeId: (id?: string) => void;
  setShowPartModal: (show: boolean) => void;
  setShowImpressionModal: (show: boolean) => void;
  setShowConflictModal: (show: boolean) => void;
};

export const useUIStore = create<UIState>((set) => ({
  // selectedNodeId: undefined,
  showPartModal: false,
  showImpressionModal: false,
  showConflictModal: false,
  // setSelectedNodeId: (id) => set({ selectedNodeId: id }),
  setShowPartModal: (show) => set({ showPartModal: show }),
  setShowImpressionModal: (show) => set({ showImpressionModal: show }),
  setShowConflictModal: (show) => set({ showConflictModal: show }),
}));
