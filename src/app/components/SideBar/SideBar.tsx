import React, { Dispatch, SetStateAction, useState } from "react";
import { NodeType } from "../Nodes/types";
import ImpressionInput from "./ImpressionInput";
import ImpressionDisplay from "./ImpressionDisplay";
import PartInput from "./PartInput";
import { NodeStateType } from "@/app/page";

export type SideBarItem = {
  id: string;
  label: string;
  type: NodeType;
};

export const impressionTypes: NodeType[] = [
  "emotion",
  "thought",
  "sensation",
  "behavior",
  // "conflict",
  // "part",
  "self",
  "other",
];

const SideBar = ({
  setActiveSideBarNode,
  setNodes,
}: {
  setActiveSideBarNode: Dispatch<SetStateAction<SideBarItem | null>>;
  setNodes: NodeStateType["setNodes"];
}) => {
  const [items, setItems] = useState<SideBarItem[]>([]);
  const addNewItem = (item: SideBarItem) => setItems([...items, item]);

  return (
    <aside id="sidebar">
      <PartInput setNodes={setNodes} />
      <ImpressionInput setItems={addNewItem} />
      <ImpressionDisplay
        setActiveSideBarNode={setActiveSideBarNode}
        items={items}
      />
    </aside>
  );
};

export default SideBar;
