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
  saveGlobalJournal: (data: string) => Promise<void>;
  saveNodeJournal: (nodeId: string, content: string) => Promise<void>;
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

  saveGlobalJournal: async (data: string) => {
    await fetch("/api/journal/global", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: data }),
    });
  },

  saveNodeJournal: async (nodeId: string, content: string) => {
    await fetch(`/api/journal/node/${nodeId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
  },
}));
