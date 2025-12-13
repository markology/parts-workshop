import RightClickMenu from "@/components/RightClickMenu";
import {
  NodeBackgroundColors,
  NodeTextColors,
} from "@/features/workspace/constants/Nodes";
import { useFlowNodesContext } from "@/features/workspace/state/FlowNodesContext";
import useContextMenu from "@/features/workspace/hooks/useContextMenu";
import { useJournalStore } from "@/features/workspace/state/stores/Journal";
import {
  InteractionNode as InteractionNodeType,
  ConnectedNodeType,
} from "@/features/workspace/types/Nodes";
import { Handle, Position, useReactFlow } from "@xyflow/react";
import { Users, Trash2, BookOpen } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import detachImpressionFromPart from "../../../state/updaters/detachImpressionFromPart";
import { useThemeContext } from "@/state/context/ThemeContext";
import type { CSSProperties } from "react";
import { workspaceDarkPalette } from "@/features/workspace/constants/darkPalette";

const RelationshipNode = ({
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
        getNode(id) as InteractionNodeType,
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

  const { darkMode } = useThemeContext();
  const palette = workspaceDarkPalette;
  const accent = NodeBackgroundColors["interaction"];
  const accentText = NodeTextColors["interaction"];
  const shellClasses = darkMode
    ? "border border-transparent text-white shadow-[0_32px_90px_rgba(0,0,0,0.65)]"
    : "bg-gradient-to-br from-[#eaf7ff] via-[#e4f4ff] to-white border border-sky-200/70 text-slate-900 shadow-[0_26px_62px_rgba(28,102,143,0.16)]";
  const shellStyle = darkMode
    ? {
        background: `linear-gradient(140deg, ${palette.elevated}, ${palette.surface})`,
        borderColor: "rgba(255,255,255,0.05)",
      }
    : undefined;

  return (
    <>
      <div
        onContextMenu={handleContextMenu}
        ref={nodeRef}
        className="node relationship-node relative w-[320px]"
      >
        <div
          className={`rounded-[26px] overflow-hidden p-5 space-y-5 ${shellClasses}`}
          style={shellStyle}
        >
          <div className="flex items-center justify-between gap-3">
            <span
              className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.32em]"
              style={{
                backgroundColor: darkMode ? palette.highlight : "rgba(135,206,235,0.25)",
                color: darkMode ? "#f8fafc" : accentText,
              }}
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
              className={`inline-flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
                darkMode
                  ? "text-slate-100 border border-white/10 hover:bg-white/10"
                  : "text-sky-700 hover:bg-sky-100"
              }`}
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
                  className={`rounded-2xl border px-4 py-3 shadow-sm ${
                    darkMode ? "border-transparent text-slate-100" : "bg-white border-sky-200"
                  }`}
                  style={
                    darkMode
                      ? {
                          background: palette.surface,
                          borderColor: "rgba(255,255,255,0.05)",
                          boxShadow: "0 14px 32px rgba(0,0,0,0.45)",
                        }
                      : undefined
                  }
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide"
                      style={{
                        backgroundColor: darkMode ? "rgba(61,67,75,0.65)" : "rgba(135,206,235,0.18)",
                        color: darkMode ? "#e9fbff" : accentText,
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
                        darkMode ? "text-slate-400 hover:text-white" : "text-sky-700 hover:text-sky-900"
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
                            ? "bg-[#212529] border-white/10 text-slate-100 focus:ring-[#3d434b]"
                            : "bg-white border-sky-300 text-sky-900 focus:ring-sky-300"
                        }`}
                        ref={inputRef}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={handleEnter}
                        autoFocus
                        placeholder="Describe how these parts support each other"
                      />
                    ) : tensionDescription ? (
                      <p
                        className={`text-xs leading-relaxed text-right ${
                          darkMode ? "text-slate-200" : "text-sky-900"
                        }`}
                      >
                        {tensionDescription}
                      </p>
                    ) : (
                      <p className={`text-xs italic text-right ${darkMode ? "text-slate-400" : "text-sky-900/55"}`}>
                        Click edit to add notes.
                      </p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className={`text-xs ${darkMode ? "text-slate-400" : "text-sky-900/70"}`}>
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

export default RelationshipNode;
