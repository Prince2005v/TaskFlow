"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Sparkles, Check, Loader2, Calendar } from "lucide-react";
import type { AIDeadlineResponse } from "@/lib/ai-schemas";
import { AILoadingState, AIErrorBanner, AIBadge } from "./ai-loading-state";

interface AIDeadlineButtonProps {
  taskId: string;
  onApplyDeadline: (date: string) => Promise<void>;
}

const confidenceColors: Record<string, string> = {
  HIGH: "text-emerald-400",
  MEDIUM: "text-amber-400",
  LOW: "text-zinc-400",
};

export function AIDeadlineButton({
  taskId,
  onApplyDeadline,
}: AIDeadlineButtonProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [suggestion, setSuggestion] = useState<AIDeadlineResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setSuggestion(null);
    setError(null);

    try {
      const res = await fetch("/api/ai/deadline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI analysis failed");
      setSuggestion(data.suggestion);
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI deadline suggestion failed");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApply = async () => {
    if (!suggestion) return;
    setIsApplying(true);
    try {
      await onApplyDeadline(suggestion.suggestedDate);
      toast.success(`Deadline set to ${suggestion.suggestedDate}`);
      setSuggestion(null);
    } catch {
      toast.error("Failed to apply deadline");
    } finally {
      setIsApplying(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        id="ai-deadline-btn"
        onClick={handleAnalyze}
        disabled={isAnalyzing}
        className="flex items-center gap-2 rounded-xl border border-violet-500/20 bg-violet-500/5 px-3 py-2 text-xs font-semibold text-violet-400 transition-all hover:border-violet-500/40 hover:bg-violet-500/10 disabled:opacity-50"
      >
        {isAnalyzing ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Calendar className="h-3.5 w-3.5" />
        )}
        {isAnalyzing ? "Estimating..." : "Suggest deadline"}
      </button>

      {isAnalyzing && <AILoadingState message="Estimating deadline..." />}
      {error && <AIErrorBanner message={error} onDismiss={() => setError(null)} />}

      {suggestion && (
        <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-3 space-y-2.5">
          <div className="flex items-center gap-2">
            <AIBadge label="Deadline Suggestion" />
            <span className={`text-[11px] font-medium ${confidenceColors[suggestion.confidence]}`}>
              {suggestion.confidence.toLowerCase()} confidence
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Calendar className="h-4 w-4 text-violet-400 shrink-0" />
            <div>
              <div className="text-sm font-semibold text-white">
                {formatDate(suggestion.suggestedDate)}
              </div>
              {suggestion.estimatedEffortDays && (
                <div className="text-[11px] text-zinc-500">
                  ~{suggestion.estimatedEffortDays} day(s) of effort
                </div>
              )}
            </div>
          </div>

          <p className="text-xs text-zinc-400 leading-relaxed">{suggestion.reason}</p>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => setSuggestion(null)}
              className="rounded-lg border border-zinc-700 px-2.5 py-1 text-xs text-zinc-400 hover:text-zinc-200"
            >
              Dismiss
            </button>
            <button
              type="button"
              id="ai-deadline-apply-btn"
              onClick={handleApply}
              disabled={isApplying}
              className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-3 py-1 text-xs font-semibold text-white hover:bg-violet-500 disabled:opacity-40"
            >
              {isApplying ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Check className="h-3 w-3" />
              )}
              Apply Deadline
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
