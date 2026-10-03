"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  X,
  Plus,
  Loader2,
  Calendar,
  AlertCircle,
  Flag,
  User as UserIcon,
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

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setTitleError("Task title is required");
      return;
    }
    setTitleError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
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

      // Show email notification status if task was assigned
      if (data.notification && assignedToId) {
        if (data.notification.sent) {
          toast.success("Assigned user notified by email.", { duration: 4000 });
        } else {
          toast.info("Task created. Email notification could not be sent.", { duration: 4000 });
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

  const priorityOptions = [
    {
      value: TaskPriority.LOW,
      label: "Low",
      color: "border-sky-500/30 text-sky-400 bg-sky-500/10",
      activeColor: "border-sky-400 bg-sky-500/20 text-sky-300 ring-2 ring-sky-500/30",
    },
    {
      value: TaskPriority.MEDIUM,
      label: "Medium",
      color: "border-amber-500/30 text-amber-400 bg-amber-500/10",
      activeColor: "border-amber-400 bg-amber-500/20 text-amber-300 ring-2 ring-amber-500/30",
    },
    {
      value: TaskPriority.HIGH,
      label: "High",
      color: "border-rose-500/30 text-rose-400 bg-rose-500/10",
      activeColor: "border-rose-400 bg-rose-500/20 text-rose-300 ring-2 ring-rose-500/30",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl transition-all z-10">
        {/* Glow accent */}
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 h-20 w-40 bg-blue-500/15 blur-3xl pointer-events-none rounded-full" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600/10 border border-blue-500/20 text-blue-400">
              <Plus className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Create New Task</h2>
              <p className="text-xs text-zinc-400">Add a new item to your workspace</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Task Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (titleError) setTitleError("");
              }}
              placeholder="e.g. Design the user settings dashboard"
              className={`w-full rounded-xl border bg-zinc-950 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 outline-none transition-all focus:ring-2 focus:ring-blue-500/40 ${
                titleError
                  ? "border-red-500 focus:border-red-500"
                  : "border-zinc-800 focus:border-zinc-700"
              }`}
            />
            {titleError && (
              <p className="mt-1 flex items-center gap-1 text-xs text-red-400">
                <AlertCircle className="h-3 w-3" />
                {titleError}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Description <span className="text-zinc-500 text-[11px]">(optional)</span>
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide context, acceptance criteria, or relevant links..."
              className="w-full resize-none rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 outline-none transition-all focus:border-zinc-700 focus:ring-2 focus:ring-blue-500/40"
            />
          </div>

          {/* Priority */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5 flex items-center gap-1.5">
              <Flag className="h-3.5 w-3.5 text-zinc-400" />
              <span>Priority</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {priorityOptions.map((opt) => (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => setPriority(opt.value)}
                  className={`flex items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-medium transition-all cursor-pointer ${
                    priority === opt.value ? opt.activeColor : opt.color
                  }`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Grid: Due Date & Assign To */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Due Date */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-zinc-400" />
                <span>Due Date</span>
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-white outline-none transition-all focus:border-zinc-700 focus:ring-2 focus:ring-blue-500/40 scheme-dark cursor-pointer"
              />
            </div>

            {/* Assign To */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5 flex items-center gap-1.5">
                <UserIcon className="h-3.5 w-3.5 text-zinc-400" />
                <span>Assign To</span>
              </label>
              <select
                value={assignedToId}
                onChange={(e) => setAssignedToId(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-white outline-none transition-all focus:border-zinc-700 focus:ring-2 focus:ring-blue-500/40 cursor-pointer"
              >
                <option value="">Unassigned</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name ? `${u.name} (${u.email})` : u.email}
                    {u.id === currentUserId ? " — (You)" : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Footer actions */}
          <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-zinc-800/80">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-zinc-700 bg-zinc-800/80 px-4 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-500 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Creating...</span>
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
