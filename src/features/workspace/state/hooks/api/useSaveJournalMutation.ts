import { useMutation, useQueryClient } from "@tanstack/react-query";

type SaveJournalInput =
  | { type: "global"; content: string }
  | { type: "node"; nodeId: string; content: string };

export const useSaveJournalMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SaveJournalInput) => {
      if (input.type === "global") {
        const res = await fetch("/api/journal/global", {
          method: "POST",
          body: JSON.stringify({ content: input.content }),
          headers: { "Content-Type": "application/json" },
        });
        return res.json(); // returns the new journal entry
      } else {
        const res = await fetch(`/api/journal/node/${input.nodeId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: input.content }),
        });
        if (!res.ok) throw new Error("Failed to save node journal");
        return res.json();
      }
    },
    onSuccess: (_data, variables) => {
      console.log("CHECKING VARIABLES", variables);
      if (variables.type === "global") {
        queryClient.setQueryData(["journal", "global"], _data); // ✅ update cache immediately
      } else {
        queryClient.setQueryData(["journal", "node", variables.nodeId], _data); // ✅ update cache immediately
      }
    },
    onError: (err) => {
      console.error("Failed to save journal:", err);
      // Optionally show a toast/snackbar or error UI
    },
  });
};
