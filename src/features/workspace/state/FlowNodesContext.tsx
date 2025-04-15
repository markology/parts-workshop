"use client";
import React, { createContext, useContext } from "react";

import { useFlowNodes } from "./useFlowNodes"; // your custom hook
import { Map } from "@/types/api/map";

const FlowNodesContext = createContext<ReturnType<typeof useFlowNodes> | null>(
  null
);

export const FlowNodesProvider = ({
  children,
  map,
}: {
  children: React.ReactNode;
  map?: Map;
}) => {
  const flowNodes = useFlowNodes(map);
  return (
    <FlowNodesContext.Provider value={flowNodes}>
      {children}
    </FlowNodesContext.Provider>
  );
};

export const useFlowNodesContext = () => {
  const ctx = useContext(FlowNodesContext);
  if (!ctx)
    throw new Error(
      "useFlowNodesContext must be used within <FlowNodesProvider>"
    );
  return ctx;
};
