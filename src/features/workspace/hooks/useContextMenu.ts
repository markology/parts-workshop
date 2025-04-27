import { ContextMenuItem } from "@/components/RightClickMenu";
import { useUIStore } from "@/features/workspace/state/stores/UI";
import { useRef } from "react";

export default function useContextMenu({
  id,
  menuItems,
}: {
  id: string;
  menuItems: ContextMenuItem[];
}) {
  const contextMenuParentNodeId = useUIStore((s) => s.contextMenuParentNodeId);
  const setContextMenuParentNodeId = useUIStore(
    (s) => s.setContextMenuParentNodeId
  );
  const nodeRef = useRef<HTMLDivElement>(null);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (nodeRef.current) {
      setContextMenuParentNodeId(id);
    }
  };

  return {
    nodeRef,
    handleContextMenu,
    menuItems,
    showContextMenu: contextMenuParentNodeId === id,
  };
}
