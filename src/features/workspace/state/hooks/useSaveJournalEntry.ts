import { JournalEntry } from "@/features/workspace/types/Journal";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useSaveJournalEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      nodeId,
      contentJson,
      contentText,
      title,
      entryId,
      createNewVersion,
      speakers,
      journalType,
    }: {
      nodeId?: string;
      contentJson: string; // Lexical JSON string
      contentText?: string; // Plain text (optional, computed if missing)
      title?: string;
      entryId?: string;
      createNewVersion?: boolean;
      speakers?: string[];
      journalType?: "normal" | "textThread";
    }) => {
      const url = nodeId
        ? `/api/journal/node/${nodeId}`
        : "/api/journal/global";
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentJson,
          contentText,
          title,
          entryId,
          createNewVersion,
          speakers,
          journalType,
        }),
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        let errorMessage = "Had trouble saving journal entry";
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(`${errorMessage} (${res.status})`);
      }

      const result = await res.json();
      if (!result || !result.id) {
        throw new Error("Server returned invalid response");
      }
      
      return result;
    },
    onSuccess: (newEntry) => {
      queryClient.setQueryData(
        ["journal", "all"],
        (prev: JournalEntry[] = []) => {
          const existingIndex = prev.findIndex((e) => e.id === newEntry.id);
          let nextEntries: JournalEntry[];

          if (existingIndex >= 0) {
            nextEntries = [...prev];
            nextEntries[existingIndex] = {
              ...nextEntries[existingIndex],
              ...newEntry,
            };
          } else {
            nextEntries = [...prev, newEntry];
          }

          return nextEntries.sort(
            (a, b) =>
              new Date(b.updatedAt).getTime() -
              new Date(a.updatedAt).getTime()
          );
        }
      );
    },
  });
};
