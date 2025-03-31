export type ContextMenuItem = {
  label?: string;
  icon?: React.ReactNode;
  onClick: () => void;
};

type ContextMenuProps = {
  items: ContextMenuItem[];
  onClose: () => void;
};

const RightClickMenu = ({ items, onClose }: ContextMenuProps) => {
  return (
    <div
      className="inline-block bg-white border border-[#ccc] rounded-[4px] p-[4px_0] gap-[10px] z-1000 shadow-[0px_2px_8px_rgba(0,0,0,0.15)]"
      onClick={onClose} // close when clicking the menu
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
