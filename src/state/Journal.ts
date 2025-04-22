import { create } from "zustand";

type JournalTarget = { type: "global" } | { type: "node"; nodeId: string };

type JournalStore = {
  isOpen: boolean;
  journalTarget: JournalTarget | null;
  journalData: string | null;
  openJournal: () => void;
  closeJournal: () => void;
  setJournalTarget: (target: JournalTarget) => void;
  setJournalData: (data: string | null) => void;
};

export const useJournalStore = create<JournalStore>((set) => ({
  isOpen: false,
  journalTarget: null,
  journalData: "",

  openJournal: () => set({ isOpen: true }),
  closeJournal: () =>
    set({ isOpen: false, journalData: "", journalTarget: null }),
  setJournalTarget: (target: JournalTarget) =>
    set({ journalTarget: target, isOpen: true }),
  setJournalData: (data) => set({ journalData: data }),
}));
