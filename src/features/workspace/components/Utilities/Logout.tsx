import React from "react";
import { LogOut } from "lucide-react";
import { redirect } from "next/navigation";

const Logout: React.FC = () => {
  return (
    <button
      className="fixed top-45 right-5 w-15 h-15 rounded-lg flex items-center justify-center cursor-pointer z-50 bg-black/25"
      id="log-out"
      onClick={() => redirect("/api/auth/logout")}
    >
      <LogOut color="white" strokeWidth={2} size={30} />
    </button>
  );
};

export default Logout;
