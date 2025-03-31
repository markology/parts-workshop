import { NodeColors, NodeTextColors } from "@/constants/Nodes";
import { Handle, Position } from "@xyflow/react";
// import { useCallback, useMemo, useRef, useState } from "react";
// import { useFlowNodesContext } from "@/context/FlowNodesContext";
// import { useSidebarStore } from "@/stores/Sidebar";
// import RightClickMenu from "../global/RightClickMenu";
// import { ListRestart, Pencil, Trash2 } from "lucide-react";

const ConflictNode = () =>
  // { id, label }: { id: string; label: string }
  {
    //   const [menuVisible, setMenuVisible] = useState(false);
    //   const nodeRef = useRef<HTMLDivElement>(null);
    //   const { deleteNode } = useFlowNodesContext();
    //   const addImpression = useSidebarStore((s) => s.addImpression);

    //   const handleContextMenu = (e: React.MouseEvent) => {
    //     e.preventDefault();
    //     e.stopPropagation();

    //     if (nodeRef.current) {
    //       setMenuVisible(true);
    //     }
    //   };

    //   const handleSendBackToSideBar = useCallback(
    //     (id: string, type: ImpressionType) => {
    //       deleteNode(id);
    //       addImpression({
    //         id,
    //         type,
    //         label,
    //       });
    //     },
    //     [addImpression, deleteNode, label]
    //   );

    //   const menuItems = useMemo(
    //     () => [
    //       {
    //         icon: <Pencil size={16} />,
    //         onClick: () => console.log("Edit node"),
    //       },
    //       {
    //         icon: <Trash2 size={16} />,
    //         onClick: () => deleteNode(id),
    //       },
    //       {
    //         icon: <ListRestart size={16} />,
    //         onClick: () => handleSendBackToSideBar(id, type),
    //       },
    //     ],
    //     [deleteNode, handleSendBackToSideBar, id, type]
    //   );

    return (
      <div>
        <div
          className="text-white bg-[#4ecdc4] rounded break-words px-5 py-2 pb-6 min-w-[100px] flex flex-col gap-[10px]"
          style={{ backgroundColor: NodeColors["conflict"] }}
          // ref={nodeRef}
          // onContextMenu={handleContextMenu}
        >
          <strong
            className="text-sm flex-1 justify-items-center"
            style={{ color: NodeTextColors["conflict"] }}
          >
            Conflict
          </strong>
          {/* 
            edges.map
            create x part names and corresponding explanations
        */}
        </div>
        {/* {menuVisible && <RightClickMenu items={menuItems} onClose={() => {}} />} */}
        {/* Handles for edges */}
        <Handle type="source" position={Position.Top} />
        <Handle type="source" position={Position.Bottom} />
        <Handle type="source" position={Position.Left} />
        <Handle type="source" position={Position.Right} />
      </div>
    );
  };

export default ConflictNode;
