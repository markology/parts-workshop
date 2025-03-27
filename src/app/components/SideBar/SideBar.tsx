import React, { Dispatch, SetStateAction, useState } from "react";
import { NodeType } from "../WorkshopNode";
import ImpressionInput from "./ImpressionInput";
import Impressions from "./Impressions";

export type SideBarItem = {
  id: string;
  label: string;
  type: NodeType;
};

export const nodeTypes: NodeType[] = [
  "emotion",
  "thought",
  "sensation",
  "behavior",
  "conflict",
  "part",
  "self",
  "other",
];

const SideBar = ({
  setActiveSideBarNode,
}: {
  setActiveSideBarNode: Dispatch<SetStateAction<SideBarItem | null>>;
}) => {
  const [items, setItems] = useState<SideBarItem[]>([]);
  const addNewItem = (item: SideBarItem) => setItems([...items, item]);

  return (
    <aside id="sidebar">
      <ImpressionInput setItems={addNewItem} />
      <Impressions setActiveSideBarNode={setActiveSideBarNode} items={items} />
    </aside>
  );
};

export default SideBar;
