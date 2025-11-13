import { createIndexedDbStorage } from "@/features/workspace/state/lib/indexedDbStorage";
import { ImpressionType } from "@/features/workspace/types/Impressions";
import { JournalEntry } from "@/features/workspace/types/Journal";
import { WorkshopNode } from "@/features/workspace/types/Nodes";
import { SidebarImpression } from "@/features/workspace/types/Sidebar";
import { Edge } from "@xyflow/react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

import { ImpressionList } from "../../constants/Impressions";

type WorkingState = {
  mapId: string;
  nodes: WorkshopNode[];
  edges: Edge[];
  sidebarImpressions: Record<ImpressionType, Record<string, SidebarImpression>>;
  journalEntries: JournalEntry[];
  updateJournalEntry: (entry: JournalEntry) => void;
  deleteJournalEntry: (args: { entryId?: string; nodeId?: string | null }) => void;
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
  if (!ImpressionList || !Array.isArray(ImpressionList)) {
    console.error("ImpressionList is not defined or not an array:", ImpressionList);
    return {} as Record<ImpressionType, Record<string, SidebarImpression>>;
  }
  
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
      addImpression: ({ id, label, type }) =>
        set((state) => ({
          sidebarImpressions: {
            ...state.sidebarImpressions,
            [type]: {
              ...state.sidebarImpressions[type],
              [id]: { id, label, type },
            },
          },
        })),
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
      updateJournalEntry: (newEntry) => {
        const current = get().journalEntries;
        const rest = current.filter((e) => e.id !== newEntry.id);
        set({
          journalEntries: [...rest, newEntry].sort(
            (a, b) =>
              new Date(b.updatedAt).getTime() -
              new Date(a.updatedAt).getTime()
          ),
        });
      },
      deleteJournalEntry: ({ entryId, nodeId }) => {
        const current = get().journalEntries;
        const rest = current.filter((entry) => {
          if (entryId) {
            return entry.id !== entryId;
          }

          if (typeof nodeId !== "undefined") {
            return entry.nodeId !== nodeId;
          }

          return true;
        });
        set({ journalEntries: rest });
      },
      hydrated: false,
    }),
    {
      name: "working-map-temp",
      // Temporarily disable persistence to prevent cross-map contamination
      // storage: createIndexedDbStorage<WorkingState>(),
    }
  )
);
