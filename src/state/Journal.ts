import { create } from "zustand";

type JournalTarget = { type: "global" } | { type: "node"; nodeId: string };

type JournalStore = {
  isOpen: boolean;
  journalTarget: JournalTarget | null;
  openJournal: () => void;
  closeJournal: () => void;
  setJournalTarget: (target: JournalTarget) => void;
};

export const useJournalStore = create<JournalStore>((set) => ({
  isOpen: false,
  journalTarget: null,

  openJournal: () => set({ isOpen: true }),
  closeJournal: () => set({ isOpen: false, journalTarget: null }),

  setJournalTarget: (target: JournalTarget) =>
    set({ journalTarget: target, isOpen: true }),
}));
