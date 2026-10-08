"use client";

import { useState } from "react";
import {
  Sparkles,
  Loader2,
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  Zap,
  Target,
  RefreshCw,
} from "lucide-react";
import type { AIWeeklyReport } from "@/lib/ai-schemas";
import { AILoadingState, AIErrorBanner } from "./ai-loading-state";

export function AIWeeklyReportView() {
  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState<AIWeeklyReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/ai/report");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate report");
      setReport(data.report);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate report");
    } finally {
      setIsLoading(false);
    }
  };

  const getHealthColor = (score: number) => {
    if (score >= 75) return "text-emerald-400";
    if (score >= 50) return "text-amber-400";
    return "text-rose-400";
  };

  const getHealthLabel = (score: number) => {
    if (score >= 75) return "Healthy";
    if (score >= 50) return "Moderate";
    return "Needs Attention";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 border border-violet-500/20 shrink-0">
            <FileText className="h-5 w-5 text-violet-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">AI Weekly Report</h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              AI-generated team productivity report based on your workspace data.
            </p>
          </div>
        </div>

        <button
          type="button"
          id="ai-report-generate-btn"
          onClick={handleGenerate}
          disabled={isLoading}
          className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-violet-500 disabled:opacity-40"
        >
          {isLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : report ? (
            <RefreshCw className="h-3.5 w-3.5" />
          ) : (
            <Sparkles className="h-3.5 w-3.5" />
          )}
          {isLoading ? "Generating..." : report ? "Regenerate" : "Generate Report"}
        </button>
      </div>

      {isLoading && (
        <div className="rounded-xl border border-violet-500/10 bg-violet-500/5 p-6 flex items-center justify-center">
          <AILoadingState message="Analyzing workspace data and generating weekly report..." />
        </div>
      )}

      {error && <AIErrorBanner message={error} onDismiss={() => setError(null)} />}

      {/* Report Content */}
      {report && !isLoading && (
        <div className="space-y-4">
          {/* Week Header */}
          <div className="flex items-center justify-between rounded-xl border border-violet-500/20 bg-violet-500/5 px-4 py-3">
            <div>
              <div className="text-[11px] text-zinc-500 uppercase tracking-wide font-medium">
                Report Period
              </div>
              <div className="text-sm font-semibold text-white mt-0.5">
                {report.weekRange}
              </div>
            </div>
            <div className="text-center">
              <div
                className={`text-2xl font-extrabold ${getHealthColor(report.healthScore)}`}
              >
                {report.healthScore}
              </div>
              <div className="text-[11px] text-zinc-500 mt-0.5">
                {getHealthLabel(report.healthScore)}
              </div>
            </div>
          </div>

          {/* 2-column grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Completed */}
            <ReportSection
              icon={<CheckCircle2 className="h-4 w-4 text-emerald-400" />}
              title="Completed This Week"
              items={report.completedThisWeek}
              emptyMessage="No tasks completed this week"
              itemColor="text-zinc-300"
              dotColor="bg-emerald-400"
            />

            {/* Pending */}
            <ReportSection
              icon={<Clock className="h-4 w-4 text-blue-400" />}
              title="Pending Work"
              items={report.pendingWork}
              emptyMessage="No pending items"
              itemColor="text-zinc-300"
              dotColor="bg-blue-400"
            />

            {/* Overdue */}
            <ReportSection
              icon={<AlertTriangle className="h-4 w-4 text-amber-400" />}
              title="Overdue Work"
              items={report.overdueWork}
              emptyMessage="No overdue tasks — great!"
              itemColor="text-amber-300"
              dotColor="bg-amber-400"
            />

            {/* Blockers */}
            <ReportSection
              icon={<Zap className="h-4 w-4 text-rose-400" />}
              title="Potential Blockers"
              items={report.potentialBlockers}
              emptyMessage="No blockers identified"
              itemColor="text-zinc-300"
              dotColor="bg-rose-400"
            />
          </div>

          {/* Team Performance */}
          <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-violet-400" />
              <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wide">
                Team Performance
              </span>
            </div>
            <p className="text-sm text-zinc-300 leading-relaxed">
              {report.teamPerformance}
            </p>
          </div>

          {/* Recommended Priorities */}
          {report.recommendedPriorities.length > 0 && (
            <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Target className="h-4 w-4 text-violet-400" />
                <span className="text-xs font-semibold text-violet-300 uppercase tracking-wide">
                  Recommended Priorities for Next Week
                </span>
              </div>
              <ul className="space-y-1.5">
                {report.recommendedPriorities.map((item, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-xs text-zinc-300"
                  >
                    <span className="shrink-0 text-violet-400 font-bold">
                      {i + 1}.
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!report && !isLoading && !error && (
        <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/30 p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 border border-violet-500/20 mb-4">
            <FileText className="h-6 w-6 text-violet-400" />
          </div>
          <h3 className="text-sm font-semibold text-white mb-1">
            Weekly Team Report
          </h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            Click "Generate Report" to create an AI-powered summary of this week's
            productivity, completed tasks, overdue work, and team performance.
          </p>
        </div>
      )}
    </div>
  );
}

interface ReportSectionProps {
  icon: React.ReactNode;
  title: string;
  items: string[];
  emptyMessage: string;
  itemColor: string;
  dotColor: string;
}

function ReportSection({
  icon,
  title,
  items,
  emptyMessage,
  itemColor,
  dotColor,
}: ReportSectionProps) {
  return (
    <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-3.5">
      <div className="flex items-center gap-2 mb-2.5">
        {icon}
        <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wide">
          {title}
        </span>
        {items.length > 0 && (
          <span className="ml-auto rounded-full bg-zinc-800 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-400">
            {items.length}
          </span>
        )}
      </div>

      {items.length > 0 ? (
        <ul className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
          {items.map((item, i) => (
            <li key={i} className={`flex items-start gap-2 text-xs ${itemColor}`}>
              <div
                className={`h-1.5 w-1.5 rounded-full ${dotColor} mt-1 shrink-0`}
              />
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[11px] text-zinc-600 italic">{emptyMessage}</p>
      )}
    </div>
  );
}
