"use client";

import { useMemo } from "react";
import {
  CheckCircle2,
  Clock,
  Layers,
  AlertTriangle,
  Plus,
  ArrowRight,
  Calendar,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { TaskStatus, TaskPriority } from "@prisma/client";
import { TaskWithUsers } from "@/types/task";

interface OverviewMetricsProps {
  tasks: TaskWithUsers[];
  userName: string;
  onCreateTaskClick: () => void;
  onSelectTask: (task: TaskWithUsers) => void;
  onViewAllTasksClick: () => void;
}

export function OverviewMetrics({
  tasks,
  userName,
  onCreateTaskClick,
  onSelectTask,
  onViewAllTasksClick,
}: OverviewMetricsProps) {
  // Determine dynamic time greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  // Compute real metrics directly from database tasks
  const metrics = useMemo(() => {
    const total = tasks.length;
    let pending = 0;
    let inProgress = 0;
    let completed = 0;
    let overdue = 0;

    const todayStr = new Date().toISOString().split("T")[0];

    tasks.forEach((t) => {
      if (t.status === TaskStatus.COMPLETED) {
        completed += 1;
      } else if (t.status === TaskStatus.IN_PROGRESS) {
        inProgress += 1;
      } else {
        pending += 1;
      }

      if (t.status !== TaskStatus.COMPLETED && t.dueDate) {
        const dueStr = new Date(t.dueDate).toISOString().split("T")[0];
        if (dueStr < todayStr) {
          overdue += 1;
        }
      }
    });

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      pending,
      inProgress,
      completed,
      overdue,
      completionRate,
    };
  }, [tasks]);

  // Recent 5 tasks sorted by creation date
  const recentTasks = useMemo(() => {
    return [...tasks]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [tasks]);

  const getPriorityBadge = (p: TaskPriority) => {
    switch (p) {
      case TaskPriority.LOW:
        return (
          <span className="inline-flex items-center gap-1 rounded-md border border-sky-500/20 bg-sky-500/10 px-2 py-0.5 text-[11px] font-medium text-sky-400">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
            Low
          </span>
        );
      case TaskPriority.MEDIUM:
        return (
          <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-400">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            Medium
          </span>
        );
      case TaskPriority.HIGH:
        return (
          <span className="inline-flex items-center gap-1 rounded-md border border-rose-500/20 bg-rose-500/10 px-2 py-0.5 text-[11px] font-medium text-rose-400">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
            High
          </span>
        );
    }
  };

  const getStatusBadge = (s: TaskStatus) => {
    switch (s) {
      case TaskStatus.PENDING:
        return (
          <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-medium text-amber-300">
            Pending
          </span>
        );
      case TaskStatus.IN_PROGRESS:
        return (
          <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-0.5 text-[11px] font-medium text-blue-300">
            In Progress
          </span>
        );
      case TaskStatus.COMPLETED:
        return (
          <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-300">
            Completed
          </span>
        );
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Greeting & Primary Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-800/60">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-blue-400 mb-1">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Executive Workspace</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            {greeting}, {userName}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-zinc-400">
            Here&apos;s what&apos;s happening with your work today.
          </p>
        </div>

        <button
          type="button"
          onClick={onCreateTaskClick}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-500 cursor-pointer self-start sm:self-auto active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          <span>+ Create task</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Tasks */}
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-5 shadow-sm hover:border-zinc-700/80 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Total Tasks</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-white tracking-tight">
              {metrics.total}
            </span>
            <p className="mt-1 text-[11px] text-zinc-500">
              {metrics.pending} pending across project
            </p>
          </div>
        </div>

        {/* In Progress */}
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-5 shadow-sm hover:border-zinc-700/80 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">In Progress</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-blue-400 tracking-tight">
              {metrics.inProgress}
            </span>
            <p className="mt-1 text-[11px] text-zinc-500">Currently active work</p>
          </div>
        </div>

        {/* Completed */}
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-5 shadow-sm hover:border-zinc-700/80 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Completed</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-emerald-400 tracking-tight">
              {metrics.completed}
            </span>
            <p className="mt-1 text-[11px] text-zinc-500">
              {metrics.completionRate}% completion rate
            </p>
          </div>
        </div>

        {/* Overdue */}
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-5 shadow-sm hover:border-zinc-700/80 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Overdue</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className={`text-2xl font-bold tracking-tight ${metrics.overdue > 0 ? "text-rose-400" : "text-zinc-300"}`}>
              {metrics.overdue}
            </span>
            <p className="mt-1 text-[11px] text-zinc-500">
              {metrics.overdue > 0 ? "Requires immediate attention" : "All deliverables on schedule"}
            </p>
          </div>
        </div>
      </div>

      {/* Task Overview Progress Breakdown */}
      <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-blue-400" />
            <h3 className="text-sm font-semibold text-white">Task Overview &amp; Health</h3>
          </div>
          <span className="text-xs text-zinc-400">
            {metrics.completed} of {metrics.total} tasks completed ({metrics.completionRate}%)
          </span>
        </div>

        {/* Segmented Progress Bar */}
        <div className="h-2.5 w-full rounded-full bg-zinc-800/90 overflow-hidden flex">
          {metrics.total > 0 ? (
            <>
              <div
                style={{ width: `${(metrics.completed / metrics.total) * 100}%` }}
                className="bg-emerald-500 transition-all duration-500"
                title={`Completed: ${metrics.completed}`}
              />
              <div
                style={{ width: `${(metrics.inProgress / metrics.total) * 100}%` }}
                className="bg-blue-500 transition-all duration-500"
                title={`In Progress: ${metrics.inProgress}`}
              />
              <div
                style={{ width: `${(metrics.pending / metrics.total) * 100}%` }}
                className="bg-amber-500/80 transition-all duration-500"
                title={`Pending: ${metrics.pending}`}
              />
            </>
          ) : (
            <div className="w-full bg-zinc-800" />
          )}
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap items-center gap-5 text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>Completed ({metrics.completed})</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            <span>In Progress ({metrics.inProgress})</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            <span>Pending ({metrics.pending})</span>
          </div>
          {metrics.overdue > 0 && (
            <div className="flex items-center gap-2 text-rose-400">
              <span className="h-2 w-2 rounded-full bg-rose-500" />
              <span>Overdue ({metrics.overdue})</span>
            </div>
          )}
        </div>
      </div>

      {/* Recent Tasks Section */}
      <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-6 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div>
            <h3 className="text-sm font-semibold text-white">Recent Tasks</h3>
            <p className="text-xs text-zinc-400">Latest active deliverables across workspace</p>
          </div>
          <button
            type="button"
            onClick={onViewAllTasksClick}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
          >
            <span>View all tasks</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {recentTasks.length > 0 ? (
          <div className="mt-4 divide-y divide-zinc-800/60">
            {recentTasks.map((t) => {
              const formattedDate = t.dueDate
                ? new Date(t.dueDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })
                : "No due date";

              return (
                <div
                  key={t.id}
                  onClick={() => onSelectTask(t)}
                  className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-zinc-800/30 px-2 rounded-xl transition-colors cursor-pointer group"
                >
                  <div className="flex items-start sm:items-center gap-3">
                    <div>
                      <h4 className="text-xs font-semibold text-white group-hover:text-blue-400 transition-colors">
                        {t.title}
                      </h4>
                      <div className="mt-1 flex items-center gap-2 text-[11px] text-zinc-500">
                        <span>Created by {t.createdBy?.name || t.createdBy?.email}</span>
                        {t.assignedTo && (
                          <>
                            <span>&bull;</span>
                            <span>Assigned to {t.assignedTo.name || t.assignedTo.email}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto text-xs">
                    {getPriorityBadge(t.priority)}
                    {getStatusBadge(t.status)}
                    <span className="text-zinc-500 text-[11px] flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formattedDate}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center text-xs text-zinc-500">
            No recent tasks yet. Click &quot;+ Create task&quot; above to get started.
          </div>
        )}
      </div>
    </div>
  );
}
