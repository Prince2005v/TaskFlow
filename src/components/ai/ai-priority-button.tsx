"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Sparkles, Check, Loader2, TrendingUp } from "lucide-react";
import type { AIPriorityResponse } from "@/lib/ai-schemas";
import { AILoadingState, AIErrorBanner, AIBadge } from "./ai-loading-state";

interface AIPriorityButtonProps {
  taskId: string;
  currentPriority: string;
  onApplyPriority: (priority: "LOW" | "MEDIUM" | "HIGH") => Promise<void>;
}

const priorityColors: Record<string, string> = {
  HIGH: "text-rose-400 bg-rose-500/10 border-rose-500/20",
  MEDIUM: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  LOW: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
};

const confidenceLabel: Record<string, string> = {
  HIGH: "High confidence",
  MEDIUM: "Moderate confidence",
  LOW: "Low confidence",
};

export function AIPriorityButton({
  taskId,
  currentPriority,
  onApplyPriority,
}: AIPriorityButtonProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [recommendation, setRecommendation] = useState<AIPriorityResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setRecommendation(null);
    setError(null);

    try {
      const res = await fetch("/api/ai/priority", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI analysis failed");
      setRecommendation(data.recommendation);
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI analysis failed");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApply = async () => {
    if (!recommendation) return;
    setIsApplying(true);
    try {
      await onApplyPriority(recommendation.recommendedPriority);
      toast.success(`Priority updated to ${recommendation.recommendedPriority}`);
      setRecommendation(null);
    } catch {
      toast.error("Failed to apply priority");
    } finally {
      setIsApplying(false);
    }
  };

  const isSamePriority =
    recommendation?.recommendedPriority === recommendation?.currentPriority;

  return (
    <div className="space-y-2">
      <button
        type="button"
        id="ai-priority-btn"
        onClick={handleAnalyze}
        disabled={isAnalyzing}
        className="flex items-center gap-2 rounded-xl border border-violet-500/20 bg-violet-500/5 px-3 py-2 text-xs font-semibold text-violet-400 transition-all hover:border-violet-500/40 hover:bg-violet-500/10 disabled:opacity-50"
      >
        {isAnalyzing ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <TrendingUp className="h-3.5 w-3.5" />
        )}
        {isAnalyzing ? "Analyzing..." : "Analyze priority"}
      </button>

      {isAnalyzing && <AILoadingState message="Analyzing priority..." />}
      {error && <AIErrorBanner message={error} onDismiss={() => setError(null)} />}

      {recommendation && (
        <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-3 space-y-2.5">
          <div className="flex items-center gap-2">
            <AIBadge label="Priority Analysis" />
            <span className="text-[11px] text-zinc-500">
              {confidenceLabel[recommendation.confidence]}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-[11px] text-zinc-500">Recommended:</div>
            <span
              className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${
                priorityColors[recommendation.recommendedPriority]
              }`}
            >
              {recommendation.recommendedPriority}
            </span>
            {isSamePriority && (
              <span className="text-[11px] text-zinc-500 italic">
                (same as current)
              </span>
            )}
          </div>

          <p className="text-xs text-zinc-400 leading-relaxed">
            {recommendation.reason}
          </p>

          {!isSamePriority && (
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setRecommendation(null)}
                className="rounded-lg border border-zinc-700 px-2.5 py-1 text-xs text-zinc-400 hover:text-zinc-200"
              >
                Dismiss
              </button>
              <button
                type="button"
                id="ai-priority-apply-btn"
                onClick={handleApply}
                disabled={isApplying}
                className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-3 py-1 text-xs font-semibold text-white hover:bg-violet-500 disabled:opacity-40"
              >
                {isApplying ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Check className="h-3 w-3" />
                )}
                Apply {recommendation.recommendedPriority}
              </button>
            </div>
          )}
          {isSamePriority && (
            <button
              type="button"
              onClick={() => setRecommendation(null)}
              className="rounded-lg border border-zinc-700 px-2.5 py-1 text-xs text-zinc-400 hover:text-zinc-200"
            >
              Dismiss
            </button>
          )}
        </div>
      )}
    </div>
  );
}
