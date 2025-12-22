"use client";

import RightClickMenu from "@/components/RightClickMenu";
import useContextMenu from "@/features/workspace/hooks/useContextMenu";
import { useFlowNodesContext } from "@/features/workspace/state/FlowNodesContext";
import { useReactFlow } from "@xyflow/react";
import { MessageCircleWarning, Users, Trash2 } from "lucide-react";
import { useCallback, useMemo } from "react";
import { useThemeContext } from "@/state/context/ThemeContext";
import { workspaceDarkPalette } from "@/features/workspace/constants/darkPalette";

const RelationshipSelectionNode = ({ id }: { id: string }) => {
  const { updateNode, setNodes, deleteNode } = useFlowNodesContext();
  const { getNode } = useReactFlow();
  const { darkMode } = useThemeContext();
  const palette = workspaceDarkPalette;

  const { handleContextMenu, showContextMenu, nodeRef, menuItems } =
    useContextMenu({
      id,
      menuItems: useMemo(
        () => [
          {
            icon: <Trash2 size={16} />,
            onClick: () => {
              deleteNode(id);
            },
          },
        ],
        [deleteNode, id]
      ),
    });

  const convertToRelationship = useCallback(
    (relationshipType: "tension" | "interaction") => {
      const node = getNode(id);
      if (!node) return;

      // Update the node to the chosen relationship type
      const nodeType = relationshipType === "tension" ? "tension" : "interaction";
      const label = relationshipType === "tension" ? "Tension" : "Interaction";

      setNodes((nodes) =>
        nodes.map((n) => {
          if (n.id === id) {
            return {
              ...n,
              type: nodeType,
              data: {
                type: "tensionData",
                label,
                relationshipType,
                connectedNodes: [],
              },
            };
          }
          return n;
        })
      );
    },
    [id, getNode, setNodes]
  );

  return (
    <>
      <div
        onContextMenu={handleContextMenu}
        ref={nodeRef}
        className={`node relative w-[320px] rounded-[24px] border transition-all duration-200 ${
          darkMode
            ? "border border-transparent text-slate-100 shadow-[0_32px_85px_rgba(0,0,0,0.6)]"
            : "border-slate-200 bg-white text-slate-900 shadow-[0_24px_55px_rgba(15,23,42,0.12)]"
        }`}
        style={
          darkMode
            ? {
                background: `linear-gradient(145deg, ${palette.elevated}, ${palette.surface})`,
                borderColor: "rgba(255,255,255,0.05)",
              }
            : undefined
        }
      >
        <div className={`absolute inset-0 pointer-events-none rounded-[24px] ${
          darkMode
            ? "bg-[radial-gradient(circle_at_top,rgba(61,67,75,0.5),transparent_65%)]"
            : "bg-[radial-gradient(circle_at_top,rgba(124,58,237,0.08),transparent_60%)]"
        }`} />
        <div className="relative p-6 space-y-5">
          <div>
            <p className={`text-[11px] uppercase tracking-[0.32em] ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
              Define Connection
            </p>
            <h3 className={`text-lg font-semibold ${darkMode ? "text-slate-100" : "text-slate-900"}`}>Choose Relationship Type</h3>
            <p className={`mt-1 text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
              Select whether these parts are in tension or interacting.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => convertToRelationship("tension")}
              className={`flex flex-col items-center gap-2 rounded-xl border px-4 py-3 transition-all duration-200 ${
                darkMode
                  ? "border-white/10 bg-[#2a2e32]/80 hover:border-white/20"
                  : "border-purple-200 bg-purple-50 hover:bg-purple-100"
              }`}
              style={
                darkMode
                  ? {
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
                    }
                  : undefined
              }
            >
              <span className={`inline-flex h-9 w-9 items-center justify-center rounded-full ${
                darkMode ? "bg-[#3d434b] text-purple-100" : "text-purple-600"
              }`}>
                <MessageCircleWarning size={20} />
              </span>
              <div className="text-center">
                <p className={`font-semibold text-sm ${darkMode ? "text-purple-200" : "text-purple-700"}`}>Tension</p>
                <p className={`text-xs ${darkMode ? "text-purple-300" : "text-purple-600"}`}>Parts in opposition</p>
              </div>
            </button>

            <button
              onClick={() => convertToRelationship("interaction")}
              className={`flex flex-col items-center gap-2 rounded-xl border px-4 py-3 transition-all duration-200 ${
                darkMode
                  ? "border-white/10 bg-[#2a2e32]/80 hover:border-white/20"
                  : "border-sky-200 bg-sky-50 hover:bg-sky-100"
              }`}
              style={
                darkMode
                  ? {
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
                    }
                  : undefined
              }
            >
              <span className={`inline-flex h-9 w-9 items-center justify-center rounded-full ${
                darkMode ? "bg-[#3d434b] text-sky-100" : "text-sky-600"
              }`}>
                <Users size={20} />
              </span>
              <div className="text-center">
                <p className={`font-semibold text-sm ${darkMode ? "text-sky-200" : "text-sky-700"}`}>Interaction</p>
                <p className={`text-xs ${darkMode ? "text-sky-300" : "text-sky-600"}`}>Parts working together</p>
              </div>
            </button>
          </div>
        </div>
      </div>
      {showContextMenu && <RightClickMenu items={menuItems} />}
    </>
  );
};

export default RelationshipSelectionNode;

