import type { Metadata } from "next";
import ProtectedRoute from "@/components/ProtectedRoute";
import AccountPageClient from "./AccountPageClient";

export const metadata: Metadata = {
  title: "Account | Parts Studio",
  description: "Manage your Parts Studio account and billing settings.",
};

export default function AccountPage() {
  return (
    <ProtectedRoute>
      <AccountPageClient />
    </ProtectedRoute>
  );
}

