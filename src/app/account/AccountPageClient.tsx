"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import toast from "react-hot-toast";
import {
  CreditCard,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  Trash2,
  User as UserIcon,
  WalletCards,
} from "lucide-react";
import PageLoader from "@/components/PageLoader";
import PageHeader from "@/components/PageHeader";
import { useTheme } from "@/features/workspace/hooks/useTheme";
import { useThemeContext } from "@/state/context/ThemeContext";

type AccountUser = {
  id: string;
  email: string;
  name: string | null;
  image?: string | null;
  createdAt?: string;
  hasPassword?: boolean;
};

const AccountPageClient = () => {
  const router = useRouter();
  const { status, update } = useSession();
  const theme = useTheme();
  const { isDark } = useThemeContext();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<AccountUser | null>(null);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [hasPassword, setHasPassword] = useState(false);

  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState("");

  const formattedCreatedAt = useMemo(() => {
    if (!profile?.createdAt) return "";
    try {
      return new Date(profile.createdAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "";
    }
  }, [profile?.createdAt]);

  const loadAccount = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/account");
      if (!res.ok) {
        throw new Error("Failed to load account");
      }
      const data = await res.json();
      setProfile(data.user);
      setEmail(data.user.email ?? "");
      setName(data.user.name ?? "");
      setHasPassword(Boolean(data.user.hasPassword));
    } catch (error) {
      console.error(error);
      toast.error("Could not load account settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      loadAccount();
    }
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const handleProfileSave = async () => {
    if (!email) {
      toast.error("Email is required");
      return;
    }

    setProfileSaving(true);
    try {
      const res = await fetch("/api/account/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Unable to update profile");
      }

      setProfile((prev) =>
        prev
          ? {
              ...prev,
              email: data.user.email,
              name: data.user.name,
            }
          : data.user
      );

      await update({
        user: {
          email: data.user.email,
          name: data.user.name,
        },
      });

      toast.success("Profile updated");
    } catch (error: unknown) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Unable to update profile"
      );
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordSave = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (hasPassword && !currentPassword) {
      toast.error("Current password is required");
      return;
    }

    setPasswordSaving(true);
    try {
      const res = await fetch("/api/account/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Unable to update password");
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setHasPassword(true);
      toast.success("Password updated");
    } catch (error: unknown) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Unable to update password"
      );
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleDelete = async () => {
    if (deleteConfirm.trim().toUpperCase() !== "DELETE") {
      toast.error('Type "DELETE" to confirm.');
      return;
    }

    setDeleteLoading(true);
    try {
      const res = await fetch("/api/account", { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete account");
      }
      toast.success("Account deleted");
      await signOut({ callbackUrl: "/login" });
    } catch (error: unknown) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete account"
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <PageLoader
        title="Loading account"
        message="Fetching your account settings. This will only take a moment."
      />
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{
        background: isDark
          ? `linear-gradient(to bottom, ${theme.workspace}, ${theme.surface})`
          : "linear-gradient(to bottom, #f8fafc, #ffffff, #f1f5f9)",
        color: theme.textPrimary,
      }}
    >
      <PageHeader pageName="Account" showDashboard={false} />
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-10 py-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1
              style={{ color: theme.textPrimary }}
              className="text-xl font-semibold"
            >
              Account settings
            </h1>
            <p style={{ color: theme.textSecondary }} className="text-sm">
              Update your sign-in details, billing, and security.
            </p>
          </div>
          <div
            style={{ color: theme.textSecondary }}
            className="hidden sm:flex items-center gap-2 text-sm"
          >
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            Secure area
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div
              style={{
                borderColor: theme.border,
                backgroundColor: theme.card,
              }}
              className="rounded-2xl border p-6 shadow-sm"
            >
              <div className="flex items-center gap-2">
                <UserIcon
                  style={{ color: theme.textSecondary }}
                  className="h-5 w-5"
                />
                <div>
                  <h2
                    style={{ color: theme.textPrimary }}
                    className="text-lg font-semibold"
                  >
                    Profile
                  </h2>
                  <p style={{ color: theme.textSecondary }} className="text-sm">
                    Update your email and display name.
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-2">
                  <span
                    style={{ color: theme.textPrimary }}
                    className="text-sm font-medium"
                  >
                    Email
                  </span>
                  <div className="relative">
                    <Mail
                      style={{ color: theme.textMuted }}
                      className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                    />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      style={{
                        borderColor: theme.border,
                        backgroundColor: theme.surface,
                        color: theme.textPrimary,
                      }}
                      className="w-full rounded-lg border px-10 py-2 text-sm outline-none ring-2 ring-transparent transition focus:ring-2"
                    />
                  </div>
                </label>

                <label className="flex flex-col gap-2">
                  <span
                    style={{ color: theme.textPrimary }}
                    className="text-sm font-medium"
                  >
                    Username
                  </span>
                  <div className="relative">
                    <UserIcon
                      style={{ color: theme.textMuted }}
                      className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                    />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      style={{
                        borderColor: theme.border,
                        backgroundColor: theme.surface,
                        color: theme.textPrimary,
                      }}
                      className="w-full rounded-lg border px-10 py-2 text-sm outline-none ring-2 ring-transparent transition focus:ring-2"
                    />
                  </div>
                </label>
              </div>

              <div className="mt-6 flex items-center gap-3">
                <button
                  onClick={handleProfileSave}
                  disabled={profileSaving}
                  style={{
                    backgroundColor: profileSaving
                      ? theme.buttonActive
                      : theme.button,
                    color: theme.buttonText,
                  }}
                  className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {profileSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save changes"
                  )}
                </button>
                <p style={{ color: theme.textMuted }} className="text-xs">
                  These details are used for sign-in and receipts.
                </p>
              </div>
            </div>

            <div
              style={{
                borderColor: theme.border,
                backgroundColor: theme.card,
              }}
              className="rounded-2xl border p-6 shadow-sm"
            >
              <div className="flex items-center gap-2">
                <Lock
                  style={{ color: theme.textSecondary }}
                  className="h-5 w-5"
                />
                <div>
                  <h2
                    style={{ color: theme.textPrimary }}
                    className="text-lg font-semibold"
                  >
                    Password
                  </h2>
                  <p style={{ color: theme.textSecondary }} className="text-sm">
                    {hasPassword
                      ? "Change your password to keep your account secure."
                      : "Set a password so you can also sign in with email."}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {hasPassword && (
                  <label className="flex flex-col gap-2">
                    <span
                      style={{ color: theme.textPrimary }}
                      className="text-sm font-medium"
                    >
                      Current password
                    </span>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      style={{
                        borderColor: theme.border,
                        backgroundColor: theme.surface,
                        color: theme.textPrimary,
                      }}
                      className="w-full rounded-lg border px-4 py-2 text-sm outline-none ring-2 ring-transparent transition focus:ring-2"
                      placeholder="••••••••"
                    />
                  </label>
                )}

                <label className="flex flex-col gap-2">
                  <span
                    style={{ color: theme.textPrimary }}
                    className="text-sm font-medium"
                  >
                    New password
                  </span>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    style={{
                      borderColor: theme.border,
                      backgroundColor: theme.surface,
                      color: theme.textPrimary,
                    }}
                    className="w-full rounded-lg border px-4 py-2 text-sm outline-none ring-2 ring-transparent transition focus:ring-2"
                    placeholder="At least 8 characters"
                  />
                </label>

                <label className="flex flex-col gap-2">
                  <span
                    style={{ color: theme.textPrimary }}
                    className="text-sm font-medium"
                  >
                    Confirm new password
                  </span>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    style={{
                      borderColor: theme.border,
                      backgroundColor: theme.surface,
                      color: theme.textPrimary,
                    }}
                    className="w-full rounded-lg border px-4 py-2 text-sm outline-none ring-2 ring-transparent transition focus:ring-2"
                    placeholder="Re-enter password"
                  />
                </label>
              </div>

              <div className="mt-6 flex items-center gap-3">
                <button
                  onClick={handlePasswordSave}
                  disabled={passwordSaving}
                  style={{
                    backgroundColor: passwordSaving
                      ? theme.buttonActive
                      : theme.button,
                    color: theme.buttonText,
                  }}
                  className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {passwordSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update password"
                  )}
                </button>
                <p style={{ color: theme.textMuted }} className="text-xs">
                  {hasPassword
                    ? "Use a unique password you don't reuse elsewhere."
                    : "Optional, but recommended for email sign-in."}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div
              style={{
                borderColor: theme.border,
                backgroundColor: theme.card,
              }}
              className="rounded-2xl border p-6 shadow-sm"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-500" />
                <div>
                  <h3
                    style={{ color: theme.textPrimary }}
                    className="text-base font-semibold"
                  >
                    Account overview
                  </h3>
                  <p style={{ color: theme.textSecondary }} className="text-sm">
                    Your sign-in details at a glance.
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-3 text-sm">
                <div
                  style={{ backgroundColor: theme.surface }}
                  className="flex items-center justify-between rounded-lg px-3 py-2"
                >
                  <span style={{ color: theme.textSecondary }}>Email</span>
                  <span
                    style={{ color: theme.textPrimary }}
                    className="font-medium"
                  >
                    {email}
                  </span>
                </div>
                <div
                  style={{ backgroundColor: theme.surface }}
                  className="flex items-center justify-between rounded-lg px-3 py-2"
                >
                  <span style={{ color: theme.textSecondary }}>Username</span>
                  <span
                    style={{ color: theme.textPrimary }}
                    className="font-medium"
                  >
                    {name || "Not set"}
                  </span>
                </div>
                <div
                  style={{ backgroundColor: theme.surface }}
                  className="flex items-center justify-between rounded-lg px-3 py-2"
                >
                  <span style={{ color: theme.textSecondary }}>Created</span>
                  <span
                    style={{ color: theme.textPrimary }}
                    className="font-medium"
                  >
                    {formattedCreatedAt || "—"}
                  </span>
                </div>
                <div
                  style={{ backgroundColor: theme.surface }}
                  className="flex items-center justify-between rounded-lg px-3 py-2"
                >
                  <span style={{ color: theme.textSecondary }}>Password</span>
                  <span
                    style={{ color: theme.textPrimary }}
                    className="font-medium"
                  >
                    {hasPassword ? "Set" : "Not set"}
                  </span>
                </div>
              </div>
            </div>

            <div
              style={{
                borderColor: theme.border,
                backgroundColor: theme.card,
              }}
              className="rounded-2xl border p-6 shadow-sm"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-sky-500" />
                <div>
                  <h3
                    style={{ color: theme.textPrimary }}
                    className="text-base font-semibold"
                  >
                    Subscriptions
                  </h3>
                  <p style={{ color: theme.textSecondary }} className="text-sm">
                    Flexible plans to fit your practice. Coming soon.
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-3 text-sm">
                <div
                  style={{
                    borderColor: theme.border,
                    backgroundColor: theme.surface,
                    color: theme.textSecondary,
                  }}
                  className="rounded-lg border border-dashed px-3 py-2"
                >
                  Personalized tiers, team seats, and usage controls are on the
                  way.
                </div>
                <button
                  disabled
                  style={{
                    backgroundColor: theme.buttonActive,
                    color: theme.textMuted,
                  }}
                  className="w-full cursor-not-allowed rounded-lg px-4 py-2 text-sm font-medium"
                >
                  Subscriptions coming soon
                </button>
              </div>
            </div>

            <div
              style={{
                borderColor: theme.border,
                backgroundColor: theme.card,
              }}
              className="rounded-2xl border p-6 shadow-sm"
            >
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-indigo-500" />
                <div>
                  <h3
                    style={{ color: theme.textPrimary }}
                    className="text-base font-semibold"
                  >
                    Payment methods
                  </h3>
                  <p style={{ color: theme.textSecondary }} className="text-sm">
                    Save cards for one-click checkout. Coming soon.
                  </p>
                </div>
              </div>

              <div
                style={{
                  borderColor: theme.border,
                  backgroundColor: theme.surface,
                  color: theme.textSecondary,
                }}
                className="mt-4 flex items-center gap-3 rounded-lg border border-dashed px-3 py-2 text-sm"
              >
                <WalletCards className="h-4 w-4 text-indigo-500" />
                <span>
                  We&apos;ll add cards, receipts, and billing contacts here.
                </span>
              </div>
              <button
                disabled
                style={{
                  backgroundColor: theme.buttonActive,
                  color: theme.textMuted,
                }}
                className="mt-3 w-full cursor-not-allowed rounded-lg px-4 py-2 text-sm font-medium"
              >
                Payment options coming soon
              </button>
            </div>
          </div>
        </div>

        <div
          style={{
            borderColor: isDark ? "rgba(239, 68, 68, 0.3)" : "#fecaca",
            backgroundColor: isDark ? "rgba(127, 29, 29, 0.2)" : "#fef2f2",
          }}
          className="rounded-2xl border p-6 shadow-sm"
        >
          <div className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-red-500" />
            <div>
              <h3 className="text-base font-semibold text-red-700 dark:text-red-400">
                Delete account
              </h3>
              <p className="text-sm text-red-600 dark:text-red-300">
                Permanently remove your account and all associated data.
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-[2fr,1fr]">
            <input
              type="text"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder='Type "DELETE" to confirm'
              style={{
                borderColor: isDark ? "rgba(239, 68, 68, 0.3)" : "#fecaca",
                backgroundColor: theme.surface,
                color: theme.textPrimary,
              }}
              className="rounded-lg border px-4 py-2 text-sm outline-none ring-2 ring-transparent transition focus:ring-2"
            />
            <button
              onClick={handleDelete}
              disabled={deleteLoading}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
            >
              {deleteLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete my account"
              )}
            </button>
          </div>
          <p className="mt-2 text-xs text-red-600 dark:text-red-400">
            This action cannot be undone and will log you out immediately.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AccountPageClient;
