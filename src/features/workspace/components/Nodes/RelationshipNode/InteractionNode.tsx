import RightClickMenu from "@/components/RightClickMenu";
import { useFlowNodesContext } from "@/features/workspace/state/FlowNodesContext";
import useContextMenu from "@/features/workspace/hooks/useContextMenu";
import { useJournalStore } from "@/features/workspace/state/stores/Journal";
import {
  InteractionNode as InteractionNodeType,
  TensionNode,
  ConnectedNodeType,
} from "@/features/workspace/types/Nodes";
import { Handle, Position, useReactFlow } from "@xyflow/react";
import { Users, Trash2, BookOpen } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import detachImpressionFromPart from "../../../state/updaters/detachImpressionFromPart";

const InteractionNode = ({
  connectedNodes,
  id,
}: {
  connectedNodes: ConnectedNodeType[];
  id: string;
}) => {
  const { getNode } = useReactFlow();
  const { deleteEdges, deleteNode, updateTensionDescription } =
    useFlowNodesContext();

  const { handleContextMenu, showContextMenu, nodeRef, menuItems } =
    useContextMenu({
      id,
      menuItems: useMemo(
        () => [
          {
            icon: <Trash2 size={16} />,
            onClick: () => {
              deleteNode(id);
              deleteEdges(id);
            },
          },
        ],
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [detachImpressionFromPart, id]
      ),
    });

  const { setJournalTarget } = useJournalStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Handle Enter key or outside click save
  const handleSave = useCallback(() => {
    if (editingId) {
      updateTensionDescription(
        getNode(id) as TensionNode,
        editingId,
        editValue
      );
    }
    setEditValue("");
    setEditingId(null);
  }, [editValue, editingId, getNode, id, updateTensionDescription]);

  const handleEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSave();
    }
  };

  // Detect clicks outside the input
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        handleSave(); // Trigger save when clicking outside
      }
    };

    // Add listener when editing starts
    if (editingId) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    // Cleanup listener when editing stops or component unmounts
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [editingId, editValue, handleSave]);


  return (
    <>
      <div
        onContextMenu={handleContextMenu}
        ref={nodeRef}
        className="node relationship-node relative w-[320px]"
      >
        <div
          className="rounded-[26px] overflow-hidden p-5 space-y-5 bg-[var(--theme-interaction-node-bg)] theme-light:text-slate-900 theme-dark:text-white shadow-[var(--theme-interaction-node-shadow)]"
        >
          <div className="flex items-center justify-between gap-3">
            <span
              className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.32em] bg-[var(--theme-interaction-node-pill-bg)] text-[var(--theme-interaction-node-pill-text)]"
            >
              <Users size={16} />
              Interaction
            </span>

            <button
              onClick={() =>
                setJournalTarget({
                  type: "node",
                  nodeId: id,
                  nodeType: "interaction",
                  title: connectedNodes.reduce((acc, connectedNode) =>
                    acc === "" ? connectedNode.part.data.label : `${acc} + ${connectedNode.part.data.label}`,
                  ""),
                })
              }
              className="journal-icon-button inline-flex h-9 w-9 items-center justify-center rounded-lg transition-colors border-none border-t-[var(--theme-interaction-node-journal-icon-border)] theme-light:shadow-sm theme-light:text-[var(--theme-interaction-node-pill-text)] theme-dark:bg-[var(--theme-interaction-node-journal-icon-bg)] theme-dark:shadow-[var(--theme-interaction-node-journal-icon-shadow)]"
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundImage = 'none';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundImage = 'none';
              }}
              title="Open journal"
            >
              <BookOpen size={16} />
            </button>
          </div>

          <div className="space-y-4">
            {connectedNodes.length ? (
              connectedNodes.map(({ part, tensionDescription }) => (
                <div
                  key={`connectedNode-${part.id}`}
                  className="rounded-2xl px-4 py-3 shadow-sm theme-light:bg-[var(--theme-interaction-node-card-bg)] theme-dark:text-slate-100 theme-dark:bg-[var(--theme-interaction-node-card-bg)] theme-dark:shadow-[var(--theme-interaction-node-card-shadow)]"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide bg-[var(--theme-interaction-node-card-part-pill-bg)] text-[var(--theme-interaction-node-card-part-pill-text)]"
                    >
                      {part.data.label}
                    </span>
                    <button
                      onClick={() => {
                        setEditValue(tensionDescription);
                        setEditingId(part.id);
                      }}
                      className="text-[11px] font-semibold uppercase tracking-[0.28em] transition-colors text-[var(--theme-interaction-node-edit-button-text)] hover:text-[var(--theme-interaction-node-edit-button-hover-text)]"
                    >
                      Edit
                    </button>
                  </div>

                  <div className="mt-3">
                    {part.id === editingId ? (
                      <input
                        className="w-full rounded-md border px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 bg-[var(--theme-interaction-node-input-bg)] border-[var(--theme-interaction-node-input-border)] text-[var(--theme-interaction-node-input-text)] focus:ring-[var(--theme-interaction-node-input-focus-ring)]"
                        ref={inputRef}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={handleEnter}
                        autoFocus
                        placeholder="Describe how these parts support each other"
                      />
                    ) : tensionDescription ? (
                      <p
                        className="text-xs leading-relaxed text-right text-[var(--theme-interaction-node-description-text)]"
                      >
                        {tensionDescription}
                      </p>
                    ) : (
                      <p className="text-xs italic text-right text-[var(--theme-interaction-node-placeholder-text)]">
                        Click edit to add notes.
                      </p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-[var(--theme-interaction-node-empty-text)]">
                Connect parts that collaborate closely.
              </p>
            )}
          </div>
        </div>

        <Handle className="interaction-handle" type="target" position={Position.Top} id="top" />
        <Handle className="interaction-handle" type="target" position={Position.Bottom} id="bottom" />
        <Handle className="interaction-handle" type="target" position={Position.Left} id="left" />
        <Handle className="interaction-handle" type="target" position={Position.Right} id="right" />
      </div>
      {showContextMenu && <RightClickMenu items={menuItems} />}
    </>
  );
};

export default InteractionNode;

