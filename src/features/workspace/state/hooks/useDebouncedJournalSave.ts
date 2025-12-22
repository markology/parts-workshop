import { useEffect, useRef } from "react";
import { useSaveJournalEntry } from "./useSaveJournalEntry";
import { useJournalStore } from "@/features/workspace/state/stores/Journal";

export const useDebouncedJournalSave = () => {
  const journalData = useJournalStore((s) => s.journalData);
  const journalTarget = useJournalStore((s) => s.journalTarget);
  const lastSaved = useJournalStore((s) => s.lastSavedJournalData);
  const activeEntryId = useJournalStore((s) => s.activeEntryId);
  const markSaved = useJournalStore((s) => s.markJournalSaved);
  const saveJournal = useSaveJournalEntry();

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!journalTarget || journalData === lastSaved || !activeEntryId)
      return;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      const nodeId =
        journalTarget.type === "node" ? journalTarget.nodeId : undefined;
      saveJournal.mutate(
        {
          nodeId,
          content: journalData,
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
    journalData,
    journalTarget,
    lastSaved,
    markSaved,
    saveJournal,
  ]);
};
