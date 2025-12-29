import RightClickMenu from "@/components/RightClickMenu";
import {
  NodeBackgroundColors,
  NodeTextColors,
} from "@/features/workspace/constants/Nodes";
import { useFlowNodesContext } from "@/features/workspace/state/FlowNodesContext";
import useContextMenu from "@/features/workspace/hooks/useContextMenu";
import { useJournalStore } from "@/features/workspace/state/stores/Journal";
import {
  TensionNode as TensionNodeType,
  ConnectedNodeType,
} from "@/features/workspace/types/Nodes";
import { Handle, Position, useReactFlow } from "@xyflow/react";
import { MessageCircleWarning, Trash2, BookOpen } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import detachImpressionFromPart from "../../../state/updaters/detachImpressionFromPart";
import { useThemeContext } from "@/state/context/ThemeContext";
import { useTheme } from "@/features/workspace/hooks/useTheme";
import { workspaceDarkPalette } from "@/features/workspace/constants/darkPalette";

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
  const inputRef = useRef<HTMLInputElement>(null);
  const { darkMode } = useThemeContext();
  const theme = useTheme();
  const palette = workspaceDarkPalette;

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

  const accent = NodeBackgroundColors["tension"];
  const accentText = NodeTextColors["tension"];
  const shellClasses = darkMode
    ? "text-white shadow-[0_32px_90px_rgba(0,0,0,0.65)]"
    : "bg-gradient-to-br from-[#f7f2ff] via-[#f1e9ff] to-white text-slate-900 shadow-[0_28px_64px_rgba(88,50,141,0.18)]";

  const shellStyle = darkMode
    ? {
        background: `linear-gradient(140deg, #2a1f3d, #27212f)`,
      }
    : undefined;

  const placeholderText = darkMode ? "text-slate-400" : "text-purple-900/55";

  return (
    <>
      <div
        onContextMenu={handleContextMenu}
        ref={nodeRef}
        className="node relationship-node relative w-[340px]"
      >
        <div
          className={`rounded-[26px] overflow-hidden p-5 space-y-5 ${shellClasses}`}
          style={shellStyle}
        >
          <div className="flex items-center justify-between gap-3">
            <span
              className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.32em]"
              style={{
                backgroundColor: darkMode ? "rgba(168,85,247,0.2)" : "rgba(177,156,217,0.22)",
                color: darkMode ? "#e9d5ff" : accentText,
              }}
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
              className="journal-icon-button inline-flex h-9 w-9 items-center justify-center rounded-lg transition-colors shadow-sm"
              style={{
                border: "none",
                ...(darkMode ? { borderTop: "1px solid rgba(0, 0, 0, 0.15)" } : { borderTop: "1px solid #00000012" }),
                ...(darkMode ? { boxShadow: "rgb(0 0 0 / 20%) 0px 2px 4px" } : {}),
                ...(!darkMode ? { color: accentText } : { backgroundColor: "rgba(168,85,247,0.2)" }),
              }}
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
                  className={`rounded-2xl px-4 py-3 shadow-sm ${
                    darkMode ? "text-slate-100" : "bg-white"
                  }`}
                  style={
                    darkMode
                      ? {
                          background: palette.surface,
                          boxShadow: "0 14px 32px rgba(0,0,0,0.45)",
                        }
                      : undefined
                  }
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide"
                      style={{
                        backgroundColor: darkMode ? "rgba(168,85,247,0.25)" : "rgba(177,156,217,0.25)",
                        color: darkMode ? "#e9d5ff" : accentText,
                      }}
                    >
                      {part.data.label}
                    </span>
                    <button
                      onClick={() => {
                        setEditValue(tensionDescription);
                        setEditingId(part.id);
                      }}
                      className={`text-[11px] font-semibold uppercase tracking-[0.28em] transition-colors ${
                        darkMode ? "text-purple-300 hover:text-purple-200" : "text-purple-700 hover:text-purple-900"
                      }`}
                    >
                      Edit
                    </button>
                  </div>

                  <div className="mt-3">
                    {part.id === editingId ? (
                      <input
                        className={`w-full rounded-md border px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 ${
                          darkMode
                            ? "bg-[#212529] border-purple-500/30 text-slate-100 focus:ring-purple-500/50"
                            : "bg-white border-purple-300 text-purple-900 focus:ring-purple-300"
                        }`}
                        ref={inputRef}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={handleEnter}
                        autoFocus
                        placeholder="Describe the friction between these parts"
                      />
                    ) : tensionDescription ? (
                      <p
                        className={`text-xs leading-relaxed text-right ${
                          darkMode ? "text-slate-200" : "text-purple-900"
                        }`}
                      >
                        {tensionDescription}
                      </p>
                    ) : (
                      <p className={`text-xs italic text-right ${placeholderText}`}>
                        Click edit to add context.
                      </p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className={`text-xs ${darkMode ? "text-slate-400" : "text-purple-900/70"}`}>
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

