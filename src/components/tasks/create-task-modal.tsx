"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import {
  X,
  Plus,
  Loader2,
  Calendar,
  AlertCircle,
  Flag,
  User as UserIcon,
  AlignLeft,
} from "lucide-react";
import { TaskPriority } from "@prisma/client";
import { SafeUser, TaskWithUsers } from "@/types/task";

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: SafeUser[];
  onTaskCreated: (task: TaskWithUsers) => void;
  currentUserId: string;
}

export function CreateTaskModal({
  isOpen,
  onClose,
  users,
  onTaskCreated,
  currentUserId,
}: CreateTaskModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.MEDIUM);
  const [dueDate, setDueDate] = useState("");
  const [assignedToId, setAssignedToId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [titleError, setTitleError] = useState("");

  const titleInputRef = useRef<HTMLInputElement>(null);

  // Focus title input on modal open and handle Escape key
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => titleInputRef.current?.focus(), 50);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape" && !isSubmitting) {
          onClose();
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setTitleError("Task title is required");
      titleInputRef.current?.focus();
      return;
    }

    setTitleError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: trimmedTitle,
          description: description.trim() || null,
          priority,
          dueDate: dueDate || null,
          assignedToId: assignedToId || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create task");
      }

      toast.success("Task created successfully!");

      // Show email notification status if assigned to someone else
      if (data.notification && assignedToId && assignedToId !== currentUserId) {
        if (data.notification.sent) {
          toast.success("Teammate notified by email.", { duration: 4000 });
        } else {
          toast.info("Task created. Email notification could not be delivered.", { duration: 4000 });
        }
      }

      onTaskCreated(data.task);
      resetForm();
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setPriority(TaskPriority.MEDIUM);
    setDueDate("");
    setAssignedToId("");
    setTitleError("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in-0 duration-150">
      <div
        className="relative w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-task-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600/10 border border-blue-500/20 text-blue-400">
              <Plus className="h-4 w-4" />
            </div>
            <div>
              <h2 id="create-task-title" className="text-base font-semibold text-white">
                Create New Task
              </h2>
              <p className="text-xs text-zinc-400">Add a work item and assign responsibility</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer disabled:opacity-50"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Title Field */}
          <div>
            <label htmlFor="task-title" className="block text-xs font-medium text-zinc-300 mb-1.5">
              Task Title <span className="text-rose-400">*</span>
            </label>
            <input
              id="task-title"
              ref={titleInputRef}
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (titleError) setTitleError("");
              }}
              placeholder="e.g. Audit Q4 security compliance and report findings"
              className={`w-full rounded-xl border bg-zinc-950 px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 outline-none transition-all ${
                titleError
                  ? "border-rose-500/50 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                  : "border-zinc-800 focus:border-zinc-700 focus:ring-2 focus:ring-blue-500/40"
              }`}
              maxLength={200}
            />
            {titleError && (
              <p className="mt-1.5 flex items-center gap-1 text-[11px] text-rose-400">
                <AlertCircle className="h-3 w-3 shrink-0" />
                <span>{titleError}</span>
              </p>
            )}
          </div>

          {/* Description Field */}
          <div>
            <label htmlFor="task-description" className="block text-xs font-medium text-zinc-300 mb-1.5 flex items-center gap-1.5">
              <AlignLeft className="h-3 w-3 text-zinc-400" />
              <span>Description</span>
              <span className="text-[10px] text-zinc-500 font-normal">(Optional)</span>
            </label>
            <textarea
              id="task-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide background context, acceptance criteria, or external links..."
              rows={3}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 outline-none transition-all focus:border-zinc-700 focus:ring-2 focus:ring-blue-500/40 resize-none"
            />
          </div>

          {/* Priority & Due Date (Two-column) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Priority */}
            <div>
              <label htmlFor="task-priority" className="block text-xs font-medium text-zinc-300 mb-1.5 flex items-center gap-1.5">
                <Flag className="h-3 w-3 text-zinc-400" />
                <span>Priority</span>
              </label>
              <select
                id="task-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-white outline-none transition-all focus:border-zinc-700 focus:ring-2 focus:ring-blue-500/40 cursor-pointer"
              >
                <option value={TaskPriority.LOW}>Low Priority</option>
                <option value={TaskPriority.MEDIUM}>Medium Priority</option>
                <option value={TaskPriority.HIGH}>High Priority</option>
              </select>
            </div>

            {/* Due Date */}
            <div>
              <label htmlFor="task-due-date" className="block text-xs font-medium text-zinc-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="h-3 w-3 text-zinc-400" />
                <span>Target Due Date</span>
              </label>
              <input
                id="task-due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-white outline-none transition-all focus:border-zinc-700 focus:ring-2 focus:ring-blue-500/40"
              />
            </div>
          </div>

          {/* Assignee Selection */}
          <div>
            <label htmlFor="task-assignee" className="block text-xs font-medium text-zinc-300 mb-1.5 flex items-center gap-1.5">
              <UserIcon className="h-3 w-3 text-zinc-400" />
              <span>Assign To Teammate</span>
            </label>
            <select
              id="task-assignee"
              value={assignedToId}
              onChange={(e) => setAssignedToId(e.target.value)}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-white outline-none transition-all focus:border-zinc-700 focus:ring-2 focus:ring-blue-500/40 cursor-pointer"
            >
              <option value="">Unassigned (Open task)</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name ? `${u.name} (${u.email})` : u.email}
                  {u.id === currentUserId ? " — (You)" : ""}
                </option>
              ))}
            </select>
            <p className="mt-1 text-[11px] text-zinc-500">
              Assigned teammates receive an automated Gmail alert when configured.
            </p>
          </div>

          {/* Footer Actions */}
          <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-[0.98]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Creating task...</span>
                </>
              ) : (
                <>
                  <Plus className="h-3.5 w-3.5" />
                  <span>Create Task</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
