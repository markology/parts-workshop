import { ImpressionList } from "@/features/workspace/constants/Impressions";
import { useFlowNodesContext } from "@/features/workspace/state/FlowNodesContext";
import { useUIStore } from "@/features/workspace/state/stores/UI";
import { ImpressionTextType } from "@/features/workspace/types/Impressions";
import { PartNodeData } from "@/features/workspace/types/Nodes";
import { Handle, Position } from "@xyflow/react";
import { Pencil, PencilIcon, SquareUserRound, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import PartImpressionList from "./PartImpressionList/PartImpressionList";
// import PartNeeds from "./PartNeeds";
import RightClickMenu from "@/components/RightClickMenu";
import { useJournalStore } from "@/features/workspace/state/stores/Journal";
import useContextMenu from "@/features/workspace/hooks/useContextMenu";
import detachImpressionFromPart from "@/features/workspace/state/updaters/detachImpressionFromPart";

let index = 0;
const PartNode = ({ data, partId }: { data: PartNodeData; partId: string }) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(data.label);
  const {
    deleteEdges,
    deleteNode,
    removePartFromAllConflicts,
    updatePartName,
  } = useFlowNodesContext();
  const { setJournalTarget } = useJournalStore();

  const isEditing = useUIStore((s) => s.isEditing);
  const setIsEditing = useUIStore((s) => s.setIsEditing);
  const inputRef = useRef<HTMLInputElement>(null);

  const { handleContextMenu, showContextMenu, nodeRef, menuItems } =
    useContextMenu({
      id: partId,
      menuItems: useMemo(
        () => [
          {
            icon: <Trash2 size={16} />,
            onClick: () => {
              deleteNode(partId);
              removePartFromAllConflicts(partId);
              deleteEdges(partId);
            },
          },
          {
            icon: <PencilIcon size={16} />,
            onClick: () =>
              setJournalTarget({
                type: "node",
                nodeId: partId,
                nodeType: "part",
                title: data.label,
              }),
          },
        ],
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [detachImpressionFromPart, partId]
      ),
    });

  const handleSave = useCallback(() => {
    if (title === data.label || title === "") {
      setIsEditing(false);
      setIsEditingTitle(false);
      if (title === "") setTitle(data.label);
      return;
    }

    updatePartName(partId, title);

    setIsEditing(false);
    setIsEditingTitle(false);
  }, [title, data, updatePartName, partId, setIsEditing]);

  const handleEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSave();
    }
  };

  // Detect clicks outside the input
  useEffect(() => {
    if (!isEditing) handleSave();
  }, [handleSave, isEditing]);

  return (
    <>
      <div
        onContextMenu={handleContextMenu}
        ref={nodeRef}
        className="node part-node bg-[linear-gradient(251deg,_#a0c9fd36_0%,_#8ad5f173_100%)] z-[-999] rounded p-10 w-80  flex flex-col w-[1000px] h-auto rounded-3xl text-left"
      >
        {/* Title */}
        <div className="flex justify-between">
          {isEditingTitle ? (
            <input
              className="part-name font-semibold mb-2 text-gray-800 text-4xl pb-4 flex gap-[20px]"
              ref={inputRef}
              onKeyDown={handleEnter}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          ) : (
            <h3
              onClick={() => {
                setIsEditingTitle(true);
                setIsEditing(true);
              }} // TODO
              className="part-name font-semibold mb-2 text-theme text-4xl pb-4 flex gap-[20px]"
            >
              {data.label}
              <button>
                <Pencil
                  className="text-[#3d4f6a] cursor-default"
                  strokeWidth={3}
                  size={20}
                />
              </button>
            </h3>
          )}
          <SquareUserRound
            className="text-[#a7c0dd]"
            strokeWidth={2}
            size={40}
          />
        </div>
        <div
          className={
            "flex flex-row gap-4 flex-grow space-evenly flex gap-2 flex-col min-h-[300px]"
          }
        >
          {ImpressionList.map((impression) => (
            <PartImpressionList
              key={`PartImpressionList ${index++}`}
              data={data[ImpressionTextType[impression]]}
              type={impression}
              partId={partId}
            />
          ))}
        </div>
        {/* <PartNeeds needs={data.needs} partId={partId} /> */}
        {/* Handles for edges */}
        <Handle
          className="part-handle"
          type="source"
          position={Position.Top}
          id="top"
        />
        <Handle
          className="part-handle"
          type="source"
          position={Position.Bottom}
          id="bottom"
        />
        <Handle
          className="part-handle"
          type="source"
          position={Position.Left}
          id="left"
        />
        <Handle
          className="part-handle"
          type="source"
          position={Position.Right}
          id="right"
        />
      </div>
      {showContextMenu && <RightClickMenu items={menuItems} />}
    </>
  );
};

export default PartNode;
