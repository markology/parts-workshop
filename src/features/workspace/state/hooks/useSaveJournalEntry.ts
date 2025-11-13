import { JournalEntry } from "@/features/workspace/types/Journal";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useSaveJournalEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      nodeId,
      content,
      title,
      entryId,
      createNewVersion,
    }: {
      nodeId?: string;
      content: string;
      title?: string;
      entryId?: string;
      createNewVersion?: boolean;
    }) => {
      const url = nodeId
        ? `/api/journal/node/${nodeId}`
        : "/api/journal/global";
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          title,
          entryId,
          createNewVersion,
        }),
      });
      if (!res.ok) throw new Error("Had trouble saving journal entry");

      return res.json();
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
