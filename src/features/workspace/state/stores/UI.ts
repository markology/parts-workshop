import { create } from "zustand";

type UIState = {
  contextMenuParentNodeId: string;
  isEditing: boolean;
  selectedNodeId?: string;
  selectedPartId?: string;
  showPartModal: boolean;
  showFeedbackModal: boolean;
  showImpressionModal: boolean;
  setIsEditing: (show: boolean) => void;
  setContextMenuParentNodeId: (id: string) => void;
  setSelectedPartId: (id: string | undefined) => void;
  setShowPartModal: (show: boolean) => void;
  setShowFeedbackModal: (show: boolean) => void;
  setShowImpressionModal: (show: boolean) => void;
};

export const useUIStore = create<UIState>((set) => ({
  showPartModal: false,
  showImpressionModal: false,
  showFeedbackModal: false,
  contextMenuParentNodeId: "",
  isEditing: false,
  selectedPartId: undefined,
  setShowPartModal: (show) => set({ showPartModal: show }),
  setShowFeedbackModal: (show) => set({ showFeedbackModal: show }),
  setShowImpressionModal: (show) => set({ showImpressionModal: show }),
  setContextMenuParentNodeId: (id) => set({ contextMenuParentNodeId: id }),
  setIsEditing: (show) => set({ isEditing: show }),
  setSelectedPartId: (id) => set({ selectedPartId: id }),
}));
