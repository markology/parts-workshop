import { create } from "zustand";

type JournalStore = {
  isOpen: boolean;
  openJournal: () => void;
  closeJournal: () => void;
  toggleJournal: (s: boolean) => void;
};

export const useJournalStore = create<JournalStore>((set) => ({
  isOpen: false,
  openJournal: () => set({ isOpen: true }),
  closeJournal: () => set({ isOpen: false }),
  toggleJournal: () => set((s) => ({ isOpen: !s.isOpen })),
}));
