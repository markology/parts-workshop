"use client";

import RightClickMenu from "@/components/RightClickMenu";
import useContextMenu from "@/features/workspace/hooks/useContextMenu";
import { useFlowNodesContext } from "@/features/workspace/state/FlowNodesContext";
import { useReactFlow } from "@xyflow/react";
import { MessageCircleWarning, Users, Trash2 } from "lucide-react";
import { useCallback, useMemo } from "react";

const RelationshipSelectionNode = ({ id }: { id: string }) => {
  const { updateNode, setNodes, deleteNode } = useFlowNodesContext();
  const { getNode } = useReactFlow();

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
      const nodeType =
        relationshipType === "tension" ? "tension" : "interaction";
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
        className="node relative w-[320px] rounded-[24px] transition-all duration-200 bg-[image:var(--theme-relationship-selection-node-bg)] theme-light:text-slate-900 theme-dark:text-slate-100"
        style={{
          borderColor: "var(--theme-relationship-selection-node-border)",
        }}
      >
        <div className="absolute inset-0 pointer-events-none rounded-[24px] bg-[var(--theme-relationship-selection-node-overlay)]" />
        <div className="relative p-6 space-y-5">
          <div>
            <p className="text-[11px] uppercase tracking-[0.32em] theme-light:text-slate-500 theme-dark:text-slate-400">
              Define Connection
            </p>
            <h3 className="text-lg font-semibold theme-light:text-slate-900 theme-dark:text-slate-100">
              Choose Relationship Type
            </h3>
            <p className="mt-1 text-sm theme-light:text-slate-500 theme-dark:text-slate-400">
              Select whether these parts are in tension or interacting.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => convertToRelationship("tension")}
              className="group flex flex-col items-center gap-2 rounded-xl px-4 py-3 transition-all duration-200 theme-light:bg-purple-50 theme-light:hover:bg-purple-100 border-none theme-dark:bg-[var(--theme-foreground-button-bg)] theme-dark:hover:border-white/20 theme-dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] theme-dark:hover:bg-[#484c4f] shadow-sm"
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full theme-light:text-purple-600 theme-dark:bg-[#3d434b] theme-dark:text-purple-100 theme-dark:group-hover:text-[#e9d5ff] transition-colors">
                <MessageCircleWarning size={20} />
              </span>
              <div className="text-center">
                <p className="font-semibold text-sm theme-light:text-purple-700 theme-dark:text-purple-200">
                  Tension
                </p>
                <p className="text-xs theme-light:text-purple-600 theme-dark:text-purple-300">
                  Parts in opposition
                </p>
              </div>
            </button>

            <button
              onClick={() => convertToRelationship("interaction")}
              className="group flex flex-col items-center gap-2 rounded-xl px-4 py-3 transition-all duration-200 theme-light:bg-sky-50 theme-light:hover:bg-sky-100 border-none theme-dark:bg-[var(--theme-foreground-button-bg)] theme-dark:hover:border-white/20 theme-dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] theme-dark:hover:bg-[#484c4f] shadow-sm"
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full theme-light:text-sky-600 theme-dark:bg-[#3d434b] theme-dark:text-sky-100 theme-dark:group-hover:text-[#dbeafe] transition-colors">
                <Users size={20} />
              </span>
              <div className="text-center">
                <p className="font-semibold text-sm theme-light:text-sky-700 theme-dark:text-sky-200">
                  Interaction
                </p>
                <p className="text-xs theme-light:text-sky-600 theme-dark:text-sky-300">
                  Parts working together
                </p>
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
