"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  X,
  Calendar,
  Clock,
  CheckCircle2,
  CircleDashed,
  Edit2,
  Trash2,
  Save,
  Loader2,
} from "lucide-react";
import { TaskStatus, TaskPriority } from "@prisma/client";
import { TaskWithUsers, SafeUser } from "@/types/task";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

interface TaskDetailModalProps {
  task: TaskWithUsers | null;
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
  users: SafeUser[];
  onTaskUpdated: (updatedTask: TaskWithUsers) => void;
  onTaskDeleted: (taskId: string) => void;
}

interface TaskEditFormProps {
  task: TaskWithUsers;
  users: SafeUser[];
  currentUserId: string;
  onCancel: () => void;
  onSaved: (updatedTask: TaskWithUsers) => void;
}

function TaskEditForm({ task, users, currentUserId, onCancel, onSaved }: TaskEditFormProps) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [priority, setPriority] = useState<TaskPriority>(task.priority);
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [assignedToId, setAssignedToId] = useState<string>(task.assignedToId || "");
  const [dueDate, setDueDate] = useState(() => {
    if (!task.dueDate) return "";
    const d = new Date(task.dueDate);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      toast.error("Title cannot be empty");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: trimmedTitle,
          description: description.trim() || null,
          priority,
          status,
          dueDate: dueDate || null,
          assignedToId: assignedToId || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update task");

      toast.success("Task updated successfully");
      onSaved(data.task);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save changes";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="mt-5 space-y-4">
      <div>
        <label className="block text-xs font-medium text-zinc-300 mb-1.5">
          Title <span className="text-rose-400">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-zinc-700 focus:ring-2 focus:ring-blue-500/40"
          required
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-zinc-300 mb-1.5">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-zinc-700 focus:ring-2 focus:ring-blue-500/40 resize-none"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1.5">
            Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as TaskStatus)}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-white outline-none focus:border-zinc-700 focus:ring-2 focus:ring-blue-500/40 cursor-pointer"
          >
            <option value={TaskStatus.PENDING}>Pending</option>
            <option value={TaskStatus.IN_PROGRESS}>In Progress</option>
            <option value={TaskStatus.COMPLETED}>Completed</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1.5">
            Priority
          </label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as TaskPriority)}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-white outline-none focus:border-zinc-700 focus:ring-2 focus:ring-blue-500/40 cursor-pointer"
          >
            <option value={TaskPriority.LOW}>Low</option>
            <option value={TaskPriority.MEDIUM}>Medium</option>
            <option value={TaskPriority.HIGH}>High</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1.5">
            Due Date
          </label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-white outline-none focus:border-zinc-700 focus:ring-2 focus:ring-blue-500/40"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-zinc-300 mb-1.5">
          Assignee
        </label>
        <select
          value={assignedToId}
          onChange={(e) => setAssignedToId(e.target.value)}
          className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-white outline-none focus:border-zinc-700 focus:ring-2 focus:ring-blue-500/40 cursor-pointer"
        >
          <option value="">Unassigned</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name || u.email}
              {u.id === currentUserId ? " (You)" : ""}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition-colors cursor-pointer disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Saving changes...</span>
            </>
          ) : (
            <>
              <Save className="h-3.5 w-3.5" />
              <span>Save Changes</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}

export function TaskDetailModal({
  task,
  isOpen,
  onClose,
  currentUserId,
  users,
  onTaskUpdated,
  onTaskDeleted,
}: TaskDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isDeleting && !showDeleteConfirm) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isDeleting, showDeleteConfirm, onClose]);

  if (!isOpen || !task) return null;

  const isCreator = task.createdById === currentUserId;
  const isAssignee = task.assignedToId === currentUserId;
  const canUpdateStatus = isCreator || isAssignee;

  // Quick status update from detail view
  const handleStatusChange = async (newStatus: TaskStatus) => {
    if (newStatus === task.status || !canUpdateStatus) return;

    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update status");

      toast.success(`Task status updated to ${newStatus.replace("_", " ")}`);

      if (newStatus === TaskStatus.COMPLETED && data.notification) {
        if (data.notification.sent) {
          toast.success("Creator notified by email.", { duration: 4000 });
        } else {
          toast.info("Task completed. Email notification could not be delivered.", { duration: 4000 });
        }
      }

      onTaskUpdated(data.task);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Update failed";
      toast.error(message);
    }
  };

  // Delete task action
  const handleDeleteConfirm = async () => {
    if (!isCreator) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete task");

      toast.success("Task deleted successfully");
      setShowDeleteConfirm(false);
      onTaskDeleted(task.id);
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to delete task";
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  };

  const getPriorityBadge = (p: TaskPriority) => {
    switch (p) {
      case TaskPriority.LOW:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/20 bg-sky-500/10 px-2.5 py-0.5 text-xs font-medium text-sky-400">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
            Low Priority
          </span>
        );
      case TaskPriority.MEDIUM:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-400">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            Medium Priority
          </span>
        );
      case TaskPriority.HIGH:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/20 bg-rose-500/10 px-2.5 py-0.5 text-xs font-medium text-rose-400">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
            High Priority
          </span>
        );
    }
  };

  // Due date check
  let isOverdue = false;
  let isDueToday = false;
  let formattedDueDate = "No due date set";
  if (task.dueDate) {
    const d = new Date(task.dueDate);
    formattedDueDate = d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const dueStr = d.toISOString().split("T")[0];

    if (task.status !== TaskStatus.COMPLETED) {
      if (dueStr < todayStr) isOverdue = true;
      if (dueStr === todayStr) isDueToday = true;
    }
  }

  const formattedCreatedAt = new Date(task.createdAt).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  const formattedUpdatedAt = new Date(task.updatedAt).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in-0 duration-150">
        <div
          className="relative w-full max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          {/* Header */}
          <div className="flex items-start justify-between pb-4 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              {getPriorityBadge(task.priority)}
              <span className="rounded-full border border-zinc-800 bg-zinc-950 px-2.5 py-0.5 text-xs text-zinc-400">
                {task.status.replace("_", " ")}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {isCreator && !isEditing && (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
                >
                  <Edit2 className="h-3 w-3" />
                  <span>Edit</span>
                </button>
              )}
              {isCreator && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-400 hover:bg-rose-500/20 transition-colors cursor-pointer"
                >
                  <Trash2 className="h-3 w-3" />
                  <span>Delete</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Body: View Mode or Edit Form */}
          {isEditing ? (
            <TaskEditForm
              key={`${task.id}-${task.updatedAt}`}
              task={task}
              users={users}
              currentUserId={currentUserId}
              onCancel={() => setIsEditing(false)}
              onSaved={(updated) => {
                onTaskUpdated(updated);
                setIsEditing(false);
              }}
            />
          ) : (
            <div className="mt-5 space-y-6">
              {/* Title & Description */}
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight leading-snug">
                  {task.title}
                </h1>
                {task.description ? (
                  <p className="mt-3 text-xs sm:text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap bg-zinc-950/60 rounded-xl p-4 border border-zinc-800/80">
                    {task.description}
                  </p>
                ) : (
                  <p className="mt-3 text-xs text-zinc-500 italic bg-zinc-950/40 rounded-xl p-3 border border-dashed border-zinc-800">
                    No description provided.
                  </p>
                )}
              </div>

              {/* Status Update Control */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                    Workflow Status
                  </span>
                  {!canUpdateStatus && (
                    <span className="text-[11px] text-zinc-500">
                      Read-only (only creator or assignee can update status)
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleStatusChange(TaskStatus.PENDING)}
                    disabled={!canUpdateStatus || task.status === TaskStatus.PENDING}
                    className={`flex items-center justify-center gap-1.5 rounded-lg py-2 px-3 text-xs font-medium transition-all ${
                      task.status === TaskStatus.PENDING
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
                        : "border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-50 cursor-pointer"
                    }`}
                  >
                    <CircleDashed className="h-3.5 w-3.5" />
                    <span>Pending</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleStatusChange(TaskStatus.IN_PROGRESS)}
                    disabled={!canUpdateStatus || task.status === TaskStatus.IN_PROGRESS}
                    className={`flex items-center justify-center gap-1.5 rounded-lg py-2 px-3 text-xs font-medium transition-all ${
                      task.status === TaskStatus.IN_PROGRESS
                        ? "bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-sm"
                        : "border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-50 cursor-pointer"
                    }`}
                  >
                    <Clock className="h-3.5 w-3.5" />
                    <span>In Progress</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleStatusChange(TaskStatus.COMPLETED)}
                    disabled={!canUpdateStatus || task.status === TaskStatus.COMPLETED}
                    className={`flex items-center justify-center gap-1.5 rounded-lg py-2 px-3 text-xs font-medium transition-all ${
                      task.status === TaskStatus.COMPLETED
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm"
                        : "border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-50 cursor-pointer"
                    }`}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Completed</span>
                  </button>
                </div>
              </div>

              {/* Task Metadata Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Assignee */}
                <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/40 p-3.5">
                  <span className="text-zinc-500 block mb-1.5">Assignee</span>
                  {task.assignedTo ? (
                    <div className="flex items-center gap-2.5">
                      {task.assignedTo.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={task.assignedTo.image}
                          alt={task.assignedTo.name || "User"}
                          className="h-6 w-6 rounded-full border border-zinc-700 object-cover"
                        />
                      ) : (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-800 text-[10px] font-bold text-zinc-300">
                          {(task.assignedTo.name || task.assignedTo.email).slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <span className="font-medium text-white block">
                          {task.assignedTo.name || task.assignedTo.email}
                        </span>
                        <span className="text-[11px] text-zinc-400">
                          {task.assignedTo.email}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <span className="text-zinc-400">Unassigned</span>
                  )}
                </div>

                {/* Creator */}
                <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/40 p-3.5">
                  <span className="text-zinc-500 block mb-1.5">Created By</span>
                  <div className="flex items-center gap-2.5">
                    {task.createdBy.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={task.createdBy.image}
                        alt={task.createdBy.name || "Creator"}
                        className="h-6 w-6 rounded-full border border-zinc-700 object-cover"
                      />
                    ) : (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-800 text-[10px] font-bold text-zinc-300">
                        {(task.createdBy.name || task.createdBy.email).slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <span className="font-medium text-white block">
                        {task.createdBy.name || task.createdBy.email}
                      </span>
                      <span className="text-[11px] text-zinc-400">
                        {task.createdBy.email}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Due Date & Alerts */}
                <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/40 p-3.5">
                  <span className="text-zinc-500 block mb-1.5">Due Date</span>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-zinc-400" />
                    <span className="font-medium text-white">{formattedDueDate}</span>
                    {isOverdue && (
                      <span className="rounded-md border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-[10px] font-semibold text-rose-400">
                        Overdue
                      </span>
                    )}
                    {isDueToday && (
                      <span className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-400">
                        Due Today
                      </span>
                    )}
                  </div>
                </div>

                {/* Activity Timestamps */}
                <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/40 p-3.5">
                  <span className="text-zinc-500 block mb-1.5">Activity History</span>
                  <div className="space-y-1 text-[11px] text-zinc-400">
                    <p>
                      Created: <span className="text-zinc-200">{formattedCreatedAt}</span>
                    </p>
                    <p>
                      Updated: <span className="text-zinc-200">{formattedUpdatedAt}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Dialog for Task Deletion */}
      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        title="Delete Task"
        description={`Are you sure you want to delete "${task.title}"? This action is permanent and cannot be undone.`}
        confirmLabel="Delete Task"
        cancelLabel="Cancel"
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </>
  );
}
