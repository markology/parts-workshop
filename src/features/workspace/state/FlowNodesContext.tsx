"use client";
import React, { createContext, useContext, useMemo } from "react";

import { useFlowNodes } from "./useFlowNodes"; // your custom hook

const FlowNodesContext = createContext<ReturnType<typeof useFlowNodes> | null>(
  null
);

// Separate context for stable action functions that don't change when nodes/edges change
const FlowNodesActionsContext = createContext<{
  createNode: ReturnType<typeof useFlowNodes>['createNode'];
} | null>(null);

export const FlowNodesProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const flowNodes = useFlowNodes();
  
  // Memoize the actions object so it only changes when the functions themselves change
  // This prevents components using only actions from re-rendering when nodes/edges change
  const actions = useMemo(() => ({
    createNode: flowNodes.createNode,
  }), [flowNodes.createNode]);
  
  return (
    <FlowNodesContext.Provider value={flowNodes}>
      <FlowNodesActionsContext.Provider value={actions}>
        {children}
      </FlowNodesActionsContext.Provider>
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

// Hook for components that only need stable action functions (like FloatingActionButtons)
// This prevents re-renders when nodes/edges change
export const useFlowNodesActions = () => {
  const ctx = useContext(FlowNodesActionsContext);
  if (!ctx)
    throw new Error(
      "useFlowNodesActions must be used within <FlowNodesProvider>"
    );
  return ctx;
};

// Optional hook that returns null if context is not available (useful for components that may render outside the provider)
export const useFlowNodesContextOptional = () => {
  return useContext(FlowNodesContext);
};