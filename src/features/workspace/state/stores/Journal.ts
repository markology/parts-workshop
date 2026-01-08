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
  journalDataJson: string | null; // Lexical JSON (stringified SerializedEditorState)
  journalDataText: string; // Plain text for preview/search
  lastSavedJournalDataJson: string | null; // Last saved JSON for comparison
  lastSavedJournalDataText: string; // Last saved text for comparison
  activeEntryId: string | null;
  selectedSpeakers: string[]; // Array of part IDs or "self"
  openJournal: () => void;
  closeJournal: () => void;
  setJournalTarget: (target: JournalTarget) => void;
  setJournalData: (data: { json: string | null; text: string }) => void;
  setLastSavedJournalData: (data: { json: string | null; text: string }) => void;
  setActiveEntryId: (entryId: string | null) => void;
  setSelectedSpeakers: (speakers: string[] | ((prev: string[]) => string[])) => void;
  loadEntry: (payload: { 
    entryId: string | null; 
    contentJson: string | null; 
    contentText?: string;
    speakers?: string[] 
  }) => void;
  markJournalSaved: () => void;
};

export const useJournalStore = create<JournalStore>((set) => ({
  isOpen: false,
  journalTarget: null,
  journalDataJson: null,
  journalDataText: "",
  lastSavedJournalDataJson: null,
  lastSavedJournalDataText: "",
  activeEntryId: null,
  selectedSpeakers: [],

  openJournal: () => set({ isOpen: true }),
  closeJournal: () =>
    set({
      isOpen: false,
      journalDataJson: null,
      journalDataText: "",
      lastSavedJournalDataJson: null,
      lastSavedJournalDataText: "",
      journalTarget: null,
      activeEntryId: null,
      selectedSpeakers: [],
    }),
  setJournalTarget: (target) => set({ journalTarget: target, isOpen: true }),
  setJournalData: (data) => set({ 
    journalDataJson: data.json, 
    journalDataText: data.text 
  }),
  setLastSavedJournalData: (data) => set({ 
    lastSavedJournalDataJson: data.json,
    lastSavedJournalDataText: data.text || "",
  }),
  setActiveEntryId: (entryId) => set({ activeEntryId: entryId }),
  setSelectedSpeakers: (speakers) => {
    if (typeof speakers === 'function') {
      set((state) => ({ selectedSpeakers: speakers(state.selectedSpeakers) }));
    } else {
      set({ selectedSpeakers: speakers });
    }
  },
  loadEntry: ({ entryId, contentJson, contentText, speakers }) =>
    set({
      activeEntryId: entryId,
      journalDataJson: contentJson,
      journalDataText: contentText || "",
      lastSavedJournalDataJson: contentJson,
      lastSavedJournalDataText: contentText || "",
      selectedSpeakers: speakers || [],
    }),
  markJournalSaved: () => set((s) => ({ 
    lastSavedJournalDataJson: s.journalDataJson,
    lastSavedJournalDataText: s.journalDataText,
  })),
}));
