import { SidebarImpression } from "@/features/workspace/types/Sidebar";
import { ImpressionType } from "@/features/workspace/types/Impressions";
import { create } from "zustand";
import { useWorkingStore } from "@/features/workspace/state/stores/useWorkingStore";

type SidebarStore = {
  activeSidebarNode: SidebarImpression | null;
  setActiveSidebarNode: (nodeId: string | null, type: ImpressionType) => void;
};

export const useSidebarStore = create<SidebarStore>((set) => ({
  get impressions() {
    return useWorkingStore.getState().sidebarImpressions;
  },
  activeSidebarNode: null,
  setActiveSidebarNode: (nodeId, type) =>
    set(() => {
      const impression =
        useWorkingStore.getState().sidebarImpressions?.[type]?.[nodeId || ""];
      return { activeSidebarNode: nodeId ? impression : null };
    }),
}));
