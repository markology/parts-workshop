import { useEffect, useRef } from "react";
import { useSaveJournalEntry } from "./useSaveJournalEntry";
import { useJournalStore } from "@/features/workspace/state/stores/Journal";

export const useDebouncedJournalSave = () => {
  const journalDataJson = useJournalStore((s) => s.journalDataJson);
  const journalDataText = useJournalStore((s) => s.journalDataText);
  const journalTarget = useJournalStore((s) => s.journalTarget);
  const lastSavedJson = useJournalStore((s) => s.lastSavedJournalDataJson);
  const lastSavedText = useJournalStore((s) => s.lastSavedJournalDataText);
  const activeEntryId = useJournalStore((s) => s.activeEntryId);
  const markSaved = useJournalStore((s) => s.markJournalSaved);
  const saveJournal = useSaveJournalEntry();

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!journalTarget || journalDataJson === lastSavedJson || !activeEntryId)
      return;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      const nodeId =
        journalTarget.type === "node" ? journalTarget.nodeId : undefined;
      // contentJson is required, so provide empty Lexical editor state if null
      const contentJson = journalDataJson ?? JSON.stringify({ root: { children: [], direction: "ltr", format: "", indent: 0, type: "root", version: 1 } });
      saveJournal.mutate(
        {
          nodeId,
          contentJson,
          contentText: journalDataText,
          entryId: activeEntryId ?? undefined,
          createNewVersion: false,
        },
        {
          onSuccess: () => {
            markSaved();
          },
        }
      );
    }, 2000); // 2-second debounce

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [
    activeEntryId,
    journalDataJson,
    journalDataText,
    journalTarget,
    lastSavedJson,
    lastSavedText,
    markSaved,
    saveJournal,
  ]);
};
