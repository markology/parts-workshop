import React, { createContext, useContext } from "react";
import { useFlowNodes } from "@/hooks/useFlowNodes"; // your custom hook

const FlowNodesContext = createContext<ReturnType<typeof useFlowNodes> | null>(
  null
);

export const FlowNodesProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const flowNodes = useFlowNodes();
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
