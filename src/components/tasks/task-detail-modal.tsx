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
  Send,
  MessageSquare,
  History,
  AlertTriangle,
  User as UserIcon,
  Flag,
  Sparkles,
} from "lucide-react";
import { TaskStatus, TaskPriority, WorkspaceRole } from "@prisma/client";
import { TaskWithUsers, SafeUser, TaskActivityItem, TaskCommentItem } from "@/types/task";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { AIBreakdownButton } from "@/components/ai/ai-breakdown-button";
import { AIPriorityButton } from "@/components/ai/ai-priority-button";
import { AIDeadlineButton } from "@/components/ai/ai-deadline-button";
import { AISummaryButton } from "@/components/ai/ai-summary-button";

interface TaskDetailModalProps {
  task: TaskWithUsers | null;
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
  workspaceRole: WorkspaceRole;
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
    <form onSubmit={handleSave} className="space-y-4">
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
          rows={3}
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

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
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
  workspaceRole,
  users,
  onTaskUpdated,
  onTaskDeleted,
}: TaskDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Tabs for bottom section: Comments vs Activity
  const [activeTab, setActiveTab] = useState<"comments" | "activity">("comments");
  const [commentInput, setCommentInput] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Local state for comments and activities
  const [comments, setComments] = useState<TaskCommentItem[]>(task?.comments || []);
  const [activities, setActivities] = useState<TaskActivityItem[]>(task?.activities || []);

  // Update comments and activities if task changes
  useEffect(() => {
    if (task) {
      setComments(task.comments || []);
      setActivities(task.activities || []);
      setIsEditing(false);
    }
  }, [task]);

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
  const isManager =
    workspaceRole === WorkspaceRole.OWNER || workspaceRole === WorkspaceRole.ADMIN;
  const canModifyDetails = isCreator || isManager;
  const canUpdateStatus = isCreator || isAssignee || isManager;

  // Handle Status Update
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

      toast.success(`Status updated to ${newStatus.replace("_", " ")}`);

      // Add activity entry locally
      const newActivity: TaskActivityItem = {
        id: `temp-${Date.now()}`,
        taskId: task.id,
        userId: currentUserId,
        user: { id: currentUserId, name: "You", email: "", image: null },
        action: "STATUS_CHANGED",
        details: `You changed status to ${newStatus.replace("_", " ")}`,
        oldValue: task.status,
        newValue: newStatus,
        createdAt: new Date().toISOString(),
      };
      setActivities((prev) => [newActivity, ...prev]);

      onTaskUpdated(data.task);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Update failed";
      toast.error(message);
    }
  };

  // Handle Add Comment
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim() || isSubmittingComment) return;

    setIsSubmittingComment(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: commentInput.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to post comment");

      setComments((prev) => [...prev, data.comment]);
      setCommentInput("");
      toast.success("Comment added");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to add comment";
      toast.error(message);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Delete task action
  const handleDeleteConfirm = async () => {
    if (!canModifyDetails) return;
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
  let formattedDueDate = "No due date";
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

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in-0 duration-150">
        <div
          className="relative w-full max-w-3xl rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto flex flex-col"
          role="dialog"
          aria-modal="true"
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/70 sticky top-0 z-10">
            <div className="flex items-center gap-2.5">
              {getPriorityBadge(task.priority)}
              <span className="rounded-full border border-zinc-800 bg-zinc-900 px-2.5 py-0.5 text-xs font-medium text-zinc-300">
                {task.status.replace("_", " ")}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {canModifyDetails && !isEditing && (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
                >
                  <Edit2 className="h-3 w-3" />
                  <span>Edit</span>
                </button>
              )}
              {canModifyDetails && (
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

          {/* Modal Body */}
          <div className="p-6 space-y-6">
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
              <>
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

                {/* Status Switcher */}
                <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                      Workflow Status
                    </span>
                    {!canUpdateStatus && (
                      <span className="text-[11px] text-zinc-500">
                        Read-only
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

                {/* Metadata Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  {/* Assignee */}
                  <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/40 p-3.5">
                    <span className="text-zinc-500 block mb-1">Assignee</span>
                    {task.assignedTo ? (
                      <div className="flex items-center gap-2">
                        {task.assignedTo.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={task.assignedTo.image}
                            alt="User"
                            className="h-5 w-5 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-800 text-[10px] font-bold text-zinc-300">
                            {(task.assignedTo.name || task.assignedTo.email).slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <span className="font-medium text-white truncate">
                          {task.assignedTo.name || task.assignedTo.email}
                        </span>
                      </div>
                    ) : (
                      <span className="text-zinc-400">Unassigned</span>
                    )}
                  </div>

                  {/* Due Date */}
                  <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/40 p-3.5">
                    <span className="text-zinc-500 block mb-1">Due Date</span>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-zinc-400" />
                      <span className="font-medium text-white">{formattedDueDate}</span>
                      {isOverdue && (
                        <span className="rounded bg-rose-500/20 px-1.5 py-0.2 text-[10px] font-semibold text-rose-400">
                          Overdue
                        </span>
                      )}
                      {isDueToday && (
                        <span className="rounded bg-amber-500/20 px-1.5 py-0.2 text-[10px] font-semibold text-amber-400">
                          Today
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Creator */}
                  <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/40 p-3.5">
                    <span className="text-zinc-500 block mb-1">Creator</span>
                    <span className="font-medium text-white truncate block">
                      {task.createdBy.name || task.createdBy.email}
                    </span>
                  </div>
                </div>

                {/* ✨ AI Actions Section */}
                <div className="rounded-xl border border-violet-500/10 bg-zinc-950/40 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="h-3.5 w-3.5 text-violet-400" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-violet-400">
                      AI Actions
                    </span>
                  </div>
                  <div className="space-y-3">
                    <AISummaryButton taskId={task.id} />
                    <AIPriorityButton
                      taskId={task.id}
                      currentPriority={task.priority}
                      onApplyPriority={async (priority) => {
                        const res = await fetch(`/api/tasks/${task.id}`, {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ priority }),
                        });
                        if (!res.ok) throw new Error("Failed to update priority");
                        const data = await res.json();
                        onTaskUpdated(data.task);
                      }}
                    />
                    <AIDeadlineButton
                      taskId={task.id}
                      onApplyDeadline={async (date) => {
                        const res = await fetch(`/api/tasks/${task.id}`, {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ dueDate: date }),
                        });
                        if (!res.ok) throw new Error("Failed to update deadline");
                        const data = await res.json();
                        onTaskUpdated(data.task);
                      }}
                    />
                    <AIBreakdownButton
                      taskId={task.id}
                      taskTitle={task.title}
                      onSubtasksCreated={() => {
                        toast.success("Subtasks added — refresh to see them in the task list");
                      }}
                    />
                  </div>
                </div>

                {/* Bottom Section Tabs: Comments & Activity History */}
                <div className="pt-4 border-t border-zinc-800">
                  <div className="flex items-center gap-4 border-b border-zinc-800 pb-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setActiveTab("comments")}
                      className={`flex items-center gap-1.5 font-semibold transition-colors cursor-pointer ${
                        activeTab === "comments"
                          ? "text-blue-400 border-b-2 border-blue-500 pb-2 -mb-2.5"
                          : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      <span>Comments ({comments.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab("activity")}
                      className={`flex items-center gap-1.5 font-semibold transition-colors cursor-pointer ${
                        activeTab === "activity"
                          ? "text-blue-400 border-b-2 border-blue-500 pb-2 -mb-2.5"
                          : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      <History className="h-3.5 w-3.5" />
                      <span>Activity Log ({activities.length})</span>
                    </button>
                  </div>

                  {/* Tab 1: Comments */}
                  {activeTab === "comments" && (
                    <div className="mt-4 space-y-4">
                      {/* Comments Thread */}
                      <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                        {comments.length > 0 ? (
                          comments.map((c) => {
                            const timeStr = new Date(c.createdAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                            });

                            return (
                              <div
                                key={c.id}
                                className="rounded-xl border border-zinc-800/80 bg-zinc-950/50 p-3 text-xs"
                              >
                                <div className="flex items-center justify-between gap-2 mb-1.5">
                                  <div className="flex items-center gap-2">
                                    {c.user.image ? (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img
                                        src={c.user.image}
                                        alt={c.user.name || "User"}
                                        className="h-4 w-4 rounded-full object-cover"
                                      />
                                    ) : (
                                      <UserIcon className="h-3.5 w-3.5 text-zinc-400" />
                                    )}
                                    <span className="font-semibold text-white">
                                      {c.user.name || c.user.email}
                                    </span>
                                  </div>
                                  <span className="text-[10px] text-zinc-500">
                                    {timeStr}
                                  </span>
                                </div>
                                <p className="text-zinc-300 leading-relaxed pl-6">
                                  {c.content}
                                </p>
                              </div>
                            );
                          })
                        ) : (
                          <div className="py-6 text-center text-xs text-zinc-500">
                            No comments yet. Start the conversation below.
                          </div>
                        )}
                      </div>

                      {/* Add Comment Input */}
                      <form onSubmit={handleAddComment} className="flex gap-2">
                        <input
                          type="text"
                          value={commentInput}
                          onChange={(e) => setCommentInput(e.target.value)}
                          placeholder="Write a comment or status update..."
                          className="flex-1 rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-zinc-700 focus:ring-2 focus:ring-blue-500/30"
                        />
                        <button
                          type="submit"
                          disabled={!commentInput.trim() || isSubmittingComment}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          {isSubmittingComment ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Send className="h-3.5 w-3.5" />
                          )}
                          <span>Post</span>
                        </button>
                      </form>
                    </div>
                  )}

                  {/* Tab 2: Activity Audit History */}
                  {activeTab === "activity" && (
                    <div className="mt-4 max-h-56 overflow-y-auto space-y-2 pr-1">
                      {activities.length > 0 ? (
                        activities.map((a) => {
                          const timeStr = new Date(a.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          });

                          return (
                            <div
                              key={a.id}
                              className="flex items-start gap-2.5 text-xs py-1.5 border-b border-zinc-800/40 last:border-0"
                            >
                              <div className="h-1.5 w-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                              <div className="flex-1">
                                <span className="text-zinc-300">{a.details}</span>
                                <span className="text-[10px] text-zinc-500 block mt-0.5">
                                  {timeStr}
                                </span>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="py-6 text-center text-xs text-zinc-500">
                          No audit activity recorded yet.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        title="Delete Task"
        description={`Are you sure you want to delete "${task.title}"? This action cannot be undone.`}
        confirmLabel="Delete Task"
        cancelLabel="Cancel"
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </>
  );
}
