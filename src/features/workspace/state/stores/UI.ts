import { create } from "zustand";

type UIState = {
  contextMenuParentNodeId: string;
  isEditing: boolean;
  selectedNodeId?: string;
  selectedPartId?: string;
  showPartModal: boolean;
  showFeedbackModal: boolean;
  showImpressionModal: boolean;
  showPartDetailImpressionInput: boolean;
  shouldCollapseSidebar: boolean;
  shouldAutoEditPart: boolean;
  impressionModalTargetPartId?: string; // If set, modal adds to this part instead of sidebar
  impressionModalType?: string; // The impression type to default to
  setIsEditing: (show: boolean) => void;
  setContextMenuParentNodeId: (id: string) => void;
  setSelectedPartId: (id: string | undefined) => void;
  setShowPartModal: (show: boolean) => void;
  setShowFeedbackModal: (show: boolean) => void;
  setShowImpressionModal: (show: boolean) => void;
  setShowPartDetailImpressionInput: (show: boolean) => void;
  setShouldCollapseSidebar: (should: boolean) => void;
  setShouldAutoEditPart: (should: boolean) => void;
  setImpressionModalTarget: (partId: string | undefined, type?: string) => void;
};

export const useUIStore = create<UIState>((set) => ({
  showPartModal: false,
  showImpressionModal: false,
  showFeedbackModal: false,
  showPartDetailImpressionInput: false,
  contextMenuParentNodeId: "",
  isEditing: false,
  selectedPartId: undefined,
  shouldCollapseSidebar: false,
  shouldAutoEditPart: false,
  impressionModalTargetPartId: undefined,
  impressionModalType: undefined,
  setShowPartModal: (show) => set({ showPartModal: show }),
  setShowFeedbackModal: (show) => set({ showFeedbackModal: show }),
  setShowImpressionModal: (show) => {
    set({ showImpressionModal: show });
    // Clear target when closing modal
    if (!show) {
      set({ impressionModalTargetPartId: undefined, impressionModalType: undefined });
    }
  },
  setShowPartDetailImpressionInput: (show) => set({ showPartDetailImpressionInput: show }),
  setContextMenuParentNodeId: (id) => set({ contextMenuParentNodeId: id }),
  setIsEditing: (show) => set({ isEditing: show }),
  setSelectedPartId: (id) => set({ selectedPartId: id }),
  setShouldCollapseSidebar: (should) => set({ shouldCollapseSidebar: should }),
  setShouldAutoEditPart: (should) => set({ shouldAutoEditPart: should }),
  setImpressionModalTarget: (partId, type) => set({ impressionModalTargetPartId: partId, impressionModalType: type }),
}));
