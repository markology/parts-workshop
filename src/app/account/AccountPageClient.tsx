"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import toast from "react-hot-toast";
import {
  ArrowLeft,
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
  }, [status]);

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
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Unable to update profile");
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
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Unable to update password");
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
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to delete account");
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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 text-slate-900">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm transition hover:-translate-y-px hover:shadow"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
            <div>
              <h1 className="text-xl font-semibold text-slate-900">
                Account settings
              </h1>
              <p className="text-sm text-slate-500">
                Update your sign-in details, billing, and security.
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-sm text-slate-500">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            Secure area
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm">
              <div className="flex items-center gap-2">
                <UserIcon className="h-5 w-5 text-slate-500" />
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Profile
                  </h2>
                  <p className="text-sm text-slate-500">
                    Update your email and display name.
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-slate-700">
                    Email
                  </span>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-10 py-2 text-sm text-slate-800 outline-none ring-2 ring-transparent transition focus:border-slate-300 focus:ring-sky-100"
                      placeholder="you@example.com"
                    />
                  </div>
                </label>

                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-slate-700">
                    Username
                  </span>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-10 py-2 text-sm text-slate-800 outline-none ring-2 ring-transparent transition focus:border-slate-300 focus:ring-sky-100"
                      placeholder="Your display name"
                    />
                  </div>
                </label>
              </div>

              <div className="mt-6 flex items-center gap-3">
                <button
                  onClick={handleProfileSave}
                  disabled={profileSaving}
                  className="inline-flex items-center gap-2 rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-600 disabled:cursor-not-allowed disabled:bg-slate-400"
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
                <p className="text-xs text-slate-500">
                  These details are used for sign-in and receipts.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm">
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-slate-500" />
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Password
                  </h2>
                  <p className="text-sm text-slate-500">
                    {hasPassword
                      ? "Change your password to keep your account secure."
                      : "Set a password so you can also sign in with email."}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {hasPassword && (
                  <label className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-slate-700">
                      Current password
                    </span>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-800 outline-none ring-2 ring-transparent transition focus:border-slate-300 focus:ring-sky-100"
                      placeholder="••••••••"
                    />
                  </label>
                )}

                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-slate-700">
                    New password
                  </span>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-800 outline-none ring-2 ring-transparent transition focus:border-slate-300 focus:ring-sky-100"
                    placeholder="At least 8 characters"
                  />
                </label>

                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-slate-700">
                    Confirm new password
                  </span>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-800 outline-none ring-2 ring-transparent transition focus:border-slate-300 focus:ring-sky-100"
                    placeholder="Re-enter password"
                  />
                </label>
              </div>

              <div className="mt-6 flex items-center gap-3">
                <button
                  onClick={handlePasswordSave}
                  disabled={passwordSaving}
                  className="inline-flex items-center gap-2 rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-600 disabled:cursor-not-allowed disabled:bg-slate-400"
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
                <p className="text-xs text-slate-500">
                  {hasPassword
                    ? "Use a unique password you don't reuse elsewhere."
                    : "Optional, but recommended for email sign-in."}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-500" />
                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    Account overview
                  </h3>
                  <p className="text-sm text-slate-500">
                    Your sign-in details at a glance.
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                  <span className="text-slate-600">Email</span>
                  <span className="font-medium text-slate-900">{email}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                  <span className="text-slate-600">Username</span>
                  <span className="font-medium text-slate-900">
                    {name || "Not set"}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                  <span className="text-slate-600">Created</span>
                  <span className="font-medium text-slate-900">
                    {formattedCreatedAt || "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                  <span className="text-slate-600">Password</span>
                  <span className="font-medium text-slate-900">
                    {hasPassword ? "Set" : "Not set"}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-sky-500" />
                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    Subscriptions
                  </h3>
                  <p className="text-sm text-slate-500">
                    Flexible plans to fit your practice. Coming soon.
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/80 px-3 py-2">
                  Personalized tiers, team seats, and usage controls are on the
                  way.
                </div>
                <button
                  disabled
                  className="w-full cursor-not-allowed rounded-lg bg-slate-200 px-4 py-2 text-sm font-medium text-slate-600"
                >
                  Subscriptions coming soon
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-indigo-500" />
                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    Payment methods
                  </h3>
                  <p className="text-sm text-slate-500">
                    Save cards for one-click checkout. Coming soon.
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-3 rounded-lg border border-dashed border-slate-200 bg-slate-50/80 px-3 py-2 text-sm text-slate-600">
                <WalletCards className="h-4 w-4 text-indigo-500" />
                <span>We'll add cards, receipts, and billing contacts here.</span>
              </div>
              <button
                disabled
                className="mt-3 w-full cursor-not-allowed rounded-lg bg-slate-200 px-4 py-2 text-sm font-medium text-slate-600"
              >
                Payment options coming soon
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-red-500" />
            <div>
              <h3 className="text-base font-semibold text-red-700">
                Delete account
              </h3>
              <p className="text-sm text-red-600">
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
              className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm text-red-700 outline-none ring-2 ring-transparent transition focus:border-red-300 focus:ring-red-100"
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
          <p className="mt-2 text-xs text-red-600">
            This action cannot be undone and will log you out immediately.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AccountPageClient;

