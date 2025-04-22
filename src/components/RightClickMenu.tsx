"use client";

export type ContextMenuItem = {
  label?: string;
  icon?: React.ReactNode;
  onClick: () => void;
};

type ContextMenuProps = {
  items: ContextMenuItem[];
  style?: "float" | "dropdown";
};

const RightClickMenu = ({ items, style = "float" }: ContextMenuProps) => {
  return (
    <div
      className={`inline-block ml-[-33px] absolute bg-white border border-[#ccc] rounded-[4px] p-[4px_0] gap-[10px] z-1000 shadow-[0px_2px_8px_rgba(0,0,0,0.15)] ${
        style === "float" && "inline-flex top-[-50px] right-0"
      } `} // close when clicking the menu
    >
      {items.map((item, index) => (
        <div
          key={index}
          className="cursor-pointer px-2 py-1 hover:bg-gray-100"
          onClick={() => {
            item.onClick();
          }}
        >
          {item?.icon || item?.label}
        </div>
      ))}
    </div>
  );
};

export default RightClickMenu;
