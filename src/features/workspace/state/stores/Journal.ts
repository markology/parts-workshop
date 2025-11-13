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
  openJournal: () => void;
  closeJournal: () => void;
  setJournalTarget: (target: JournalTarget) => void;
  setJournalData: (data: string) => void;
  setLastSavedJournalData: (data: string) => void;
  setActiveEntryId: (entryId: string | null) => void;
  loadEntry: (payload: { entryId: string | null; content: string }) => void;
  markJournalSaved: () => void;
};

export const useJournalStore = create<JournalStore>((set) => ({
  isOpen: false,
  journalTarget: null,
  journalData: "",
  lastSavedJournalData: "",
  activeEntryId: null,

  openJournal: () => set({ isOpen: true }),
  closeJournal: () =>
    set({
      isOpen: false,
      journalData: "",
      lastSavedJournalData: "",
      journalTarget: null,
      activeEntryId: null,
    }),
  setJournalTarget: (target) => set({ journalTarget: target, isOpen: true }),
  setJournalData: (data) => set({ journalData: data }),
  setLastSavedJournalData: (data) => set({ lastSavedJournalData: data }),
  setActiveEntryId: (entryId) => set({ activeEntryId: entryId }),
  loadEntry: ({ entryId, content }) =>
    set({
      activeEntryId: entryId,
      journalData: content,
      lastSavedJournalData: content,
    }),
  markJournalSaved: () => set((s) => ({ lastSavedJournalData: s.journalData })),
}));
