import { create } from "zustand";

type UIState = {
  isRightClickMenuOpen: boolean;
  selectedNodeId?: string;
  showPartModal: boolean;
  showImpressionModal: boolean;
  showConflictModal: boolean;
  // setSelectedNodeId: (id?: string) => void;
  setRightClickMenuOpen: (show: boolean) => void;
  setShowPartModal: (show: boolean) => void;
  setShowImpressionModal: (show: boolean) => void;
  setShowConflictModal: (show: boolean) => void;
};

export const useUIStore = create<UIState>((set) => ({
  // selectedNodeId: undefined,
  showPartModal: false,
  showImpressionModal: false,
  showConflictModal: false,
  isRightClickMenuOpen: false,
  // setSelectedNodeId: (id) => set({ selectedNodeId: id }),
  setShowPartModal: (show) => set({ showPartModal: show }),
  setShowImpressionModal: (show) => set({ showImpressionModal: show }),
  setShowConflictModal: (show) => set({ showConflictModal: show }),
  setRightClickMenuOpen: (show) => set({ isRightClickMenuOpen: show }),
}));
