import React, { useState } from "react";
import { ArrowRightFromLine, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import ToolTipWrapper from "@/components/ToolTipWrapper";

const Logout: React.FC = () => {
  const [isHovering, setIsHovering] = useState(false);

  return (
    <ToolTipWrapper message="Sign Out">
      <button
        className=" w-15 h-15 rounded-lg flex items-center justify-center cursor-pointer z-50 bg-black/25"
        id="log-out"
        onClick={() => signOut({ callbackUrl: "/" })}
        onMouseOver={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {isHovering ? (
          <LogOut color="white" strokeWidth={2} size={30} />
        ) : (
          <ArrowRightFromLine color="white" strokeWidth={2} size={30} />
        )}
      </button>
    </ToolTipWrapper>
  );
};

export default Logout;
