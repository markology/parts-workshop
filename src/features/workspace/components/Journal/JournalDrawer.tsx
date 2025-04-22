"use client";

import { useJournalStore } from "@/state/Journal";
import JournalEditor from "./JournalEditor";
import { useEffect } from "react";

export default function JournalDrawer() {
  const {
    isOpen,
    closeJournal,
    setJournalData,
    journalData,
    journalTarget,
    saveNodeJournal,
    saveGlobalJournal,
  } = useJournalStore();

  useEffect(() => {
    if (journalTarget?.type === "node") {
      fetch(`/api/journal/${journalTarget.nodeId}`)
        .then((res) => res.json())
        .then((data) => setJournalData(data));
    } else if (journalTarget?.type === "global") {
      fetch("/api/journal/global")
        .then((res) => res.json())
        .then((data) => setJournalData(data));
    }
  }, [journalTarget, setJournalData]);

  useEffect(() => {
    if (!isOpen) setJournalData(null);
  }, [isOpen, setJournalData]);

  return (
    <div
      className={`fixed top-0 right-0 h-full w-full sm:w-[480px] z-50 transition-transform duration-300 pointer-events-none`}
    >
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/40 transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0"
        }`}
        onClick={closeJournal}
      />

      {/* Drawer Panel */}
      <div
        id="journal-drawer"
        className={`absolute top-0 right-0 h-full w-full sm:w-[580px] bg-white shadow-lg z-50 transition-transform duration-300 pointer-events-auto pr-[100px] ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <JournalEditor
          title={
            journalTarget?.type !== "global" ? journalTarget?.nodeId : undefined
          }
          initialContent={journalData ?? ""}
          onSave={(html) => {
            if (journalTarget?.type === "node") {
              saveNodeJournal(journalTarget.nodeId, html);
            } else {
              saveGlobalJournal(html);
            }
          }}
        />
      </div>
    </div>
  );
}
