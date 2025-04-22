import { create } from "zustand";
import { persist } from "zustand/middleware";
import { WorkshopNode } from "@/types/Nodes";
import { Edge } from "@xyflow/react";
import { SidebarImpression } from "@/types/Sidebar";
import { JournalEntry } from "@/types/Journal";
import { ImpressionType } from "@/types/Impressions";
import { ImpressionList } from "../constants/Impressions";

type WorkingState = {
  mapId: string;
  nodes: WorkshopNode[];
  edges: Edge[];
  sidebarImpressions: Record<ImpressionType, Record<string, SidebarImpression>>;
  journalEntries: JournalEntry[];
  updateJournal: (nodeId: string, content: string) => void;
  addImpression: ({ id, label, type }: SidebarImpression) => void;
  removeImpression: ({
    type,
    id,
  }: {
    type: ImpressionType;
    id: string;
  }) => void;
  setState: (s: Partial<WorkingState>) => void;
  hydrated: boolean;
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

export const useWorkingStore = create<WorkingState>()(
  persist(
    (set, get) => ({
      mapId: "",
      nodes: [],
      edges: [],
      sidebarImpressions: createEmptyImpressionGroups(),
      journalEntries: [],
      setState: (partial) => set((state) => ({ ...state, ...partial })),
      updateJournal: (nodeId, content) => {
        const updated = get().journalEntries.map((j) =>
          j.nodeId === nodeId ? { ...j, content } : j
        );
        set({ journalEntries: updated });
      },
      addImpression: ({ id, label, type }) =>
        set((state) => {
          return {
            sidebarImpressions: {
              ...state.sidebarImpressions,
              [type]: {
                ...state.sidebarImpressions[type],
                [id]: { id, label, type },
              },
            },
          };
        }),
      removeImpression: ({ type, id }) =>
        set((state) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { [id]: _, ...rest } = state.sidebarImpressions[type];
          return {
            sidebarImpressions: {
              ...state.sidebarImpressions,
              [type]: rest,
            },
          };
        }),

      hydrated: false,
    }),
    { name: "working-map" }
  )
);
