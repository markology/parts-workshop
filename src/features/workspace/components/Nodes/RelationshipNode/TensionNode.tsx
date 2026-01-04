import RightClickMenu from "@/components/RightClickMenu";
import { useFlowNodesContext } from "@/features/workspace/state/FlowNodesContext";
import useContextMenu from "@/features/workspace/hooks/useContextMenu";
import { useJournalStore } from "@/features/workspace/state/stores/Journal";
import {
  TensionNode as TensionNodeType,
  ConnectedNodeType,
} from "@/features/workspace/types/Nodes";
import { Handle, Position, useReactFlow } from "@xyflow/react";
import { MessageCircleWarning, Trash2, BookOpen, Check } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import detachImpressionFromPart from "../../../state/updaters/detachImpressionFromPart";

const TensionNode = ({
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
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Handle Enter key or outside click save
  const handleSave = useCallback(() => {
    if (editingId) {
      updateTensionDescription(
        getNode(id) as TensionNodeType,
        editingId,
        editValue
      );
    }
    setEditValue("");
    setEditingId(null);
  }, [editValue, editingId, getNode, id, updateTensionDescription]);

  const handleEnter = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleSave();
    }
  };

  // Detect clicks outside the input
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target as Node) &&
        !(event.target as HTMLElement)?.closest('button[title="Save"]')
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
        className="node relationship-node relative w-[340px]"
      >
        <div
          className={`rounded-[26px] overflow-hidden p-5 space-y-5 bg-[image:var(--theme-tension-node-bg)] theme-light:text-slate-900 theme-dark:text-white`}
          // style={shellStyle}
        >
          <div className="flex items-center justify-between gap-3">
            <span
              className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.32em] text-[var(--theme-tension-node-pill-text)] bg-[var(--theme-tension-node-pill-bg)]`}
     
            >
              <MessageCircleWarning size={14} />
              Tension
            </span>

            <button
              onClick={() =>
                setJournalTarget({
                  type: "node",
                  nodeId: id,
                  nodeType: "tension",
                  title: connectedNodes.reduce((acc, connectedNode) =>
                    acc === "" ? connectedNode.part.data.label : `${acc} + ${connectedNode.part.data.label}`,
                  ""),
                })
              }
              className="journal-icon-button inline-flex h-9 w-9 items-center justify-center rounded-lg transition-colors shadow-sm border-none border-t-[var(--theme-tension-node-bg-top)] theme-dark:shadow-[rgb(0 0 0 / 20%) 0px 2px 4px] theme-light:text-[var(--theme-tension-node-pill-text)] theme-dark:bg-[rgba(168,85,247,0.2)] theme-light:bg-white"
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
                  className={`rounded-2xl px-4 py-3 shadow-sm theme-dark:text-slate-100 bg-[var(--theme-surface-background)] theme-dark:drop-shadow-[0px_14px_32px_rgba(0,0,0,0.45)]`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide bg-[var(--theme-tension-node-pill-part-bg)] text-[var(--theme-tension-node-pill-text)]"
                    >
                      {part.data.label}
                    </span>
                    {part.id !== editingId && (
                      <button
                        onClick={() => {
                          setEditValue(tensionDescription);
                          setEditingId(part.id);
                        }}
                        className={`text-[11px] font-semibold uppercase tracking-[0.28em] transition-colors
                          theme-dark:text-purple-300 theme-dark:hover:text-purple-200 theme-light:text-purple-700 theme-light:hover:text-purple-900`}
                      >
                        Edit
                      </button>
                    )}
                  </div>

                  <div className="mt-3">
                    {part.id === editingId ? (
                      <div className="relative flex items-start gap-2">
                        <textarea
                          className={`flex-1 rounded-md border-none shadow-inner px-3 py-2 text-xs font-medium focus:outline-none resize-none min-h-[60px] theme-dark:bg-[#212529] theme-dark:text-slate-100 theme-light:bg-white theme-light:text-purple-900`}
                          ref={inputRef}
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={handleEnter}
                          autoFocus
                          placeholder="Describe the friction between these parts"
                          rows={3}
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSave();
                          }}
                          className="flex-shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-md transition-colors theme-dark:bg-purple-500/30 theme-dark:hover:bg-purple-500/50 theme-dark:text-purple-200 theme-light:bg-purple-100 theme-light:hover:bg-purple-200 theme-light:text-purple-700 mt-0.5"
                          title="Save"
                        >
                          <Check size={16} />
                        </button>
                      </div>
                    ) : tensionDescription ? (
                      <p
                        className={`text-xs leading-relaxed text-right theme-dark:text-slate-200 theme-light:text-purple-900`}
                      >
                        {tensionDescription}
                      </p>
                    ) : (
                      <p className={`text-xs italic text-right theme-dark:text-slate-400 theme-light:text-purple-900/55`}>
                        Click edit to add context.
                      </p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className={`text-xs theme-dark:text-slate-400 theme-light:text-purple-900/70`}>
                Connect parts to describe this tension.
              </p>
            )}
          </div>
        </div>

        <Handle className="tension-handle" type="target" position={Position.Top} id="top" />
        <Handle className="tension-handle" type="target" position={Position.Bottom} id="bottom" />
        <Handle className="tension-handle" type="target" position={Position.Left} id="left" />
        <Handle className="tension-handle" type="target" position={Position.Right} id="right" />
      </div>
      {showContextMenu && <RightClickMenu items={menuItems} />}
    </>
  );
};

export default TensionNode;

