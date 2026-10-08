"use client";

import { useState } from "react";
import {
  Sparkles,
  Loader2,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Info,
  Zap,
  TrendingUp,
  TrendingDown,
  Users,
  BarChart3,
} from "lucide-react";
import type { AIInsightsResponse, AIInsight } from "@/lib/ai-schemas";
import { AILoadingState, AIErrorBanner } from "./ai-loading-state";

interface AIInsightsViewProps {
  workspaceName: string;
}

const insightIcons = {
  warning: AlertTriangle,
  bottleneck: Zap,
  success: CheckCircle2,
  info: Info,
};

const insightColors = {
  warning: {
    border: "border-amber-500/20",
    bg: "bg-amber-500/5",
    icon: "text-amber-400",
    title: "text-amber-300",
    badge: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  },
  bottleneck: {
    border: "border-rose-500/20",
    bg: "bg-rose-500/5",
    icon: "text-rose-400",
    title: "text-rose-300",
    badge: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  },
  success: {
    border: "border-emerald-500/20",
    bg: "bg-emerald-500/5",
    icon: "text-emerald-400",
    title: "text-emerald-300",
    badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  },
  info: {
    border: "border-blue-500/20",
    bg: "bg-blue-500/5",
    icon: "text-blue-400",
    title: "text-blue-300",
    badge: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  },
};

interface MetricsData {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  highPriorityTasks: number;
  tasksCreatedThisWeek: number;
  tasksCompletedThisWeek: number;
}

export function AIInsightsView({ workspaceName }: AIInsightsViewProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [insights, setInsights] = useState<AIInsightsResponse | null>(null);
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  const handleFetch = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/ai/insights");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate insights");
      setInsights(data.insights);
      setMetrics(data.metrics);
      setHasLoaded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate insights");
    } finally {
      setIsLoading(false);
    }
  };

  const completionRate =
    metrics && metrics.totalTasks > 0
      ? Math.round((metrics.completedTasks / metrics.totalTasks) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 border border-violet-500/20 shrink-0">
            <BarChart3 className="h-5 w-5 text-violet-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">AI Team Insights</h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              AI-generated insights from your real workspace data.
              Every insight is grounded in actual task data.
            </p>
          </div>
        </div>

        <button
          type="button"
          id="ai-insights-generate-btn"
          onClick={handleFetch}
          disabled={isLoading}
          className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-violet-500 disabled:opacity-40"
        >
          {isLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : hasLoaded ? (
            <RefreshCw className="h-3.5 w-3.5" />
          ) : (
            <Sparkles className="h-3.5 w-3.5" />
          )}
          {isLoading
            ? "Analyzing..."
            : hasLoaded
            ? "Refresh Insights"
            : "Generate Insights"}
        </button>
      </div>

      {isLoading && (
        <div className="rounded-xl border border-violet-500/10 bg-violet-500/5 p-6 flex items-center justify-center">
          <AILoadingState message="Analyzing workspace data and generating insights..." />
        </div>
      )}

      {error && <AIErrorBanner message={error} onDismiss={() => setError(null)} />}

      {/* Metrics Overview (shown after first load) */}
      {metrics && !isLoading && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MetricCard
            label="Total Tasks"
            value={metrics.totalTasks}
            icon={<BarChart3 className="h-4 w-4 text-zinc-400" />}
          />
          <MetricCard
            label="Completed"
            value={`${metrics.completedTasks} (${completionRate}%)`}
            icon={<CheckCircle2 className="h-4 w-4 text-emerald-400" />}
            positive
          />
          <MetricCard
            label="Overdue"
            value={metrics.overdueTasks}
            icon={<AlertTriangle className="h-4 w-4 text-amber-400" />}
            negative={metrics.overdueTasks > 0}
          />
          <MetricCard
            label="This Week"
            value={`+${metrics.tasksCompletedThisWeek} done`}
            icon={<TrendingUp className="h-4 w-4 text-blue-400" />}
            positive={metrics.tasksCompletedThisWeek > 0}
          />
        </div>
      )}

      {/* Insights */}
      {insights && !isLoading && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-violet-400" />
            <h3 className="text-sm font-semibold text-white">
              {insights.insights.length} insight(s) generated
            </h3>
            {insights.generatedAt && (
              <span className="text-[11px] text-zinc-500">
                as of {insights.generatedAt}
              </span>
            )}
          </div>

          <div className="space-y-2.5">
            {insights.insights.map((insight: AIInsight, i: number) => {
              const Icon = insightIcons[insight.type];
              const colors = insightColors[insight.type];

              return (
                <div
                  key={i}
                  className={`rounded-xl border p-4 ${colors.border} ${colors.bg}`}
                >
                  <div className="flex items-start gap-3">
                    <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${colors.icon}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-sm font-semibold ${colors.title}`}>
                          {insight.title}
                        </span>
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${colors.badge}`}
                        >
                          {insight.type}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                        {insight.detail}
                      </p>
                      {insight.metric && (
                        <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-zinc-500">
                          <BarChart3 className="h-3 w-3" />
                          {insight.metric}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!hasLoaded && !isLoading && !error && (
        <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/30 p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 border border-violet-500/20 mb-4">
            <Sparkles className="h-6 w-6 text-violet-400" />
          </div>
          <h3 className="text-sm font-semibold text-white mb-1">
            AI-Powered Team Insights
          </h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            Click &quot;Generate Insights&quot; to analyze your {workspaceName} workspace data
            and receive actionable insights about team productivity, overdue tasks,
            and workload distribution.
          </p>
        </div>
      )}
    </div>
  );
}

interface MetricCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  positive?: boolean;
  negative?: boolean;
}

function MetricCard({ label, value, icon, positive, negative }: MetricCardProps) {
  return (
    <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-3">
      <div className="flex items-center gap-2 mb-1.5">
        {icon}
        <span className="text-[11px] text-zinc-500 uppercase tracking-wide font-medium">
          {label}
        </span>
      </div>
      <div
        className={`text-base font-bold ${
          positive
            ? "text-emerald-400"
            : negative
            ? "text-amber-400"
            : "text-white"
        }`}
      >
        {value}
      </div>
    </div>
  );
}
