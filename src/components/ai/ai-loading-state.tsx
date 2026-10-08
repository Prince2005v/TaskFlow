"use client";

import { Loader2, Sparkles } from "lucide-react";

interface AILoadingStateProps {
  message?: string;
  className?: string;
}

export function AILoadingState({
  message = "Analyzing with AI...",
  className = "",
}: AILoadingStateProps) {
  return (
    <div
      className={`flex items-center gap-2.5 text-sm text-violet-400 ${className}`}
    >
      <div className="relative">
        <Sparkles className="h-4 w-4 text-violet-400 animate-pulse" />
      </div>
      <Loader2 className="h-3.5 w-3.5 animate-spin text-violet-400" />
      <span className="font-medium">{message}</span>
    </div>
  );
}

interface AIErrorBannerProps {
  message: string;
  onDismiss?: () => void;
}

export function AIErrorBanner({ message, onDismiss }: AIErrorBannerProps) {
  return (
    <div className="flex items-start justify-between gap-2 rounded-lg border border-rose-500/20 bg-rose-500/5 px-3 py-2.5 text-xs text-rose-400">
      <span>{message}</span>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 text-rose-500 hover:text-rose-300 transition-colors"
        >
          ✕
        </button>
      )}
    </div>
  );
}

interface AIBadgeProps {
  label?: string;
}

export function AIBadge({ label = "AI" }: AIBadgeProps) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 text-[10px] font-semibold text-violet-400 uppercase tracking-wide">
      <Sparkles className="h-2.5 w-2.5" />
      {label}
    </span>
  );
}
