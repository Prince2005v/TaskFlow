"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Calendar,
  User as UserIcon,
  CheckCircle2,
  Clock,
  CircleDashed,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { TaskStatus, TaskPriority } from "@prisma/client";
import { TaskWithUsers } from "@/types/task";

interface TaskCardProps {
  task: TaskWithUsers;
  currentUserId: string;
  onStatusChange?: (taskId: string, newStatus: TaskStatus) => void;
}

export function TaskCard({ task, currentUserId, onStatusChange }: TaskCardProps) {
  const [currentStatus, setCurrentStatus] = useState<TaskStatus>(task.status);
  const [isUpdating, setIsUpdating] = useState(false);

  const isCreator = task.createdById === currentUserId;
  const isAssignee = task.assignedToId === currentUserId;
  const canUpdateStatus = isCreator || isAssignee;

  const handleStatusUpdate = async (newStatus: TaskStatus) => {
    if (newStatus === currentStatus || !canUpdateStatus) return;

    setIsUpdating(true);
    const previousStatus = currentStatus;
    setCurrentStatus(newStatus);

    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update status");
      }

      toast.success(`Task moved to ${formatStatus(newStatus)}`);

      // Show email notification status if task was completed
      if (newStatus === TaskStatus.COMPLETED && data.notification) {
        if (data.notification.sent) {
          toast.success("Creator notified by email.", {
            duration: 4000,
          });
        } else {
          toast.info("Task updated. Email notification could not be sent.", {
            duration: 4000,
          });
        }
      }
      onStatusChange?.(task.id, newStatus);
    } catch (err: unknown) {
      setCurrentStatus(previousStatus);
      const message = err instanceof Error ? err.message : "Update failed";
      toast.error(message);
    } finally {
      setIsUpdating(false);
    }
  };

  const formatStatus = (s: TaskStatus) => {
    switch (s) {
      case TaskStatus.PENDING:
        return "Pending";
      case TaskStatus.IN_PROGRESS:
        return "In Progress";
      case TaskStatus.COMPLETED:
        return "Completed";
    }
  };

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

  const getStatusIcon = (s: TaskStatus) => {
    switch (s) {
      case TaskStatus.PENDING:
        return <CircleDashed className="h-3 w-3 text-amber-400" />;
      case TaskStatus.IN_PROGRESS:
        return <Clock className="h-3 w-3 text-blue-400" />;
      case TaskStatus.COMPLETED:
        return <CheckCircle2 className="h-3 w-3 text-emerald-400" />;
    }
  };

  const isCompleted = currentStatus === TaskStatus.COMPLETED;

  // Format due date
  let formattedDueDate: string | null = null;
  let isOverdue = false;
  if (task.dueDate) {
    const d = new Date(task.dueDate);
    formattedDueDate = d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (d < today && !isCompleted) {
      isOverdue = true;
    }
  }

  return (
    <div className="group relative flex flex-col justify-between rounded-xl border border-zinc-800/90 bg-zinc-900/70 p-5 shadow-sm transition-all hover:border-zinc-700 hover:bg-zinc-900">
      <div>
        {/* Top Badges: Priority + Status */}
        <div className="flex items-center justify-between gap-2">
          {getPriorityBadge(task.priority)}

          {/* Interactive status selector */}
          <div className="flex items-center gap-1.5">
            {isUpdating ? (
              <span className="inline-flex items-center gap-1 rounded-md border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-[11px] text-zinc-400">
                <Loader2 className="h-3 w-3 animate-spin text-zinc-400" />
                Updating...
              </span>
            ) : canUpdateStatus ? (
              <div className="relative">
                <select
                  value={currentStatus}
                  onChange={(e) => handleStatusUpdate(e.target.value as TaskStatus)}
                  className={`rounded-md border px-2 py-0.5 text-[11px] font-medium transition-colors cursor-pointer outline-none focus:ring-1 focus:ring-blue-500/50 ${
                    currentStatus === TaskStatus.COMPLETED
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                      : currentStatus === TaskStatus.IN_PROGRESS
                      ? "border-blue-500/30 bg-blue-500/10 text-blue-400"
                      : "border-amber-500/30 bg-amber-500/10 text-amber-400"
                  }`}
                  title="Click to update status"
                >
                  <option value={TaskStatus.PENDING} className="bg-zinc-900 text-zinc-200">
                    Pending
                  </option>
                  <option value={TaskStatus.IN_PROGRESS} className="bg-zinc-900 text-zinc-200">
                    In Progress
                  </option>
                  <option value={TaskStatus.COMPLETED} className="bg-zinc-900 text-zinc-200">
                    Completed
                  </option>
                </select>
              </div>
            ) : (
              <span
                className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium ${
                  currentStatus === TaskStatus.COMPLETED
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                    : currentStatus === TaskStatus.IN_PROGRESS
                    ? "border-blue-500/30 bg-blue-500/10 text-blue-400"
                    : "border-amber-500/30 bg-amber-500/10 text-amber-400"
                }`}
              >
                {getStatusIcon(currentStatus)}
                {formatStatus(currentStatus)}
              </span>
            )}
          </div>
        </div>

        {/* Title */}
        <h3
          className={`mt-3 text-sm font-semibold text-white tracking-tight ${
            isCompleted ? "line-through text-zinc-500" : ""
          }`}
        >
          {task.title}
        </h3>

        {/* Description */}
        {task.description && (
          <p className="mt-1.5 text-xs text-zinc-400 line-clamp-3 leading-relaxed">
            {task.description}
          </p>
        )}
      </div>

      {/* Footer Info: Due Date + People */}
      <div className="mt-5 space-y-3 pt-3 border-t border-zinc-800/80 text-xs">
        {/* Due Date row */}
        {formattedDueDate && (
          <div className="flex items-center gap-1.5 text-zinc-400">
            <Calendar className="h-3.5 w-3.5 text-zinc-500" />
            <span className={isOverdue ? "text-rose-400 font-medium" : ""}>
              Due {formattedDueDate}
            </span>
            {isOverdue && (
              <span className="inline-flex items-center gap-1 text-[10px] text-rose-400">
                <AlertTriangle className="h-3 w-3" />
                Overdue
              </span>
            )}
          </div>
        )}

        {/* Users row: Created By & Assigned To */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-zinc-400">
          {/* Created By */}
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-500">By:</span>
            {task.createdBy.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={task.createdBy.image}
                alt={task.createdBy.name || "User"}
                className="h-4 w-4 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-4 w-4 items-center justify-center rounded-full bg-zinc-800 text-[9px] text-zinc-400">
                {(task.createdBy.name || task.createdBy.email)[0].toUpperCase()}
              </div>
            )}
            <span className="truncate max-w-[110px]" title={task.createdBy.email}>
              {task.createdBy.name || task.createdBy.email.split("@")[0]}
              {task.createdById === currentUserId ? " (You)" : ""}
            </span>
          </div>

          {/* Assigned To */}
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-500">To:</span>
            {task.assignedTo ? (
              <>
                {task.assignedTo.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={task.assignedTo.image}
                    alt={task.assignedTo.name || "User"}
                    className="h-4 w-4 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-4 w-4 items-center justify-center rounded-full bg-zinc-800 text-[9px] text-zinc-400">
                    {(task.assignedTo.name || task.assignedTo.email)[0].toUpperCase()}
                  </div>
                )}
                <span className="truncate max-w-[110px]" title={task.assignedTo.email}>
                  {task.assignedTo.name || task.assignedTo.email.split("@")[0]}
                  {task.assignedToId === currentUserId ? " (You)" : ""}
                </span>
              </>
            ) : (
              <span className="text-zinc-600 flex items-center gap-1">
                <UserIcon className="h-3 w-3" />
                Unassigned
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
