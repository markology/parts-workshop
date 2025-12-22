"use client";

import React from "react";

export type ContextMenuItem = {
  label?: string;
  icon?: React.ReactElement<{ size?: number }>;
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
          className="flex cursor-pointer items-center gap-2 px-3 py-2 text-black hover:bg-gray-100"
          onClick={() => {
            item.onClick();
          }}
        >
          {item.icon && React.isValidElement(item.icon) ? (
            React.cloneElement(item.icon, {
              size: Math.max((item.icon.props?.size ?? 16) + 4, 20),
            })
          ) : null}
          {item.label && <span className="text-sm font-medium">{item.label}</span>}
          {!item.label && !item.icon && <span className="text-sm">Action</span>}
        </div>
      ))}
    </div>
  );
};

export default RightClickMenu;
