import {
  NodeBackgroundColors,
  NodeTextColors,
} from "@/features/workspace/constants/Nodes";
import { useCallback, useMemo } from "react";
import { useFlowNodesContext } from "@/features/workspace/state/FlowNodesContext";
import { ListRestart, Trash2, BookOpen } from "lucide-react";
import RightClickMenu from "@/components/RightClickMenu";
import {
  ImpressionTextType,
  ImpressionType,
} from "@/features/workspace/types/Impressions";
import useContextMenu from "@/features/workspace/hooks/useContextMenu";
import detachImpressionFromPart from "../../state/updaters/detachImpressionFromPart";
import { useJournalStore } from "@/features/workspace/state/stores/Journal";
import { useWorkingStore } from "../../state/stores/useWorkingStore";

const ImpressionNode = ({
  id,
  label,
  type,
}: {
  id: string;
  label: string;
  type: ImpressionType;
}) => {
  const { deleteNode } = useFlowNodesContext();
  const { setJournalTarget } = useJournalStore();

  const { handleContextMenu, showContextMenu, nodeRef, menuItems } =
    useContextMenu({
      id,
      menuItems: useMemo(
        () => [
          {
            icon: <Trash2 size={16} />,
            onClick: () => deleteNode(id),
          },
          {
            icon: <ListRestart size={16} />,
            onClick: () => handleSendBackToSideBar(id, type),
          },
        ],
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [detachImpressionFromPart, id]
      ),
    });

  const handleSendBackToSideBar = useCallback(
    (id: string, type: ImpressionType) => {
      deleteNode(id);
      useWorkingStore.getState().addImpression({
        id,
        type,
        label,
      });
    },
    [deleteNode, label]
  );

  return (
    <div className="node impression-node text-right">
      <div
        className="text-white text-left bg-[#4ecdc4] rounded break-words px-5 py-2 pb-6 min-w-[100px] flex flex-col gap-[10px] relative"
        style={{ backgroundColor: NodeBackgroundColors[type] }}
        ref={nodeRef}
        onContextMenu={handleContextMenu}
      >
        <div className="flex items-center justify-between">
          <strong
            className="text-sm flex-1 justify-items-center"
            style={{ color: NodeTextColors[type] }}
          >
            {`${ImpressionTextType[type]}:`}
          </strong>
          <button
            onClick={() =>
              setJournalTarget({
                type: "node",
                nodeId: id,
                nodeType: type,
                title: label,
              })
            }
            className="p-1 text-white hover:text-gray-200 hover:bg-white/20 rounded"
            title="Open Journal"
          >
            <BookOpen size={16} />
          </button>
        </div>
        {label || null}
      </div>
      {showContextMenu && <RightClickMenu items={menuItems} />}
    </div>
  );
};

export default ImpressionNode;
