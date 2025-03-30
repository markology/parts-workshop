export type ContextMenuItem = {
  label?: string;
  icon?: React.ReactNode;
  onClick: () => void;
};

type ContextMenuProps = {
  //   pos: { left: number; top: number };
  items: ContextMenuItem[];
  onClose: () => void;
};

const RightClickMenu = ({ items, onClose }: ContextMenuProps) => {
  return (
    <div
      style={{
        display: "inline-block",
        background: "white",
        border: "1px solid #ccc",
        borderRadius: "4px",
        padding: "4px 0",
        gap: 10,
        zIndex: 1000,
        boxShadow: "0px 2px 8px rgba(0,0,0,0.15)",
      }}
      onClick={onClose} // close when clicking the menu
      //   onContextMenu={(e) => e.preventDefault()}
    >
      {items.map((item, index) => (
        <div
          key={index}
          style={{
            cursor: "pointer",
            padding: "4px 8px",
          }}
          onClick={() => {
            item.onClick();
            onClose();
          }}
        >
          {item?.icon || item?.label}
        </div>
      ))}
    </div>
  );
};

export default RightClickMenu;

// const RightClickMenu = () => {
//   const [contextMenu, setContextMenu] = useState<{
//     x: number;
//     y: number;
//     itemId: string | null;
//   } | null>(null);

//   const showCustomMenu = ({
//     x,
//     y,
//     itemId,
//   }: {
//     x: number;
//     y: number;
//     itemId: string;
//   }) => {
//     setContextMenu({ x, y, itemId });
//   };

//   const closeMenu = () => setContextMenu(null);
//   return (
//     <div
//       style={{
//         top: contextMenu.y,
//         right: contextMenu.x,
//         background: "white",
//         padding: "8px",
//         border: "1px solid gray",
//         zIndex: 9999,
//         borderRadius: "6px",
//         width: 70,
//         boxShadow: "0px 2px 8px rgba(0,0,0,0.15)",
//         // marginLeft: 30,
//         cursor: "pointer",
//         marginTop: 4,
//         display: "flex",
//         gap: 10,
//         justifySelf: "right",
//       }}
//       onClick={closeMenu}
//     >
//       <div onClick={() => console.log("Edit", contextMenu.itemId)}>
//         <Pencil size={20} strokeWidth={2} />
//       </div>
//       <div onClick={() => console.log("Delete", contextMenu.itemId)}>
//         <Trash2 size={20} strokeWidth={2} />
//       </div>
//     </div>
//   );
// };
