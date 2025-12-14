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
import { useThemeContext } from "@/state/context/ThemeContext";
import { useTheme } from "@/features/workspace/hooks/useTheme";

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
  const { darkMode } = useThemeContext();
  const theme = useTheme();

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

  const accent = NodeBackgroundColors[type];
  const accentText = NodeTextColors[type] || accent;

  const toRgba = (hex: string, opacity: number) => {
    const sanitized = hex.replace("#", "");
    const bigint = parseInt(sanitized, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  // Calculate opaque color that matches translucent color on background
  // result = (1 - alpha) * background + alpha * color
  const blendOnBackground = (hex: string, opacity: number, backgroundHex: string) => {
    const sanitized = hex.replace("#", "");
    const bigint = parseInt(sanitized, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    
    // Parse background color
    const bgSanitized = backgroundHex.replace("#", "");
    const bgBigint = parseInt(bgSanitized, 16);
    const bgR = (bgBigint >> 16) & 255;
    const bgG = (bgBigint >> 8) & 255;
    const bgB = bgBigint & 255;
    
    const blendedR = Math.round((1 - opacity) * bgR + opacity * r);
    const blendedG = Math.round((1 - opacity) * bgG + opacity * g);
    const blendedB = Math.round((1 - opacity) * bgB + opacity * b);
    
    return `rgb(${blendedR}, ${blendedG}, ${blendedB})`;
  };

  // Use sidebar opacity values: 0.24 for light mode, 0.45 for dark mode
  const sidebarOpacity = darkMode ? 0.45 : 0.24;
  // Blend with workspace background (canvas background)
  const chipBackground = blendOnBackground(accent, sidebarOpacity, theme.workspace);
  const chipBorder = blendOnBackground(accent, darkMode ? 0.65 : 0.32, theme.workspace);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData(
      "parts-workshop/canvas-impression",
      JSON.stringify({ id, type, label })
    );
    e.dataTransfer.effectAllowed = "move";
  };

  return (
    <div className="node impression-node text-right overflow-hidden">
      <div
        ref={nodeRef}
        onContextMenu={handleContextMenu}
        onDragStart={handleDragStart}
        draggable
        className="text-left rounded-xl border px-3 py-2 text-sm font-medium shadow-sm break-words min-w-[180px] max-w-[300px] flex flex-col gap-2 relative overflow-hidden cursor-grab active:cursor-grabbing"
        style={{
          backgroundColor: chipBackground,
          borderColor: chipBorder,
          color: darkMode ? theme.textPrimary : accentText,
        }}
      >
        <div className="flex items-center justify-between gap-2">
          <strong className="text-sm font-semibold">
            {`${ImpressionTextType[type]}`}
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
            className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-xs transition-colors hover:bg-white/20 flex-shrink-0"
            title="Open Journal"
          >
            <BookOpen size={16} />
          </button>
        </div>

        <div className="text-sm leading-relaxed">
          {label || "No label provided"}
        </div>
      </div>
      
      {showContextMenu && <RightClickMenu items={menuItems} />}
    </div>
  );
};

export default ImpressionNode;
