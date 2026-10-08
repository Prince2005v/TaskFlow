/**
 * GET /api/ai/report
 *
 * Generates a weekly team productivity report from real workspace data.
 * All statistics are grounded in actual database records.
 */
import { NextResponse } from "next/server";
import { getAuthUserWithWorkspace } from "@/lib/workspace-helpers";
import { generateAIContent, parseAIJson } from "@/lib/ai-client";
import {
  get_tasks,
  get_team_members,
  get_team_metrics,
  get_completed_tasks_since,
} from "@/lib/ai-tools";
import { AIWeeklyReportSchema, type AIWeeklyReport } from "@/lib/ai-schemas";

export async function GET() {
  try {
    const auth = await getAuthUserWithWorkspace();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { workspace } = auth;

    const [tasks, teamMembers, metrics, completedThisWeek] = await Promise.all([
      get_tasks(workspace.id),
      get_team_members(workspace.id),
      get_team_metrics(workspace.id),
      get_completed_tasks_since(workspace.id, 7),
    ]);

    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - 7);
    const weekStartStr = weekStart.toISOString().split("T")[0];

    const overdueTasks = tasks.filter(
      (t) =>
        t.dueDate && t.status !== "COMPLETED" && new Date(t.dueDate) < today
    );
    const pendingTasks = tasks.filter((t) => t.status !== "COMPLETED");
    const highPriorityPending = pendingTasks.filter(
      (t) => t.priority === "HIGH"
    );

    const workloadSummary = teamMembers
      .map(
        (m) =>
          `${m.name || m.email}: ${m.assignedTaskCount} total, ${m.completedTaskCount} completed, ${m.overdueTaskCount} overdue, ${m.pendingTaskCount} pending`
      )
      .join("\n");

    const completedList = completedThisWeek
      .slice(0, 20)
      .map(
        (t) =>
          `"${t.title}" (${t.priority}) - completed by ${t.assigneeName || "unassigned"}`
      )
      .join("\n");

    const overdueList = overdueTasks
      .slice(0, 15)
      .map(
        (t) =>
          `"${t.title}" (${t.priority}) - due ${t.dueDate} - assigned to ${t.assigneeName || "nobody"}`
      )
      .join("\n");

    const aiPrompt = `You are a project management analyst writing a weekly team report.
Week: ${weekStartStr} to ${todayStr}

REAL WORKSPACE DATA:
Workspace: ${workspace.name}

Metrics:
- Total tasks: ${metrics.totalTasks}
- Completed: ${metrics.completedTasks}
- Pending: ${metrics.pendingTasks}
- In Progress: ${metrics.inProgressTasks}
- Overdue: ${metrics.overdueTasks}
- High priority: ${metrics.highPriorityTasks}
- Created this week: ${metrics.tasksCreatedThisWeek}
- Completed this week: ${metrics.tasksCompletedThisWeek} (last week: ${metrics.tasksCompletedLastWeek})

Team workload:
${workloadSummary || "No team data"}

Completed this week (${completedThisWeek.length} tasks):
${completedList || "None"}

Overdue tasks (${overdueTasks.length}):
${overdueList || "None"}

High priority pending (${highPriorityPending.length} tasks):
${highPriorityPending
  .slice(0, 10)
  .map((t) => `"${t.title}" - ${t.assigneeName || "unassigned"} (due: ${t.dueDate || "no date"})`)
  .join("\n") || "None"}

Generate a concise, professional weekly report.
Return ONLY valid JSON (no markdown, no explanation):
{
  "weekRange": "${weekStartStr} to ${todayStr}",
  "completedThisWeek": ["task summary 1", ...] (max 20 items, each max 200 chars),
  "pendingWork": ["summary 1", ...] (top pending items, max 10, each max 200 chars),
  "overdueWork": ["summary 1", ...] (max 10, each max 200 chars),
  "teamPerformance": "2-3 sentence team performance assessment based on data (max 400 chars)",
  "potentialBlockers": ["blocker 1", ...] (max 8, each max 200 chars),
  "recommendedPriorities": ["priority 1", ...] (max 8, each max 200 chars),
  "healthScore": number between 0-100 (based on completion rate, overdue rate, etc.)
}

Base everything on the data above. Do not invent numbers.`;

    const rawText = await generateAIContent(aiPrompt);
    const parsed = parseAIJson<AIWeeklyReport>(rawText);
    const validated = AIWeeklyReportSchema.parse(parsed);

    return NextResponse.json({ report: validated, metrics });
  } catch (error) {
    console.error("[AI Report] Error:", error);
    return NextResponse.json(
      { error: "AI report generation failed. Please try again." },
      { status: 500 }
    );
  }
}
