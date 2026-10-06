"use client";

import { useState, useMemo } from "react";
import {
  Users,
  Search,
  CheckCircle2,
  Clock,
  UserCheck,
} from "lucide-react";
import { SafeUser, TaskWithUsers } from "@/types/task";
import { TaskStatus } from "@prisma/client";

interface TeamViewProps {
  users: SafeUser[];
  tasks: TaskWithUsers[];
  currentUserId: string;
}

export function TeamView({ users, tasks, currentUserId }: TeamViewProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Calculate workloads for each member
  const memberWorkloads = useMemo(() => {
    return users.map((user) => {
      const assigned = tasks.filter((t) => t.assignedToId === user.id);
      const activeTasks = assigned.filter((t) => t.status !== TaskStatus.COMPLETED);
      const completedTasks = assigned.filter((t) => t.status === TaskStatus.COMPLETED);
      const createdCount = tasks.filter((t) => t.createdById === user.id).length;

      const isCurrentUser = user.id === currentUserId;

      return {
        ...user,
        assignedCount: assigned.length,
        activeCount: activeTasks.length,
        completedCount: completedTasks.length,
        createdCount,
        role: isCurrentUser ? "Workspace Admin" : "Team Member",
        isCurrentUser,
      };
    });
  }, [users, tasks, currentUserId]);

  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return memberWorkloads;
    const q = searchQuery.toLowerCase();
    return memberWorkloads.filter(
      (m) =>
        (m.name && m.name.toLowerCase().includes(q)) ||
        m.email.toLowerCase().includes(q)
    );
  }, [memberWorkloads, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800/60">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-emerald-400 mb-1">
            <Users className="h-3.5 w-3.5" />
            <span>Workspace Directory</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Team &amp; Members
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-zinc-400">
            Understand teammate workloads, ownership distribution, and active deliverables.
          </p>
        </div>

        {/* Member Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900/80 pl-9 pr-3.5 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-zinc-700 focus:ring-2 focus:ring-emerald-500/30 transition-all"
          />
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Registered Members</span>
            <Users className="h-4 w-4 text-emerald-400" />
          </div>
          <span className="mt-2 block text-2xl font-bold text-white">
            {users.length}
          </span>
          <span className="text-[11px] text-zinc-500">Active team seats in workspace</span>
        </div>

        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Active Workloads</span>
            <Clock className="h-4 w-4 text-blue-400" />
          </div>
          <span className="mt-2 block text-2xl font-bold text-blue-400">
            {tasks.filter((t) => t.assignedToId && t.status !== TaskStatus.COMPLETED).length}
          </span>
          <span className="text-[11px] text-zinc-500">Tasks in active progress</span>
        </div>

        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Deliveries Completed</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <span className="mt-2 block text-2xl font-bold text-emerald-400">
            {tasks.filter((t) => t.status === TaskStatus.COMPLETED).length}
          </span>
          <span className="text-[11px] text-zinc-500">Completed team tasks</span>
        </div>
      </div>

      {/* Members Directory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMembers.map((member) => (
          <div
            key={member.id}
            className="rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-5 shadow-sm hover:border-zinc-700/80 transition-all flex flex-col justify-between"
          >
            <div>
              {/* Member Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  {member.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={member.image}
                      alt={member.name || "Member"}
                      className="h-11 w-11 rounded-full object-cover border border-zinc-700 ring-2 ring-emerald-500/20"
                    />
                  ) : (
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-zinc-800 text-xs font-bold text-zinc-300 border border-zinc-700">
                      {(member.name || member.email).slice(0, 2).toUpperCase()}
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-sm font-semibold text-white">
                        {member.name || "Unnamed Teammate"}
                      </h3>
                      {member.isCurrentUser && (
                        <span className="rounded bg-blue-500/20 px-1.5 py-0.2 text-[10px] font-semibold text-blue-400">
                          You
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400 truncate max-w-[180px]">
                      {member.email}
                    </p>
                  </div>
                </div>

                <span className="rounded-full border border-zinc-800 bg-zinc-950 px-2.5 py-0.5 text-[11px] font-medium text-zinc-300">
                  {member.role}
                </span>
              </div>

              {/* Workload Metric Chips */}
              <div className="mt-5 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-2.5 text-center">
                  <span className="text-[11px] text-zinc-500 block">Assigned Tasks</span>
                  <span className="text-sm font-bold text-white mt-0.5 block">
                    {member.assignedCount}
                  </span>
                </div>
                <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-2.5 text-center">
                  <span className="text-[11px] text-zinc-500 block">Active Backlog</span>
                  <span className="text-sm font-bold text-blue-400 mt-0.5 block">
                    {member.activeCount}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Status */}
            <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-[11px] text-zinc-500">
              <span className="flex items-center gap-1 text-emerald-400">
                <UserCheck className="h-3 w-3" />
                <span>Verified Google Account</span>
              </span>
              <span>{member.completedCount} completed</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
