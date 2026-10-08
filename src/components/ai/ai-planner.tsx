"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Sparkles,
  Send,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  Edit3,
  Calendar,
  User as UserIcon,
  Flag,
  Plus,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import type { AIProposedTask, AIPlannerResponse } from "@/lib/ai-schemas";
import { AILoadingState, AIErrorBanner } from "./ai-loading-state";

interface AIPlannerProps {
  onTasksCreated: () => void;
}

type EditingTask = AIProposedTask & { _index: number };

export function AIPlanner({ onTasksCreated }: AIPlannerProps) {
  const [prompt, setPrompt] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [proposal, setProposal] = useState<AIPlannerResponse | null>(null);
  const [approvedIndexes, setApprovedIndexes] = useState<Set<number>>(new Set());
  const [rejectedIndexes, setRejectedIndexes] = useState<Set<number>>(new Set());
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [editingTask, setEditingTask] = useState<EditingTask | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!prompt.trim()) return;
    setIsAnalyzing(true);
    setProposal(null);
    setError(null);
    setApprovedIndexes(new Set());
    setRejectedIndexes(new Set());
    setExpandedIndex(null);

    try {
      const res = await fetch("/api/ai/planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "AI analysis failed");
      }

      setProposal(data.proposal);
      // Default: approve all
      setApprovedIndexes(new Set(data.proposal.tasks.map((_: unknown, i: number) => i)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI analysis failed. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApproveAll = async () => {
    if (!proposal) return;
    const tasksToCreate = proposal.tasks.filter(
      (_, i) => approvedIndexes.has(i) && !rejectedIndexes.has(i)
    );
    if (tasksToCreate.length === 0) {
      toast.error("No tasks selected for creation");
      return;
    }

    setIsApproving(true);
    try {
      const res = await fetch("/api/ai/planner/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks: tasksToCreate }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create tasks");

      toast.success(`✓ ${data.count} task(s) created successfully`);
      setProposal(null);
      setPrompt("");
      onTasksCreated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create tasks");
    } finally {
      setIsApproving(false);
    }
  };

  const toggleApproved = (index: number) => {
    setApprovedIndexes((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
        setRejectedIndexes((r) => {
          const rn = new Set(r);
          rn.delete(index);
          return rn;
        });
      }
      return next;
    });
  };

  const toggleRejected = (index: number) => {
    setRejectedIndexes((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
        setApprovedIndexes((a) => {
          const an = new Set(a);
          an.delete(index);
          return an;
        });
      }
      return next;
    });
  };

  const saveEdit = (updated: AIProposedTask) => {
    if (!proposal || editingTask === null) return;
    const newTasks = [...proposal.tasks];
    newTasks[editingTask._index] = updated;
    setProposal({ ...proposal, tasks: newTasks });
    setEditingTask(null);
  };

  const priorityColors: Record<string, string> = {
    HIGH: "text-rose-400 bg-rose-500/10 border-rose-500/20",
    MEDIUM: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    LOW: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  };

  const approvedCount = [...approvedIndexes].filter(
    (i) => !rejectedIndexes.has(i)
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 border border-violet-500/20 shrink-0">
          <Sparkles className="h-5 w-5 text-violet-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">AI Task Planner</h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Describe your goal in plain language. AI will generate a structured task plan for your review.
          </p>
        </div>
      </div>

      {/* Prompt Input */}
      <div className="space-y-3">
        <textarea
          id="ai-planner-prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Example: Prepare our website launch for Friday. Rahul should handle the frontend, and I will manage the backend API."
          rows={4}
          disabled={isAnalyzing}
          className="w-full resize-none rounded-xl border border-zinc-700/60 bg-zinc-900/60 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/20 disabled:opacity-50 transition-colors"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              handleAnalyze();
            }
          }}
        />

        <div className="flex items-center justify-between">
          <span className="text-[11px] text-zinc-500">
            Press ⌘+Enter to analyze
          </span>
          <button
            type="button"
            id="ai-planner-analyze-btn"
            onClick={handleAnalyze}
            disabled={!prompt.trim() || isAnalyzing}
            className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isAnalyzing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            {isAnalyzing ? "Analyzing..." : "Analyze with AI"}
          </button>
        </div>

        {isAnalyzing && (
          <AILoadingState message="Generating task plan..." className="mt-2" />
        )}
        {error && (
          <AIErrorBanner message={error} onDismiss={() => setError(null)} />
        )}
      </div>

      {/* Proposal Review */}
      {proposal && proposal.tasks.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-t border-zinc-800/60 pt-4">
            <div>
              <h3 className="text-sm font-semibold text-white">
                AI Proposal — {proposal.tasks.length} task(s) generated
              </h3>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                Review, edit, or reject individual tasks before creating them.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setApprovedIndexes(
                    new Set(proposal.tasks.map((_, i) => i))
                  )
                }
                className="text-[11px] text-violet-400 hover:text-violet-300 transition-colors"
              >
                Select all
              </button>
              <button
                type="button"
                onClick={() => setApprovedIndexes(new Set())}
                className="text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                Deselect all
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {proposal.tasks.map((task, index) => {
              const isApproved = approvedIndexes.has(index);
              const isRejected = rejectedIndexes.has(index);
              const isExpanded = expandedIndex === index;

              return (
                <div
                  key={index}
                  className={`rounded-xl border transition-all ${
                    isRejected
                      ? "border-zinc-800/40 bg-zinc-900/20 opacity-40"
                      : isApproved
                      ? "border-violet-500/20 bg-violet-500/5"
                      : "border-zinc-800/60 bg-zinc-900/40"
                  }`}
                >
                  <div className="flex items-center gap-3 p-3">
                    {/* Approve checkbox */}
                    <button
                      type="button"
                      onClick={() =>
                        isRejected ? toggleRejected(index) : toggleApproved(index)
                      }
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
                        isApproved && !isRejected
                          ? "border-violet-500 bg-violet-600 text-white"
                          : "border-zinc-700 bg-zinc-900"
                      }`}
                    >
                      {isApproved && !isRejected && <Check className="h-3 w-3" />}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-white truncate">
                          {task.title}
                        </span>
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                            priorityColors[task.priority] || priorityColors.MEDIUM
                          }`}
                        >
                          {task.priority}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        {task.suggestedAssigneeName && (
                          <span className="flex items-center gap-1 text-[11px] text-zinc-400">
                            <UserIcon className="h-3 w-3" />
                            {task.suggestedAssigneeName}
                          </span>
                        )}
                        {task.suggestedDueDate && (
                          <span className="flex items-center gap-1 text-[11px] text-zinc-400">
                            <Calendar className="h-3 w-3" />
                            {task.suggestedDueDate}
                          </span>
                        )}
                        {task.subtasks && task.subtasks.length > 0 && (
                          <span className="flex items-center gap-1 text-[11px] text-zinc-500">
                            <Plus className="h-3 w-3" />
                            {task.subtasks.length} subtask(s)
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          setEditingTask({ ...task, _index: index })
                        }
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                        title="Edit task"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleRejected(index)}
                        className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
                          isRejected
                            ? "text-rose-400 bg-rose-500/10"
                            : "text-zinc-500 hover:text-rose-400 hover:bg-zinc-800"
                        }`}
                        title={isRejected ? "Undo reject" : "Reject task"}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedIndex(isExpanded ? null : index)
                        }
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="border-t border-zinc-800/40 px-3 pb-3 pt-2 space-y-2">
                      {task.description && (
                        <p className="text-xs text-zinc-400">{task.description}</p>
                      )}
                      {task.subtasks && task.subtasks.length > 0 && (
                        <div>
                          <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wide mb-1">
                            Subtasks
                          </p>
                          <ul className="space-y-1">
                            {task.subtasks.map((st, si) => (
                              <li
                                key={si}
                                className="flex items-center gap-2 text-xs text-zinc-400"
                              >
                                <div className="h-1 w-1 rounded-full bg-zinc-600 shrink-0" />
                                {st}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-between rounded-xl border border-zinc-800/60 bg-zinc-900/60 px-4 py-3">
            <div className="text-xs text-zinc-400">
              {approvedCount} of {proposal.tasks.length} task(s) selected
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setProposal(null)}
                className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
              >
                Discard
              </button>
              <button
                type="button"
                id="ai-planner-approve-btn"
                onClick={handleApproveAll}
                disabled={isApproving || approvedCount === 0}
                className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-1.5 text-xs font-semibold text-white transition-all hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isApproving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Check className="h-3.5 w-3.5" />
                )}
                {isApproving
                  ? "Creating..."
                  : `Create ${approvedCount} Task${approvedCount !== 1 ? "s" : ""}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingTask !== null && (
        <TaskEditOverlay
          task={editingTask}
          onSave={saveEdit}
          onClose={() => setEditingTask(null)}
        />
      )}
    </div>
  );
}

// ─── Inline Edit Overlay ─────────────────────────────────────────────────────

interface TaskEditOverlayProps {
  task: EditingTask;
  onSave: (updated: AIProposedTask) => void;
  onClose: () => void;
}

function TaskEditOverlay({ task, onSave, onClose }: TaskEditOverlayProps) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [priority, setPriority] = useState(task.priority);
  const [dueDate, setDueDate] = useState(task.suggestedDueDate || "");
  const [assigneeName, setAssigneeName] = useState(
    task.suggestedAssigneeName || ""
  );

  const handleSave = () => {
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      description: description.trim() || null,
      priority,
      suggestedDueDate: dueDate || null,
      suggestedAssigneeName: assigneeName.trim() || null,
      subtasks: task.subtasks || [],
    });
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-zinc-700 bg-zinc-900 p-5 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white">Edit Task</h3>
          <button type="button" onClick={onClose} className="text-zinc-500 hover:text-zinc-300">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-[11px] font-medium text-zinc-400 uppercase tracking-wide">
              Title
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-violet-500/50 focus:outline-none"
              placeholder="Task title"
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-zinc-400 uppercase tracking-wide">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="mt-1 w-full resize-none rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-violet-500/50 focus:outline-none"
              placeholder="Optional description"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-medium text-zinc-400 uppercase tracking-wide">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as "LOW" | "MEDIUM" | "HIGH")}
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:outline-none"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-medium text-zinc-400 uppercase tracking-wide">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-medium text-zinc-400 uppercase tracking-wide">
              Assignee Name
            </label>
            <input
              value={assigneeName}
              onChange={(e) => setAssigneeName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-violet-500/50 focus:outline-none"
              placeholder="Team member name (optional)"
            />
          </div>
        </div>

        <div className="mt-4 flex gap-2 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-200"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!title.trim()}
            className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-500 disabled:opacity-40"
          >
            <Check className="h-3.5 w-3.5" />
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
