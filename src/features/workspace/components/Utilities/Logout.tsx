import React from "react";
import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

const Logout: React.FC = () => {
  return (
    <button
      className=" w-15 h-15 rounded-lg flex items-center justify-center cursor-pointer z-50 bg-black/25"
      id="log-out"
      onClick={() => signOut({ callbackUrl: "/" })}
    >
      <LogOut color="white" strokeWidth={2} size={30} />
    </button>
  );
};

export default Logout;
