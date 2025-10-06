import RightClickMenu from "@/components/RightClickMenu";
import {
  NodeBackgroundColors,
  NodeTextColors,
} from "@/features/workspace/constants/Nodes";
import { useFlowNodesContext } from "@/features/workspace/state/FlowNodesContext";
import useContextMenu from "@/features/workspace/hooks/useContextMenu";
import { useJournalStore } from "@/features/workspace/state/stores/Journal";
import {
  ConflictNode as ConflictNodeType,
  ConnectedNodeType,
} from "@/features/workspace/types/Nodes";
import { Handle, Position, useReactFlow } from "@xyflow/react";
import { Users, Trash2, BookOpen } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import detachImpressionFromPart from "../../../state/updaters/detachImpressionFromPart";

const AllyNode = ({
  connectedNodes,
  id,
}: {
  connectedNodes: ConnectedNodeType[];
  id: string;
}) => {
  const { getNode } = useReactFlow();
  const { deleteEdges, deleteNode, updateConflictDescription } =
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
      updateConflictDescription(
        getNode(id) as ConflictNodeType,
        editingId,
        editValue
      );
    }
    setEditValue("");
    setEditingId(null);
  }, [editValue, editingId, getNode, id, updateConflictDescription]);

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
        className="node text-white min-w-[200px] max-w-[280px] min-h-[100px] bg-[linear-gradient(348deg,#87CEEB,#B0E0E6);] rounded break-words px-4 py-2 pb-4 min-w-[100px] flex flex-col gap-[8px] text-left"
        style={{ backgroundColor: NodeBackgroundColors["ally"] }}
        onContextMenu={handleContextMenu}
        ref={nodeRef}
      >
        <div className="flex flex-row justify-between">
          <strong
            className="text-sm text-white justify-items-center semibold"
            style={{ color: NodeTextColors["ally"] }}
          >
            Ally
          </strong>
          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                setJournalTarget({
                  type: "node",
                  nodeId: id,
                  nodeType: "ally",
                  title: connectedNodes.reduce((acc, connectedNode) => {
                    return acc === ""
                      ? connectedNode.part.data.label
                      : acc + " + " + connectedNode.part.data.label;
                  }, ""),
                })
              }
              className="relative p-1 text-white hover:text-gray-200 hover:bg-white/20 rounded"
              title="Open Journal"
            >
              <BookOpen size={16} />
              {/* AI Sparkle */}
              <div className="absolute -top-1 -right-1 text-purple-500 animate-pulse text-xs font-bold">
                ✨
              </div>
            </button>
          </div>
        </div>
        <div className="flex gap-4 flex-col">
          {connectedNodes.length ? (
            connectedNodes.map(({ part, conflictDescription }) => (
              <div
                className="bg-[#87CEEB] p-3 rounded"
                onClick={() => {
                  setEditValue(conflictDescription);
                  setEditingId(part.id);
                }}
                key={`connectedNode ${part.id}`}
              >
                <p
                  className="text-xl pb-2 pl-1 mb-3 text-white border-b"
                  key={part.id}
                >
                  {part.data.label}
                </p>
                <div className="min-h-6 pl-1">
                  {part.id === editingId ? (
                    <input
                      className="text-sm h-[30px]"
                      ref={inputRef}
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={handleEnter}
                      autoFocus
                      placeholder="Enter description"
                    />
                  ) : conflictDescription ? (
                    <p className="max-w-[300px] text-sm break-words text-white">
                      {conflictDescription}
                    </p>
                  ) : (
                    <p className="text-sm">Enter description</p>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-xl text-[#B0E0E6]">Connect Parts to Ally</p>
          )}
        </div>
        <Handle
          className="ally-handle"
          type="target"
          position={Position.Top}
          id="top"
        />
        <Handle
          className="ally-handle"
          type="target"
          position={Position.Bottom}
          id="bottom"
        />
        <Handle
          className="ally-handle"
          type="target"
          position={Position.Left}
          id="left"
        />
        <Handle
          className="ally-handle"
          type="target"
          position={Position.Right}
          id="right"
        />
      </div>
      {showContextMenu && <RightClickMenu items={menuItems} />}
    </>
  );
};

export default AllyNode;