"use client";

import { useState } from "react";
import { Sparkles, Loader2, ChevronDown, ChevronUp, AlertTriangle, ArrowRight } from "lucide-react";
import type { AITaskSummary } from "@/lib/ai-schemas";
import { AILoadingState, AIErrorBanner, AIBadge } from "./ai-loading-state";

interface AISummaryButtonProps {
  taskId: string;
}

export function AISummaryButton({ taskId }: AISummaryButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState<AITaskSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleGenerate = async () => {
    if (summary) {
      setIsExpanded(!isExpanded);
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/ai/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI summary failed");
      setSummary(data.summary);
      setIsExpanded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI summary failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        id="ai-summary-btn"
        onClick={handleGenerate}
        disabled={isLoading}
        className="flex items-center gap-2 rounded-xl border border-violet-500/20 bg-violet-500/5 px-3 py-2 text-xs font-semibold text-violet-400 transition-all hover:border-violet-500/40 hover:bg-violet-500/10 disabled:opacity-50"
      >
        {isLoading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Sparkles className="h-3.5 w-3.5" />
        )}
        {isLoading
          ? "Summarizing..."
          : summary
          ? isExpanded
            ? "Hide summary"
            : "Show AI summary"
          : "Summarize"}
        {!isLoading && summary && (
          isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
        )}
      </button>

      {isLoading && <AILoadingState message="Generating summary..." />}
      {error && <AIErrorBanner message={error} onDismiss={() => setError(null)} />}

      {summary && isExpanded && (
        <div className="rounded-xl border border-violet-500/20 bg-zinc-900/40 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <AIBadge label="AI Summary" />
            <button
              type="button"
              onClick={() => {
                setSummary(null);
                setIsExpanded(false);
              }}
              className="text-[11px] text-zinc-500 hover:text-zinc-300"
            >
              Regenerate
            </button>
          </div>

          {/* Summary */}
          <div>
            <p className="text-sm text-zinc-200 leading-relaxed">{summary.summary}</p>
          </div>

          {/* Status */}
          <div className="rounded-lg bg-zinc-800/60 px-3 py-2">
            <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wide mb-1">
              Current Status
            </div>
            <p className="text-xs text-zinc-300">{summary.currentStatus}</p>
          </div>

          {/* Decisions */}
          {summary.importantDecisions && summary.importantDecisions.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wide mb-1.5">
                Important Decisions
              </div>
              <ul className="space-y-1">
                {summary.importantDecisions.map((d, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-zinc-400">
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-400 mt-1 shrink-0" />
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Blockers */}
          {summary.blockers && summary.blockers.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wide mb-1.5">
                Blockers
              </div>
              <ul className="space-y-1">
                {summary.blockers.map((b, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-amber-400">
                    <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Next Action */}
          <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 px-3 py-2">
            <div className="text-[11px] font-semibold text-violet-400 uppercase tracking-wide mb-1">
              Recommended Next Step
            </div>
            <div className="flex items-start gap-2 text-xs text-zinc-200">
              <ArrowRight className="h-3.5 w-3.5 text-violet-400 mt-0.5 shrink-0" />
              {summary.nextAction}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
