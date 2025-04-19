import { create } from "zustand";
import { SidebarImpression } from "@/types/Sidebar";
import { ImpressionList } from "@/features/workspace/constants/Impressions";
import { ImpressionType } from "@/types/Impressions";

type SidebarStore = {
  impressions: Record<ImpressionType, Record<string, SidebarImpression>>;
  activeSidebarNode: SidebarImpression | null;
  addImpression: (item: SidebarImpression) => void;
  removeImpression: (type: ImpressionType, id: string) => void;
  populateImpressions: (
    impressions?: Record<ImpressionType, Record<string, SidebarImpression>>
  ) => void;
  setActiveSidebarNode: (nodeId: string | null, type: string) => void;
};

export const createEmptyImpressionGroups = (): Record<
  ImpressionType,
  Record<string, SidebarImpression>
> => {
  return Object.fromEntries(ImpressionList.map((type) => [type, {}])) as Record<
    ImpressionType,
    Record<string, SidebarImpression>
  >;
};

const impressions: Record<
  ImpressionType,
  Record<string, SidebarImpression>
> = createEmptyImpressionGroups();

export const useSidebarStore = create<SidebarStore>((set) => ({
  impressions,
  populateImpressions: (
    initImpressions?: Record<ImpressionType, Record<string, SidebarImpression>>
  ) =>
    set(() => ({
      impressions: initImpressions || createEmptyImpressionGroups(),
    })),
  activeSidebarNode: null,
  addImpression: (item) =>
    set((state) => ({
      impressions: {
        ...state.impressions,
        [item.type]: {
          ...state.impressions[item.type],
          [item.id]: item,
        },
      },
    })),
  removeImpression: (type, id) =>
    set((state) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [id]: _, ...rest } = state.impressions[type];
      return {
        impressions: {
          ...state.impressions,
          [type]: rest,
        },
      };
    }),
  setActiveSidebarNode: (nodeId, type) =>
    set((state) => {
      return {
        activeSidebarNode:
          nodeId !== null
            ? state.impressions[type as ImpressionType][nodeId]
            : null,
      };
    }),
}));
