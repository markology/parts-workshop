import { ImpressionType } from "@/features/workspace/types/Impressions";
import { create } from "zustand/react";

type JournalTarget =
  | { type: "global" }
  | {
      type: "node";
      nodeId: string;
      nodeType: ImpressionType | "part" | "tension" | "interaction";
      title: string;
    };

type JournalStore = {
  isOpen: boolean;
  journalTarget: JournalTarget | null;
  journalData: string;
  lastSavedJournalData: string;
  activeEntryId: string | null;
  selectedSpeakers: string[]; // Array of part IDs or "self"
  openJournal: () => void;
  closeJournal: () => void;
  setJournalTarget: (target: JournalTarget) => void;
  setJournalData: (data: string) => void;
  setLastSavedJournalData: (data: string) => void;
  setActiveEntryId: (entryId: string | null) => void;
  setSelectedSpeakers: (speakers: string[] | ((prev: string[]) => string[])) => void;
  loadEntry: (payload: { entryId: string | null; content: string; speakers?: string[] }) => void;
  markJournalSaved: () => void;
};

export const useJournalStore = create<JournalStore>((set) => ({
  isOpen: false,
  journalTarget: null,
  journalData: "",
  lastSavedJournalData: "",
  activeEntryId: null,
  selectedSpeakers: [],

  openJournal: () => set({ isOpen: true }),
  closeJournal: () =>
    set({
      isOpen: false,
      journalData: "",
      lastSavedJournalData: "",
      journalTarget: null,
      activeEntryId: null,
      selectedSpeakers: [],
    }),
  setJournalTarget: (target) => set({ journalTarget: target, isOpen: true }),
  setJournalData: (data) => set({ journalData: data }),
  setLastSavedJournalData: (data) => set({ lastSavedJournalData: data }),
  setActiveEntryId: (entryId) => set({ activeEntryId: entryId }),
  setSelectedSpeakers: (speakers) => {
    if (typeof speakers === 'function') {
      set((state) => ({ selectedSpeakers: speakers(state.selectedSpeakers) }));
    } else {
      set({ selectedSpeakers: speakers });
    }
  },
  loadEntry: ({ entryId, content, speakers }) =>
    set({
      activeEntryId: entryId,
      journalData: content,
      lastSavedJournalData: content,
      selectedSpeakers: speakers || [],
    }),
  markJournalSaved: () => set((s) => ({ lastSavedJournalData: s.journalData })),
}));
