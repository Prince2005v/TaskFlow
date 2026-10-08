"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import {
  User as UserIcon,
  BellRing,
  Shield,
  LogOut,
  Mail,
  CheckCircle2,
  Server,
  Key,
  Info,
  Building,
  CreditCard,
  Sparkles,
  Save,
  Loader2,
} from "lucide-react";
import { SafeUser, SafeWorkspace } from "@/types/task";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { toast } from "sonner";

interface SettingsViewProps {
  currentUser: SafeUser;
  workspace: SafeWorkspace;
  onWorkspaceUpdated?: (newWorkspace: SafeWorkspace) => void;
}

export function SettingsView({
  currentUser,
  workspace,
  onWorkspaceUpdated,
}: SettingsViewProps) {
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "workspace" | "notifications" | "security">(
    "profile"
  );

  const [workspaceName, setWorkspaceName] = useState(workspace.name);
  const [isSavingWorkspace, setIsSavingWorkspace] = useState(false);

  const isOwnerOrAdmin = workspace.role === "OWNER" || workspace.role === "ADMIN";

  const handleSaveWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwnerOrAdmin || !workspaceName.trim()) return;

    setIsSavingWorkspace(true);
    try {
      const res = await fetch("/api/workspace", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: workspaceName.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update workspace");

      toast.success("Workspace name updated");
      if (onWorkspaceUpdated) {
        onWorkspaceUpdated({
          ...workspace,
          name: workspaceName.trim(),
        });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Update failed";
      toast.error(message);
    } finally {
      setIsSavingWorkspace(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Settings Header */}
      <div className="pb-4 border-b border-zinc-800/60">
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Workspace Settings
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-zinc-400">
          Configure personal details, company workspace preferences, and billing.
        </p>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-zinc-800/80 pb-px text-xs font-medium overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab("profile")}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "profile"
              ? "border-blue-500 text-white font-semibold"
              : "border-transparent text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <UserIcon className="h-4 w-4" />
          <span>Profile</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("workspace")}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "workspace"
              ? "border-blue-500 text-white font-semibold"
              : "border-transparent text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Building className="h-4 w-4" />
          <span>Workspace &amp; Plan</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("notifications")}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "notifications"
              ? "border-blue-500 text-white font-semibold"
              : "border-transparent text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <BellRing className="h-4 w-4" />
          <span>Notifications</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("security")}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "security"
              ? "border-blue-500 text-white font-semibold"
              : "border-transparent text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Shield className="h-4 w-4" />
          <span>Security &amp; Session</span>
        </button>
      </div>

      {/* Tab 1: Profile */}
      {activeTab === "profile" && (
        <div className="space-y-6 max-w-2xl animate-in fade-in-0 duration-150">
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-white mb-4">
              Profile Information
            </h3>

            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-zinc-800">
              {currentUser.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={currentUser.image}
                  alt={currentUser.name || "User"}
                  className="h-16 w-16 rounded-full object-cover border-2 border-zinc-700 ring-4 ring-blue-500/20"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-800 text-base font-bold text-zinc-300 border border-zinc-700">
                  {(currentUser.name || currentUser.email).slice(0, 2).toUpperCase()}
                </div>
              )}
              <div>
                <h4 className="text-base font-semibold text-white">
                  {currentUser.name || "Unnamed User"}
                </h4>
                <p className="text-xs text-zinc-400">{currentUser.email}</p>
                <span className="mt-1.5 inline-flex items-center gap-1 rounded bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-blue-400 border border-blue-500/20">
                  <Shield className="h-3 w-3" />
                  <span>Google Identity Verified</span>
                </span>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-400 font-medium mb-1">Full Name</label>
                <input
                  type="text"
                  value={currentUser.name || ""}
                  disabled
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950/70 px-3.5 py-2.5 text-zinc-300 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-medium mb-1">Email Address</label>
                <input
                  type="email"
                  value={currentUser.email}
                  disabled
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950/70 px-3.5 py-2.5 text-zinc-300 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-medium mb-1">Account ID</label>
                <input
                  type="text"
                  value={currentUser.id}
                  disabled
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950/70 px-3.5 py-2.5 font-mono text-[11px] text-zinc-400 cursor-not-allowed"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Workspace & Plan */}
      {activeTab === "workspace" && (
        <div className="space-y-6 max-w-2xl animate-in fade-in-0 duration-150">
          {/* Workspace Details Form */}
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-white mb-2">
              Workspace Profile
            </h3>
            <p className="text-xs text-zinc-400 mb-6">
              Manage your company or team workspace name and access identifier.
            </p>

            <form onSubmit={handleSaveWorkspace} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-300 font-medium mb-1">
                  Workspace Name
                </label>
                <input
                  type="text"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  disabled={!isOwnerOrAdmin}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-xs text-white outline-none focus:border-zinc-700 focus:ring-2 focus:ring-blue-500/40 disabled:opacity-50"
                  required
                />
                {!isOwnerOrAdmin && (
                  <p className="mt-1 text-[11px] text-zinc-500">
                    Only workspace owners and administrators can rename the workspace.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-zinc-300 font-medium mb-1">
                  Workspace URL Slug
                </label>
                <input
                  type="text"
                  value={workspace.slug}
                  disabled
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950/70 px-3.5 py-2.5 font-mono text-[11px] text-zinc-400 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-medium mb-1">
                  Your Workspace Role
                </label>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-400">
                  <Shield className="h-3.5 w-3.5" />
                  <span>{workspace.role}</span>
                </span>
              </div>

              {isOwnerOrAdmin && (
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSavingWorkspace || !workspaceName.trim()}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {isSavingWorkspace ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Save className="h-3.5 w-3.5" />
                    )}
                    <span>Save Workspace</span>
                  </button>
                </div>
              )}
            </form>
          </div>

          {/* Billing-Ready Plan Architecture */}
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-white">Subscription Tier</h3>
              </div>
              <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400">
                Current: {workspace.plan}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mb-6">
              TaskFlow includes full task tracking, email alerts, and team workload analytics on all plans.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="rounded-xl border border-emerald-500/40 bg-zinc-950/70 p-4 relative">
                <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                  Active Plan
                </span>
                <h4 className="text-sm font-bold text-white mt-1">Starter Free</h4>
                <p className="text-xl font-extrabold text-white mt-1">$0</p>
                <p className="text-[11px] text-zinc-400 mt-2">
                  Includes tasks, members, Gmail alerts, and activity logs.
                </p>
              </div>

              <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
                <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                  Available
                </span>
                <h4 className="text-sm font-bold text-white mt-1">Pro Team</h4>
                <p className="text-xl font-extrabold text-white mt-1">$12<span className="text-xs text-zinc-500 font-normal">/mo</span></p>
                <p className="text-[11px] text-zinc-400 mt-2">
                  Unlimited members, priority support, and custom webhooks.
                </p>
              </div>

              <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
                <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                  Enterprise
                </span>
                <h4 className="text-sm font-bold text-white mt-1">Business</h4>
                <p className="text-xl font-extrabold text-white mt-1">$29<span className="text-xs text-zinc-500 font-normal">/mo</span></p>
                <p className="text-[11px] text-zinc-400 mt-2">
                  Custom SAML SSO, dedicated account manager, audit exports.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Notifications */}
      {activeTab === "notifications" && (
        <div className="space-y-6 max-w-2xl animate-in fade-in-0 duration-150">
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Mail className="h-4 w-4 text-blue-400" />
              <h3 className="text-sm font-semibold text-white">
                Email &amp; In-App Alerts
              </h3>
            </div>
            <p className="text-xs text-zinc-400 mb-6">
              Transactional Gmail SMTP notifications keep your team aligned across events.
            </p>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-zinc-800 bg-zinc-950/60 text-xs">
                <div>
                  <span className="font-semibold text-white block">Task Assignment</span>
                  <span className="text-zinc-400 text-[11px]">
                    Dispatches email and in-app alert when a task is assigned or reassigned.
                  </span>
                </div>
                <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
                  Active
                </span>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl border border-zinc-800 bg-zinc-950/60 text-xs">
                <div>
                  <span className="font-semibold text-white block">Task Completion</span>
                  <span className="text-zinc-400 text-[11px]">
                    Dispatches email and in-app confirmation to the creator upon completion.
                  </span>
                </div>
                <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
                  Active
                </span>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl border border-zinc-800 bg-zinc-950/60 text-xs">
                <div>
                  <span className="font-semibold text-white block">Comment Discussions</span>
                  <span className="text-zinc-400 text-[11px]">
                    Alerts task participants when teammates post comments.
                  </span>
                </div>
                <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
                  Active
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Security & Session */}
      {activeTab === "security" && (
        <div className="space-y-6 max-w-2xl animate-in fade-in-0 duration-150">
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-white mb-2">
              Authentication Credentials
            </h3>
            <p className="text-xs text-zinc-400 mb-6">
              Review session security and workspace isolation tokens.
            </p>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl border border-zinc-800 bg-zinc-950/60">
                <div className="flex items-center gap-2.5">
                  <Server className="h-4 w-4 text-zinc-400" />
                  <div>
                    <span className="font-semibold text-white block">Database Connection</span>
                    <span className="text-zinc-500 text-[11px]">PostgreSQL with Prisma ORM</span>
                  </div>
                </div>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Connected</span>
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl border border-zinc-800 bg-zinc-950/60">
                <div className="flex items-center gap-2.5">
                  <Key className="h-4 w-4 text-zinc-400" />
                  <div>
                    <span className="font-semibold text-white block">Identity Provider</span>
                    <span className="text-zinc-500 text-[11px]">Google Cloud Platform 2.0 (NextAuth v4)</span>
                  </div>
                </div>
                <span className="text-blue-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Protected</span>
                </span>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-zinc-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-white block">Sign Out</span>
                <span className="text-zinc-400 text-[11px]">
                  End your current workspace session on this browser
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowSignOutConfirm(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/20 transition-colors cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sign Out Confirmation Modal */}
      <ConfirmationDialog
        isOpen={showSignOutConfirm}
        title="Sign Out of TaskFlow"
        description="Are you sure you want to sign out? You will be redirected to the login screen."
        confirmLabel="Sign Out"
        cancelLabel="Stay Logged In"
        onConfirm={() => signOut({ callbackUrl: "/login" })}
        onCancel={() => setShowSignOutConfirm(false)}
      />
    </div>
  );
}
