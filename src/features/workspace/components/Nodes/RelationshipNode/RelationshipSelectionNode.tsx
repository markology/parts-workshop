"use client";

import RightClickMenu from "@/components/RightClickMenu";
import useContextMenu from "@/features/workspace/hooks/useContextMenu";
import { useFlowNodesContext } from "@/features/workspace/state/FlowNodesContext";
import { useReactFlow } from "@xyflow/react";
import { Sword, Users, Trash2 } from "lucide-react";
import { useCallback, useMemo } from "react";
import { useThemeContext } from "@/state/context/ThemeContext";

const RelationshipSelectionNode = ({ id }: { id: string }) => {
  const { updateNode, setNodes, deleteNode } = useFlowNodesContext();
  const { getNode } = useReactFlow();
  const { darkMode } = useThemeContext();

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
      const nodeType = relationshipType === "tension" ? "tension" : "relationship";
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
        className={`node relative w-[320px] rounded-[24px] border transition-all duration-200 bg-white text-slate-900 ${
          darkMode
            ? "border-slate-700 shadow-[0_24px_60px_rgba(8,15,30,0.45)]"
            : "border-slate-200 shadow-[0_24px_55px_rgba(15,23,42,0.12)]"
        }`}
      >
        <div className="absolute inset-0 pointer-events-none rounded-[24px] bg-[radial-gradient(circle_at_top,rgba(124,58,237,0.08),transparent_60%)]" />
        <div className="relative p-6 space-y-5">
          <div>
            <p className={`text-[11px] uppercase tracking-[0.32em] ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
              Define Connection
            </p>
            <h3 className="text-lg font-semibold">Choose Relationship Type</h3>
            <p className={`mt-1 text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
              Select whether these parts are in tension or interacting.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => convertToRelationship("tension")}
              className={`flex flex-col items-start gap-2 rounded-xl border px-4 py-3 transition-all duration-200 ${
                darkMode
                  ? "border-purple-400/40 bg-purple-500/15 hover:bg-purple-500/25"
                  : "border-purple-200 bg-purple-50 hover:bg-purple-100"
              }`}
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/20 text-purple-600">
                <Sword size={20} />
              </span>
              <div>
                <p className="font-semibold text-sm text-purple-700">Tension</p>
                <p className="text-xs text-purple-600">Parts in opposition</p>
              </div>
            </button>

            <button
              onClick={() => convertToRelationship("interaction")}
              className={`flex flex-col items-start gap-2 rounded-xl border px-4 py-3 transition-all duration-200 ${
                darkMode
                  ? "border-sky-400/40 bg-sky-500/15 hover:bg-sky-500/25"
                  : "border-sky-200 bg-sky-50 hover:bg-sky-100"
              }`}
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/20 text-sky-600">
                <Users size={20} />
              </span>
              <div>
                <p className="font-semibold text-sm text-sky-700">Interaction</p>
                <p className="text-xs text-sky-600">Parts working together</p>
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

