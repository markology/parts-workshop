import { useUIStore } from "@/state/UI";
import { useEffect, useState } from "react";
import { WorkshopNode } from "@/types/Nodes";
import { Edge } from "@xyflow/react";
import { ImpressionType } from "@/types/Impressions";
import { SidebarImpression } from "@/types/Sidebar";

export type SaveMapArgs = {
  mapId?: string;
  nodes: WorkshopNode[];
  edges: Edge[];
  sidebarImpressions: Record<ImpressionType, Record<string, SidebarImpression>>;
};

const useSaveMap = ({ saveMap }: { saveMap: () => void }) => {
  const isSavingMap = useUIStore((s) => s.isSavingMap);
  const setIsSavingMap = useUIStore((s) => s.setIsSavingMap);
  const [saveCheck, setSaveCheck] = useState(false);

  useEffect(() => {
    if (isSavingMap)
      setTimeout(() => {
        setSaveCheck(true);

        setTimeout(() => {
          setIsSavingMap(false);
          setSaveCheck(false);
        }, 1000);
      }, 1000);
  }, [isSavingMap]);

  const handleSaveMap = () => {
    if (!isSavingMap) {
      setIsSavingMap(true);
      saveMap();
    }
  };

  return {
    isSavingMap,
    saveCheck,
    handleSaveMap,
  };
};

export default useSaveMap;
