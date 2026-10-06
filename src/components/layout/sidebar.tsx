"use client";

import {
  CheckSquare,
  LayoutDashboard,
  ListTodo,
  UserCheck,
  CheckCircle2,
  Users,
  Settings,
  X,
  LogOut,
  FolderPlus,
} from "lucide-react";
import { SafeUser } from "@/types/task";
import { signOut } from "next-auth/react";

export type WorkspaceView =
  | "dashboard"
  | "tasks"
  | "assigned"
  | "created"
  | "completed"
  | "team"
  | "settings";

interface SidebarProps {
  activeView: WorkspaceView;
  onSelectView: (view: WorkspaceView) => void;
  currentUser: SafeUser;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  taskCounts: {
    all: number;
    assigned: number;
    created: number;
    completed: number;
  };
}

export function Sidebar({
  activeView,
  onSelectView,
  currentUser,
  isOpenMobile,
  onCloseMobile,
  taskCounts,
}: SidebarProps) {
  const handleNavClick = (view: WorkspaceView) => {
    onSelectView(view);
    onCloseMobile();
  };

  const navItems = [
    {
      id: "dashboard" as WorkspaceView,
      label: "Dashboard",
      icon: LayoutDashboard,
      count: null,
    },
    {
      id: "tasks" as WorkspaceView,
      label: "All Tasks",
      icon: ListTodo,
      count: taskCounts.all,
    },
    {
      id: "assigned" as WorkspaceView,
      label: "Assigned to Me",
      icon: UserCheck,
      count: taskCounts.assigned,
    },
    {
      id: "created" as WorkspaceView,
      label: "Created by Me",
      icon: FolderPlus,
      count: taskCounts.created,
    },
    {
      id: "completed" as WorkspaceView,
      label: "Completed",
      icon: CheckCircle2,
      count: taskCounts.completed,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-xs md:hidden animate-in fade-in-0 duration-150"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-64 flex-col border-r border-zinc-800 bg-zinc-950 px-4 py-5 transition-transform duration-200 ease-in-out md:static md:translate-x-0 ${
          isOpenMobile ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between px-2 pb-5 border-b border-zinc-800/80">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 shadow-inner">
              <CheckSquare className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-white block leading-tight">
                TaskFlow
              </span>
              <span className="text-[10px] text-zinc-500 font-medium tracking-wide uppercase">
                B2B Workspace
              </span>
            </div>
          </div>

          {/* Close mobile button */}
          <button
            type="button"
            onClick={onCloseMobile}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:text-white md:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Workspace Team Tag */}
        <div className="mt-4 px-2 py-2 rounded-xl bg-zinc-900/60 border border-zinc-800/60 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-emerald-500/20" />
            <span className="font-medium text-zinc-300">Engineering Team</span>
          </div>
          <span className="text-[10px] text-zinc-500">Cloud</span>
        </div>

        {/* Navigation Sections */}
        <div className="mt-6 flex-1 space-y-6 overflow-y-auto pr-1">
          {/* Main Navigation */}
          <div>
            <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              Navigation
            </span>
            <nav className="mt-2 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeView === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavClick(item.id)}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-colors cursor-pointer ${
                      isActive
                        ? "bg-blue-600/10 text-blue-400 border border-blue-500/20 font-semibold"
                        : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`h-4 w-4 ${isActive ? "text-blue-400" : "text-zinc-500"}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.count !== null && (
                      <span
                        className={`rounded-full px-2 py-0.2 text-[10px] font-semibold ${
                          isActive
                            ? "bg-blue-500/20 text-blue-300"
                            : "bg-zinc-900 text-zinc-500"
                        }`}
                      >
                        {item.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Workspace Section */}
          <div>
            <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              Workspace
            </span>
            <nav className="mt-2 space-y-1">
              <button
                type="button"
                onClick={() => handleNavClick("team")}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-colors cursor-pointer ${
                  activeView === "team"
                    ? "bg-blue-600/10 text-blue-400 border border-blue-500/20 font-semibold"
                    : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Users className={`h-4 w-4 ${activeView === "team" ? "text-blue-400" : "text-zinc-500"}`} />
                  <span>Team &amp; Members</span>
                </div>
              </button>
            </nav>
          </div>

          {/* Settings Section */}
          <div>
            <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              Preferences
            </span>
            <nav className="mt-2 space-y-1">
              <button
                type="button"
                onClick={() => handleNavClick("settings")}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-colors cursor-pointer ${
                  activeView === "settings"
                    ? "bg-blue-600/10 text-blue-400 border border-blue-500/20 font-semibold"
                    : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Settings className={`h-4 w-4 ${activeView === "settings" ? "text-blue-400" : "text-zinc-500"}`} />
                  <span>Settings</span>
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* User Profile Card at Bottom */}
        <div className="mt-auto pt-4 border-t border-zinc-800/80">
          <div className="flex items-center justify-between rounded-xl p-2 bg-zinc-900/60 border border-zinc-800/60">
            <div className="flex items-center gap-2.5 truncate mr-2">
              {currentUser.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={currentUser.image}
                  alt={currentUser.name || "User"}
                  className="h-8 w-8 rounded-full object-cover border border-zinc-700 ring-2 ring-blue-500/20 shrink-0"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-xs font-semibold text-zinc-300 border border-zinc-700 shrink-0">
                  {(currentUser.name || currentUser.email).slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="truncate">
                <span className="text-xs font-semibold text-white block truncate leading-tight">
                  {currentUser.name || "Workspace User"}
                </span>
                <span className="text-[10px] text-zinc-400 block truncate leading-tight mt-0.5">
                  {currentUser.email}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
