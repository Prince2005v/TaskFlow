"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
  Search,
  Plus,
  LayoutDashboard,
  ListTodo,
  UserCheck,
  CheckCircle2,
  Users,
  Settings,
  LogOut,
  X,
  Command,
  ArrowRight,
  User as UserIcon,
  Clock,
} from "lucide-react";
import { TaskWithUsers, SafeUser } from "@/types/task";
import { WorkspaceView } from "@/components/layout/sidebar";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectView: (view: WorkspaceView) => void;
  onCreateTaskClick: () => void;
  onSelectTask: (task: TaskWithUsers) => void;
  tasks: TaskWithUsers[];
  users: SafeUser[];
  onSignOutClick: () => void;
}

export function CommandPalette({
  isOpen,
  onClose,
  onSelectView,
  onCreateTaskClick,
  onSelectTask,
  tasks,
  users,
  onSignOutClick,
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Trigger open handled by parent or shortcut
        }
      } else if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const filteredTasks = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return tasks
      .filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.description && t.description.toLowerCase().includes(q))
      )
      .slice(0, 5);
  }, [tasks, query]);

  const filteredUsers = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return users
      .filter(
        (u) =>
          (u.name && u.name.toLowerCase().includes(q)) ||
          u.email.toLowerCase().includes(q)
      )
      .slice(0, 4);
  }, [users, query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/70 backdrop-blur-xs animate-in fade-in-0 duration-150">
      <div
        className="relative w-full max-w-xl rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl animate-in zoom-in-95 duration-150 overflow-hidden flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        {/* Search Input Box */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-zinc-800 bg-zinc-950/60">
          <Search className="h-4 w-4 text-zinc-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command, search tasks, or find members..."
            className="w-full bg-transparent text-sm text-white placeholder-zinc-500 outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-mono text-zinc-400 border border-zinc-700">
            ESC
          </kbd>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-500 hover:text-white sm:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-3 text-xs">
          {/* Quick Actions (always shown if query is short or matches) */}
          <div>
            <span className="px-2.5 py-1 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block">
              Quick Actions
            </span>
            <div className="space-y-0.5 mt-1">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onCreateTaskClick();
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-zinc-300 hover:bg-blue-600/10 hover:text-blue-400 transition-colors text-left cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5 text-blue-400" />
                <span className="font-medium">Create new task</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onSelectView("dashboard");
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors text-left cursor-pointer"
              >
                <LayoutDashboard className="h-3.5 w-3.5 text-zinc-400" />
                <span>Go to Dashboard</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onSelectView("tasks");
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors text-left cursor-pointer"
              >
                <ListTodo className="h-3.5 w-3.5 text-zinc-400" />
                <span>Go to All Tasks</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onSelectView("assigned");
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors text-left cursor-pointer"
              >
                <UserCheck className="h-3.5 w-3.5 text-zinc-400" />
                <span>Go to Assigned Tasks</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onSelectView("team");
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors text-left cursor-pointer"
              >
                <Users className="h-3.5 w-3.5 text-zinc-400" />
                <span>Go to Team &amp; Workload</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onSelectView("settings");
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors text-left cursor-pointer"
              >
                <Settings className="h-3.5 w-3.5 text-zinc-400" />
                <span>Workspace Settings</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onSignOutClick();
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-rose-400 hover:bg-rose-500/10 transition-colors text-left cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sign Out of TaskFlow</span>
              </button>
            </div>
          </div>

          {/* Matching Tasks */}
          {filteredTasks.length > 0 && (
            <div>
              <span className="px-2.5 py-1 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block">
                Tasks ({filteredTasks.length})
              </span>
              <div className="space-y-0.5 mt-1">
                {filteredTasks.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      onClose();
                      onSelectTask(t);
                    }}
                    className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-zinc-200 hover:bg-zinc-800 transition-colors text-left cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 truncate mr-2">
                      <Clock className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                      <span className="font-medium truncate group-hover:text-blue-400">
                        {t.title}
                      </span>
                    </div>
                    <span className="text-[10px] text-zinc-500 capitalize shrink-0">
                      {t.status.replace("_", " ").toLowerCase()}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Matching Members */}
          {filteredUsers.length > 0 && (
            <div>
              <span className="px-2.5 py-1 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block">
                Team Members ({filteredUsers.length})
              </span>
              <div className="space-y-0.5 mt-1">
                {filteredUsers.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => {
                      onClose();
                      onSelectView("team");
                    }}
                    className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-zinc-200 hover:bg-zinc-800 transition-colors text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      {u.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={u.image}
                          alt={u.name || "Member"}
                          className="h-4 w-4 rounded-full object-cover"
                        />
                      ) : (
                        <UserIcon className="h-3.5 w-3.5 text-zinc-400" />
                      )}
                      <span className="font-medium text-white">{u.name || u.email}</span>
                      <span className="text-[11px] text-zinc-500">{u.email}</span>
                    </div>
                    <ArrowRight className="h-3 w-3 text-zinc-600" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer shortcuts hint */}
        <div className="flex items-center justify-between px-3.5 py-2 border-t border-zinc-800/80 bg-zinc-950/70 text-[10px] text-zinc-500">
          <div className="flex items-center gap-3">
            <span>Navigation: <kbd className="text-zinc-400">Cmd+K</kbd></span>
            <span>Close: <kbd className="text-zinc-400">ESC</kbd></span>
          </div>
          <span>TaskFlow Command Palette</span>
        </div>
      </div>
    </div>
  );
}
