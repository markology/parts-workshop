"use client";

import { useEffect, useState } from "react";
import { useJournalStore } from "@/state/Journal";
import JournalEditor from "./JournalEditor";
import { useSaveJournalEntry } from "../../state/hooks/useSaveJournalEntry";
import { useAllJournalEntries } from "../../state/hooks/useAllJournalEntries";
import { JournalEntry } from "@/types/Journal";
import { useDebouncedJournalSave } from "../../state/hooks/useDebouncedJournalSave";

export default function JournalDrawer() {
  // Inside JournalDrawer
  useDebouncedJournalSave(); // 👈 plug it in at top

  const { isOpen, closeJournal, journalTarget } = useJournalStore();
  const { data: allEntries = [], isLoading } = useAllJournalEntries();

  const nodeId =
    journalTarget?.type === "node" ? journalTarget.nodeId : undefined;
  const nodeType =
    journalTarget?.type === "node" ? journalTarget.nodeType : undefined;
  const nodeLabel =
    journalTarget?.type === "node" ? journalTarget.title : undefined;
  const [editorContent, setEditorContent] = useState("");

  const entry = journalTarget
    ? allEntries.find((e: JournalEntry) =>
        journalTarget.type === "node" ? e.nodeId === nodeId : !e.nodeId
      )
    : null;

  useEffect(() => {
    if (!isOpen) {
      setEditorContent("");
    } else if (!entry) {
      setEditorContent(""); // new journal entry
    } else {
      setEditorContent(entry.content ?? "");
    }
  }, [journalTarget, entry, isOpen]);

  const saveMutation = useSaveJournalEntry();

  const handleSave = (html: string) => {
    console.log("SAVING", journalTarget, nodeId);
    saveMutation.mutate({ nodeId, content: html }); // ✅ works for create + update
  };

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
        className={`absolute top-0 right-0 h-full w-full sm:w-[580px] bg-white shadow-lg transition-transform duration-300 pointer-events-auto pr-[100px] z-50 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <JournalEditor
          key={nodeId ?? "global"}
          title={nodeLabel ?? "Global Journal"}
          nodeType={nodeType}
          initialContent={editorContent}
          onSave={handleSave}
          isLoading={isLoading || saveMutation.isPending}
        />
      </div>
    </div>
  );
}
