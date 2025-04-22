"use client";

import { useEffect, useState } from "react";
import { useJournalStore } from "@/state/Journal";
import JournalEditor from "./JournalEditor";
import { useNodeJournalQuery } from "@/features/workspace/state/hooks/api/useNodeJournalQuery";
import { useSaveJournalMutation } from "@/features/workspace/state/hooks/api/useSaveJournalMutation";
import { useGlobalJournalQuery } from "@/features/workspace/state/hooks/api/useGlobalJourneyQuery";

export default function JournalDrawer() {
  const { isOpen, closeJournal, journalTarget } = useJournalStore();

  const saveMutation = useSaveJournalMutation();

  const nodeId = journalTarget?.type === "node" ? journalTarget.nodeId : null;
  const { data: nodeData, isLoading: isNodeLoading } = useNodeJournalQuery(
    nodeId ?? ""
  );
  const { data: globalData, isLoading: isGlobalLoading } =
    useGlobalJournalQuery();

  console.log({ globalData, isGlobalLoading });

  const content =
    journalTarget?.type === "node"
      ? nodeData?.content ?? ""
      : globalData?.content ?? "";

  const [editorContent, setEditorContent] = useState("");

  // Sync content into local editor state
  useEffect(() => {
    setEditorContent(content);
  }, [content]);

  // Sync content into editor when drawer opens or query returns
  useEffect(() => {
    if (!isOpen) {
      setEditorContent("");
      return;
    }

    if (journalTarget?.type === "global" && globalData?.content) {
      setEditorContent(globalData.content);
    } else if (
      journalTarget?.type === "node" &&
      nodeData?.content !== undefined
    ) {
      setEditorContent(nodeData?.content ?? ""); // fallback to empty for new
    }
  }, [isOpen, journalTarget, globalData, nodeData]);

  const handleSave = (html: string) => {
    if (journalTarget?.type === "global") {
      saveMutation.mutate({ type: "global", content: html });
    } else if (journalTarget?.type === "node") {
      saveMutation.mutate({
        type: "node",
        nodeId: journalTarget.nodeId,
        content: html,
      });
    }
  };

  const isLoading =
    journalTarget?.type === "node" ? isNodeLoading : isGlobalLoading;

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
            journalTarget?.type === "node" ? journalTarget.nodeId : undefined
          }
          initialContent={editorContent}
          onSave={handleSave}
          isLoading={isLoading || saveMutation.isPending}
        />
      </div>
    </div>
  );
}
