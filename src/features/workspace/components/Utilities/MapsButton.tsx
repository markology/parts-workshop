import React, { useState } from "react";
import { Map, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import ToolTipWrapper from "@/components/ToolTipWrapper";

const MapsButton: React.FC = () => {
  const [isHovering, setIsHovering] = useState(false);
  const router = useRouter();

  return (
    <ToolTipWrapper message="Back to Workspaces">
      <button
        className=" w-15 h-15 rounded-lg flex items-center justify-center cursor-pointer z-50 bg-black/25"
        id="maps-button"
        onClick={() => router.push("/workspaces")}
        onMouseOver={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {isHovering ? (
          <MapPin color="white" strokeWidth={2} size={30} />
        ) : (
          <Map color="white" strokeWidth={2} size={30} />
        )}
      </button>
    </ToolTipWrapper>
  );
};

export default MapsButton;
