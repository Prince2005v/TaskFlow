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
} from "lucide-react";
import { SafeUser } from "@/types/task";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

interface SettingsViewProps {
  currentUser: SafeUser;
}

export function SettingsView({ currentUser }: SettingsViewProps) {
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "notifications" | "account">("profile");

  return (
    <div className="space-y-6">
      {/* Settings Header */}
      <div className="pb-4 border-b border-zinc-800/60">
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Workspace Settings
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-zinc-400">
          Manage your personal profile, notification preferences, and workspace session.
        </p>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-zinc-800/80 pb-px text-xs font-medium">
        <button
          type="button"
          onClick={() => setActiveTab("profile")}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition-all cursor-pointer ${
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
          onClick={() => setActiveTab("notifications")}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition-all cursor-pointer ${
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
          onClick={() => setActiveTab("account")}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition-all cursor-pointer ${
            activeTab === "account"
              ? "border-blue-500 text-white font-semibold"
              : "border-transparent text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Shield className="h-4 w-4" />
          <span>Account &amp; Security</span>
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
                <p className="mt-1 text-[11px] text-zinc-500">
                  Synchronized from your Google Cloud identity account.
                </p>
              </div>

              <div>
                <label className="block text-zinc-400 font-medium mb-1">Email Address</label>
                <input
                  type="email"
                  value={currentUser.email}
                  disabled
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950/70 px-3.5 py-2.5 text-zinc-300 cursor-not-allowed"
                />
                <p className="mt-1 text-[11px] text-zinc-500">
                  Primary notification and authentication address.
                </p>
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

      {/* Tab 2: Notifications */}
      {activeTab === "notifications" && (
        <div className="space-y-6 max-w-2xl animate-in fade-in-0 duration-150">
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Mail className="h-4 w-4 text-blue-400" />
              <h3 className="text-sm font-semibold text-white">
                Email Notification Services
              </h3>
            </div>
            <p className="text-xs text-zinc-400 mb-6">
              TaskFlow dispatches automated transactional emails via Gmail SMTP to keep your team aligned.
            </p>

            <div className="space-y-4">
              {/* Notification Item 1 */}
              <div className="flex items-start justify-between gap-4 rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-white">
                      Task Assignment Notifications
                    </span>
                    <span className="rounded bg-emerald-500/10 px-2 py-0.2 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
                      Active
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    When a teammate creates or assigns a task to you, an email is automatically dispatched with the title, priority, description, and due date.
                  </p>
                </div>
              </div>

              {/* Notification Item 2 */}
              <div className="flex items-start justify-between gap-4 rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-white">
                      Task Completion Notifications
                    </span>
                    <span className="rounded bg-emerald-500/10 px-2 py-0.2 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
                      Active
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    When any task you created is marked as Completed, you receive an automated confirmation email with completion timestamp.
                  </p>
                </div>
              </div>

              {/* Service Health Banner */}
              <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-4 flex items-start gap-3">
                <Info className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                <div className="text-xs text-zinc-300 leading-relaxed">
                  <p className="font-semibold text-blue-300">
                    Nodemailer Gmail SMTP Integration
                  </p>
                  <p className="mt-1 text-zinc-400">
                    Email notifications run asynchronously server-side. In case of temporary mail server connectivity issues, task state changes always persist safely without data loss.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Account & Security */}
      {activeTab === "account" && (
        <div className="space-y-6 max-w-2xl animate-in fade-in-0 duration-150">
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-white mb-2">
              Workspace &amp; Authentication
            </h3>
            <p className="text-xs text-zinc-400 mb-6">
              Review current authorization credentials and session status.
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
                    <span className="font-semibold text-white block">OAuth Provider</span>
                    <span className="text-zinc-500 text-[11px]">Google Cloud Platform 2.0</span>
                  </div>
                </div>
                <span className="text-blue-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>NextAuth v4</span>
                </span>
              </div>
            </div>

            {/* Sign Out Card */}
            <div className="mt-8 pt-6 border-t border-zinc-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-white block">Sign Out</span>
                <span className="text-zinc-400 text-[11px]">
                  End your current session on this device
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
