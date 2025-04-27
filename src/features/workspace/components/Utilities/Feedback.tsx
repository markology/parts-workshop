import React, { useState } from "react";
import { Mail, MailPlus } from "lucide-react";
import ToolTipWrapper from "@/components/ToolTipWrapper";
import { useUIStore } from "@/features/workspace/state/stores/UI";
const Logout: React.FC = () => {
  const [isHovering, setIsHovering] = useState(false);
  const setShowFeedbackModal = useUIStore((s) => s.setShowFeedbackModal);

  return (
    <ToolTipWrapper message="Send Feedback">
      <button
        className=" w-15 h-15 rounded-lg flex items-center justify-center cursor-pointer z-50 bg-black/25"
        id="log-out"
        onClick={() => setShowFeedbackModal(true)}
        onMouseOver={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {isHovering ? (
          <MailPlus color="white" strokeWidth={2} size={30} />
        ) : (
          <Mail color="white" strokeWidth={2} size={30} />
        )}
      </button>
    </ToolTipWrapper>
  );
};

export default Logout;
