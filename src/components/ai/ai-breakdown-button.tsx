"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Sparkles, Check, X, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import type { AIBreakdownResponse, AISubtask } from "@/lib/ai-schemas";
import { AILoadingState, AIErrorBanner, AIBadge } from "./ai-loading-state";

interface AIBreakdownButtonProps {
  taskId: string;
  taskTitle: string;
  onSubtasksCreated: () => void;
}

export function AIBreakdownButton({
  taskId,
  taskTitle,
  onSubtasksCreated,
}: AIBreakdownButtonProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [breakdown, setBreakdown] = useState<AIBreakdownResponse | null>(null);
  const [selectedIndexes, setSelectedIndexes] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setBreakdown(null);
    setError(null);

    try {
      const res = await fetch("/api/ai/breakdown", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI breakdown failed");

      setBreakdown(data.breakdown);
      setSelectedIndexes(new Set(data.breakdown.subtasks.map((_: unknown, i: number) => i)));
      setIsExpanded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI breakdown failed");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApprove = async () => {
    if (!breakdown) return;
    const selected = breakdown.subtasks.filter((_, i) => selectedIndexes.has(i));
    if (selected.length === 0) {
      toast.error("Select at least one subtask");
      return;
    }

    setIsApproving(true);
    try {
      const res = await fetch("/api/ai/breakdown/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, subtasks: selected }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create subtasks");

      toast.success(`✓ ${data.count} subtask(s) created`);
      setBreakdown(null);
      setIsExpanded(false);
      onSubtasksCreated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create subtasks");
    } finally {
      setIsApproving(false);
    }
  };

  const toggleSelected = (index: number) => {
    setSelectedIndexes((prev) => {
      const next = new Set(prev);
      next.has(index) ? next.delete(index) : next.add(index);
      return next;
    });
  };

  return (
    <div className="space-y-3">
      {/* Trigger Button */}
      <button
        type="button"
        id="ai-breakdown-btn"
        onClick={breakdown ? () => setIsExpanded(!isExpanded) : handleAnalyze}
        disabled={isAnalyzing}
        className="flex items-center gap-2 rounded-xl border border-violet-500/20 bg-violet-500/5 px-3 py-2 text-xs font-semibold text-violet-400 transition-all hover:border-violet-500/40 hover:bg-violet-500/10 disabled:opacity-50"
      >
        {isAnalyzing ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Sparkles className="h-3.5 w-3.5" />
        )}
        {isAnalyzing
          ? "Breaking down..."
          : breakdown
          ? isExpanded
            ? "Hide breakdown"
            : "Show AI breakdown"
          : "Break down with AI"}
        {!isAnalyzing && breakdown && (
          isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
        )}
      </button>

      {isAnalyzing && (
        <AILoadingState message="Generating subtasks..." />
      )}
      {error && (
        <AIErrorBanner message={error} onDismiss={() => setError(null)} />
      )}

      {/* Breakdown Results */}
      {breakdown && isExpanded && (
        <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-3 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AIBadge label="Suggested Subtasks" />
              <span className="text-[11px] text-zinc-500">
                {breakdown.subtasks.length} subtask(s)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setSelectedIndexes(new Set(breakdown.subtasks.map((_, i) => i)))
                }
                className="text-[11px] text-violet-400 hover:text-violet-300"
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setSelectedIndexes(new Set())}
                className="text-[11px] text-zinc-500 hover:text-zinc-300"
              >
                None
              </button>
            </div>
          </div>

          {breakdown.reasoning && (
            <p className="text-[11px] text-zinc-500 italic">
              {breakdown.reasoning}
            </p>
          )}

          <div className="space-y-1.5">
            {breakdown.subtasks.map((subtask: AISubtask, index: number) => {
              const isSelected = selectedIndexes.has(index);
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => toggleSelected(index)}
                  className={`flex w-full items-start gap-2.5 rounded-lg p-2.5 text-left transition-colors ${
                    isSelected
                      ? "bg-violet-500/10 border border-violet-500/20"
                      : "bg-zinc-900/40 border border-zinc-800/40 opacity-60"
                  }`}
                >
                  <div
                    className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                      isSelected
                        ? "border-violet-500 bg-violet-600 text-white"
                        : "border-zinc-700 bg-zinc-900"
                    }`}
                  >
                    {isSelected && <Check className="h-2.5 w-2.5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-medium text-zinc-100">
                      {subtask.title}
                    </span>
                    {subtask.description && (
                      <p className="text-[11px] text-zinc-500 mt-0.5">
                        {subtask.description}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-zinc-500">
              {selectedIndexes.size} selected
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setBreakdown(null);
                  setIsExpanded(false);
                }}
                className="rounded-lg border border-zinc-700 px-2.5 py-1 text-xs text-zinc-400 hover:text-zinc-200"
              >
                Discard
              </button>
              <button
                type="button"
                id="ai-breakdown-approve-btn"
                onClick={handleApprove}
                disabled={isApproving || selectedIndexes.size === 0}
                className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-3 py-1 text-xs font-semibold text-white hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isApproving ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Check className="h-3 w-3" />
                )}
                {isApproving ? "Creating..." : `Add ${selectedIndexes.size} Subtask(s)`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
