// import PartNeeds from "./PartNeeds";
import RightClickMenu from "@/components/RightClickMenu";
import { ImpressionList } from "@/features/workspace/constants/Impressions";
import useContextMenu from "@/features/workspace/hooks/useContextMenu";
import { useFlowNodesContext } from "@/features/workspace/state/FlowNodesContext";
import { useJournalStore } from "@/features/workspace/state/stores/Journal";
import { useUIStore } from "@/features/workspace/state/stores/UI";
import detachImpressionFromPart from "@/features/workspace/state/updaters/detachImpressionFromPart";
import { ImpressionTextType } from "@/features/workspace/types/Impressions";
import { PartNodeData } from "@/features/workspace/types/Nodes";
import { Handle, Position } from "@xyflow/react";
import { Pencil, PencilIcon, SquareUserRound, Trash2, Palette } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import PartImpressionList from "./PartImpressionList/PartImpressionList";
import Part3DMappingModal from "../../Part3DMapping/Part3DMappingModal";

let index = 0;
const PartNode = ({ data, partId }: { data: PartNodeData; partId: string }) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(data.label);
  const [show3DMapping, setShow3DMapping] = useState(false);
  const {
    deleteEdges,
    deleteNode,
    removePartFromAllConflicts,
    updatePartName,
    updateNode,
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

  const handleSave3DMapping = useCallback((imageData: string, paintPoints: any[]) => {
    // Update the part node with the 3D mapping data
    updateNode<PartNodeData>(partId, {
      data: {
        ...data,
        image: imageData,
        // Store paint points as a custom property for potential future use
        scratchpad: data.scratchpad ? 
          `${data.scratchpad}\n\n3D Mapping Data: ${JSON.stringify(paintPoints)}` : 
          `3D Mapping Data: ${JSON.stringify(paintPoints)}`
      }
    });
  }, [updateNode, partId, data]);

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
        className="node part-node bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border border-blue-200/50 rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-blue-300 hover:from-blue-100 hover:via-indigo-100 hover:to-purple-100 z-[-999] p-10 w-80 flex flex-col w-[1000px] h-auto text-left"
      >
        {/* Title */}
        <div className="flex justify-between items-start">
          <div className="flex-1">
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
          </div>
          <div className="flex items-center gap-2">
            {/* 3D Mapping Button */}
            <button
              onClick={() => setShow3DMapping(true)}
              className="p-2 bg-purple-100 hover:bg-purple-200 rounded-lg transition-colors"
              title="3D Body Mapping"
            >
              <Palette className="w-5 h-5 text-purple-600" />
            </button>
            <SquareUserRound
              className="text-[#a7c0dd]"
              strokeWidth={2}
              size={40}
            />
          </div>
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
      
      {/* 3D Mapping Modal */}
      <Part3DMappingModal
        isOpen={show3DMapping}
        onClose={() => setShow3DMapping(false)}
        partName={data.label}
        partId={partId}
        currentImage={data.image}
        onSave={handleSave3DMapping}
      />
    </>
  );
};

export default PartNode;
