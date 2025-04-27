import { ImpressionType } from "@/features/workspace/types/Impressions";
import { create } from "zustand/react";

type JournalTarget =
  | { type: "global" }
  | {
      type: "node";
      nodeId: string;
      nodeType: ImpressionType | "part" | "conflict";
      title: string;
    };

type JournalStore = {
  isOpen: boolean;
  journalTarget: JournalTarget | null;
  journalData: string | null;
  lastSavedJournalData: string | null;
  openJournal: () => void;
  closeJournal: () => void;
  setJournalTarget: (target: JournalTarget) => void;
  setJournalData: (data: string | null) => void;
  markJournalSaved: () => void;
};

export const useJournalStore = create<JournalStore>((set) => ({
  isOpen: false,
  journalTarget: null,
  journalData: "",
  lastSavedJournalData: "",

  openJournal: () => set({ isOpen: true }),
  closeJournal: () =>
    set({
      isOpen: false,
      journalData: "",
      lastSavedJournalData: "",
      journalTarget: null,
    }),
  setJournalTarget: (target) => set({ journalTarget: target, isOpen: true }),
  setJournalData: (data) => set({ journalData: data }),
  markJournalSaved: () => set((s) => ({ lastSavedJournalData: s.journalData })),
}));
