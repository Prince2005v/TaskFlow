/**
 * Zod schemas for all AI-generated structured outputs.
 * Every AI response is validated against these schemas before use.
 * Invalid responses are rejected — never reach the database.
 */
import { z } from "zod";

// ─── Priority enum ───────────────────────────────────────────────────────────
export const AIPrioritySchema = z.enum(["LOW", "MEDIUM", "HIGH"]);

// ─── AI Task Planner ─────────────────────────────────────────────────────────
export const AIProposedTaskSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(2000).nullable().optional(),
  priority: AIPrioritySchema,
  suggestedDueDate: z.string().nullable().optional(), // ISO date string or null
  suggestedAssigneeName: z.string().nullable().optional(),
  subtasks: z.array(z.string().min(1).max(255)).max(10).optional().default([]),
});

export const AIPlannerResponseSchema = z.object({
  tasks: z.array(AIProposedTaskSchema).min(1).max(20),
});

export type AIProposedTask = z.infer<typeof AIProposedTaskSchema>;
export type AIPlannerResponse = z.infer<typeof AIPlannerResponseSchema>;

// ─── AI Task Breakdown ───────────────────────────────────────────────────────
export const AISubtaskSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(1000).nullable().optional(),
});

export const AIBreakdownResponseSchema = z.object({
  subtasks: z.array(AISubtaskSchema).min(1).max(15),
  reasoning: z.string().max(500).optional(),
});

export type AISubtask = z.infer<typeof AISubtaskSchema>;
export type AIBreakdownResponse = z.infer<typeof AIBreakdownResponseSchema>;

// ─── AI Priority Recommendation ──────────────────────────────────────────────
export const AIPriorityResponseSchema = z.object({
  recommendedPriority: AIPrioritySchema,
  currentPriority: AIPrioritySchema,
  reason: z.string().min(10).max(500),
  confidence: z.enum(["LOW", "MEDIUM", "HIGH"]),
});

export type AIPriorityResponse = z.infer<typeof AIPriorityResponseSchema>;

// ─── AI Due Date Recommendation ──────────────────────────────────────────────
export const AIDeadlineResponseSchema = z.object({
  suggestedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
  reason: z.string().min(10).max(500),
  confidence: z.enum(["LOW", "MEDIUM", "HIGH"]),
  estimatedEffortDays: z.number().int().positive().optional(),
});

export type AIDeadlineResponse = z.infer<typeof AIDeadlineResponseSchema>;

// ─── AI Task Summary ─────────────────────────────────────────────────────────
export const AITaskSummarySchema = z.object({
  summary: z.string().min(10).max(1000),
  currentStatus: z.string().max(200),
  importantDecisions: z.array(z.string().max(300)).max(5).optional().default([]),
  blockers: z.array(z.string().max(300)).max(5).optional().default([]),
  nextAction: z.string().max(300),
});

export type AITaskSummary = z.infer<typeof AITaskSummarySchema>;

// ─── AI Team Insights ────────────────────────────────────────────────────────
export const AIInsightSchema = z.object({
  type: z.enum(["warning", "info", "success", "bottleneck"]),
  title: z.string().min(3).max(200),
  detail: z.string().min(10).max(500),
  metric: z.string().max(100).optional(),
});

export const AIInsightsResponseSchema = z.object({
  insights: z.array(AIInsightSchema).min(1).max(15),
  generatedAt: z.string().optional(),
});

export type AIInsight = z.infer<typeof AIInsightSchema>;
export type AIInsightsResponse = z.infer<typeof AIInsightsResponseSchema>;

// ─── AI Weekly Report ────────────────────────────────────────────────────────
export const AIWeeklyReportSchema = z.object({
  weekRange: z.string().max(100),
  completedThisWeek: z.array(z.string().max(300)).max(50),
  pendingWork: z.array(z.string().max(300)).max(30),
  overdueWork: z.array(z.string().max(300)).max(20),
  teamPerformance: z.string().min(10).max(600),
  potentialBlockers: z.array(z.string().max(300)).max(10),
  recommendedPriorities: z.array(z.string().max(300)).max(10),
  healthScore: z.number().int().min(0).max(100),
});

export type AIWeeklyReport = z.infer<typeof AIWeeklyReportSchema>;

// ─── AI Chat ─────────────────────────────────────────────────────────────────
export const AIChatResponseSchema = z.object({
  answer: z.string().min(1).max(3000),
  dataPoints: z.array(z.string().max(200)).max(20).optional().default([]),
});

export type AIChatResponse = z.infer<typeof AIChatResponseSchema>;
