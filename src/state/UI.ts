import { create } from "zustand";

type UIState = {
  isRightClickMenuOpen: boolean;
  isEditing: boolean;
  isSavingMap: boolean;
  selectedNodeId?: string;
  showPartModal: boolean;
  showImpressionModal: boolean;
  showConflictModal: boolean;
  setIsEditing: (show: boolean) => void;
  setIsSavingMap: (saving: boolean) => void;
  setRightClickMenuOpen: (show: boolean) => void;
  setShowPartModal: (show: boolean) => void;
  setShowImpressionModal: (show: boolean) => void;
  setShowConflictModal: (show: boolean) => void;
};

export const useUIStore = create<UIState>((set) => ({
  showPartModal: false,
  showImpressionModal: false,
  showConflictModal: false,
  isRightClickMenuOpen: false,
  isEditing: false,
  isSavingMap: false,
  setShowPartModal: (show) => set({ showPartModal: show }),
  setShowImpressionModal: (show) => set({ showImpressionModal: show }),
  setShowConflictModal: (show) => set({ showConflictModal: show }),
  setRightClickMenuOpen: (show) => set({ isRightClickMenuOpen: show }),
  setIsEditing: (show) => set({ isEditing: show }),
  setIsSavingMap: (saving) => set({ isSavingMap: saving }),
}));
