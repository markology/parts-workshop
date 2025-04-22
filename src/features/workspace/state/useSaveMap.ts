import { useState } from "react";
import { useSaveMapMutation } from "./hooks/api/useSaveMapMutation";
import { SaveMapArgs } from "@/types/api/map";

const useSaveMap = ({
  mapId,
  nodes,
  edges,
  sidebarImpressions,
}: SaveMapArgs) => {
  const mutation = useSaveMapMutation();
  const [saveCheck, setSaveCheck] = useState(false);

  const handleSaveMap = () => {
    mutation.mutate(
      {
        mapId,
        nodes,
        edges,
        sidebarImpressions,
      },
      {
        onSuccess: () => {
          setSaveCheck(true);
          setTimeout(() => setSaveCheck(false), 1000);
        },
      }
    );
  };

  return {
    isSavingMap: mutation.isPending,
    saveCheck,
    handleSaveMap,
  };
};

export default useSaveMap;
