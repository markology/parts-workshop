import { create } from "zustand";

type UIState = {
  contextMenuParentNodeId: string;
  isEditing: boolean;
  isSavingMap: boolean;
  selectedNodeId?: string;
  showPartModal: boolean;
  showImpressionModal: boolean;
  showConflictModal: boolean;
  setIsEditing: (show: boolean) => void;
  setIsSavingMap: (saving: boolean) => void;
  setContextMenuParentNodeId: (id: string) => void;
  setShowPartModal: (show: boolean) => void;
  setShowImpressionModal: (show: boolean) => void;
  setShowConflictModal: (show: boolean) => void;
};

export const useUIStore = create<UIState>((set) => ({
  showPartModal: false,
  showImpressionModal: false,
  showConflictModal: false,
  contextMenuParentNodeId: "",
  isEditing: false,
  isSavingMap: false,
  setShowPartModal: (show) => set({ showPartModal: show }),
  setShowImpressionModal: (show) => set({ showImpressionModal: show }),
  setShowConflictModal: (show) => set({ showConflictModal: show }),
  setContextMenuParentNodeId: (id) => set({ contextMenuParentNodeId: id }),
  setIsEditing: (show) => set({ isEditing: show }),
  setIsSavingMap: (saving) => set({ isSavingMap: saving }),
}));
