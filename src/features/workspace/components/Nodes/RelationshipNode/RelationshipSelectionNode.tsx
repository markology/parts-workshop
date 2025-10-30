"use client";

import RightClickMenu from "@/components/RightClickMenu";
import useContextMenu from "@/features/workspace/hooks/useContextMenu";
import { useFlowNodesContext } from "@/features/workspace/state/FlowNodesContext";
import { useReactFlow } from "@xyflow/react";
import { Sword, Users, Trash2 } from "lucide-react";
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
    (relationshipType: "conflict" | "ally") => {
      const node = getNode(id);
      if (!node) return;

      // Update the node to the chosen relationship type
      setNodes((nodes) =>
        nodes.map((n) => {
          if (n.id === id) {
            return {
              ...n,
              type: relationshipType,
              data: {
                type: "conflictData",
                label: relationshipType === "conflict" ? "Conflict" : "Ally",
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
        className="node min-w-[200px] max-w-[280px] min-h-[120px] bg-gray-100 rounded-lg break-words px-4 py-3 flex flex-col gap-3 text-left border-2 border-gray-300"
      >
        <div className="text-center">
          <strong className="text-sm text-gray-700 font-semibold">
            Choose Relationship Type
          </strong>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => convertToRelationship("conflict")}
            className="flex-1 p-4 rounded-lg border-2 border-purple-300 bg-purple-50 hover:bg-purple-100 transition-colors flex flex-col items-center gap-2"
          >
            <Sword size={24} className="text-purple-600" />
            <span className="font-semibold text-purple-800 text-sm">Conflict</span>
            <span className="text-xs text-purple-600">Parts in opposition</span>
          </button>
          <button
            onClick={() => convertToRelationship("ally")}
            className="flex-1 p-4 rounded-lg border-2 border-sky-300 bg-sky-50 hover:bg-sky-100 transition-colors flex flex-col items-center gap-2"
          >
            <Users size={24} className="text-sky-600" />
            <span className="font-semibold text-sky-800 text-sm">Ally</span>
            <span className="text-xs text-sky-600">Parts working together</span>
          </button>
        </div>
      </div>
      {showContextMenu && <RightClickMenu items={menuItems} />}
    </>
  );
};

export default RelationshipSelectionNode;

