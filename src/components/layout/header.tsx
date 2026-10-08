"use client";

import { Menu, Plus, RefreshCw, Search } from "lucide-react";
import { WorkspaceView } from "./sidebar";
import { LogoutButton } from "@/app/dashboard/logout-button";
import { NotificationCenter } from "@/components/notifications/notification-center";
import { InAppNotification } from "@/types/task";

interface HeaderProps {
  activeView: WorkspaceView;
  onOpenMobileMenu: () => void;
  onCreateTaskClick: () => void;
  onRefreshClick: () => void;
  isRefreshing: boolean;
  onOpenCommandPalette?: () => void;
  initialNotifications?: InAppNotification[];
  onNotificationTaskSelect?: (taskId: string) => void;
}

export function Header({
  activeView,
  onOpenMobileMenu,
  onCreateTaskClick,
  onRefreshClick,
  isRefreshing,
  onOpenCommandPalette,
  initialNotifications,
  onNotificationTaskSelect,
}: HeaderProps) {
  const getViewTitle = () => {
    switch (activeView) {
      case "dashboard":
        return "Dashboard";
      case "tasks":
        return "All Tasks";
      case "assigned":
        return "Assigned to Me";
      case "created":
        return "Created by Me";
      case "completed":
        return "Completed Tasks";
      case "team":
        return "Team & Members";
      case "settings":
        return "Settings";
      case "ai-planner":
        return "AI Planner";
      case "ai-insights":
        return "AI Insights";
      case "ai-report":
        return "AI Weekly Report";
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-zinc-800/80 bg-zinc-950/80 px-4 sm:px-6 backdrop-blur-md">
      {/* Left: Mobile hamburger + Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white md:hidden cursor-pointer"
          aria-label="Open sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-zinc-500 font-medium hidden sm:inline">Workspace</span>
          <span className="text-zinc-600 hidden sm:inline">/</span>
          <span className="font-semibold text-white text-sm sm:text-xs">
            {getViewTitle()}
          </span>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Search trigger button (⌘K) */}
        {onOpenCommandPalette && (
          <button
            type="button"
            onClick={onOpenCommandPalette}
            className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/80 px-2.5 py-1.5 text-xs text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors cursor-pointer"
            title="Open command palette (Cmd+K)"
          >
            <Search className="h-3.5 w-3.5 text-zinc-400" />
            <span className="hidden sm:inline">Search...</span>
            <kbd className="hidden sm:inline rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-mono text-zinc-400 border border-zinc-700">⌘K</kbd>
          </button>
        )}

        {/* In-app Notification Center Bell */}
        <NotificationCenter
          initialNotifications={initialNotifications || []}
          onNotificationClick={(link) => {
            if (link && onNotificationTaskSelect) {
              const match = link.match(/#task-([a-zA-Z0-9_-]+)/);
              if (match) {
                onNotificationTaskSelect(match[1]);
              }
            }
          }}
        />

        {/* Refresh button */}
        <button
          type="button"
          onClick={onRefreshClick}
          disabled={isRefreshing}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors cursor-pointer disabled:opacity-50"
          title="Refresh workspace tasks"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-blue-400" : ""}`} />
        </button>

        {/* Global Create Task button */}
        <button
          type="button"
          onClick={onCreateTaskClick}
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-blue-500 cursor-pointer active:scale-[0.98]"
        >
          <Plus className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Create Task</span>
          <span className="sm:hidden">New</span>
        </button>

        <div className="h-4 w-px bg-zinc-800 mx-1 hidden sm:block" />

        {/* User Mini Avatar & Logout */}
        <div className="hidden sm:flex items-center gap-3">
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
