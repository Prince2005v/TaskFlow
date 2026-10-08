/**
 * GET /api/ai/insights
 *
 * Generates AI team insights from real workspace data.
 * Every insight is grounded in actual database data — no invented statistics.
 */
import { NextResponse } from "next/server";
import { getAuthUserWithWorkspace } from "@/lib/workspace-helpers";
import { generateAIContent, parseAIJson } from "@/lib/ai-client";
import { get_tasks, get_team_members, get_team_metrics } from "@/lib/ai-tools";
import { AIInsightsResponseSchema, type AIInsightsResponse } from "@/lib/ai-schemas";

export async function GET() {
  try {
    const auth = await getAuthUserWithWorkspace();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { workspace } = auth;

    // Fetch all real workspace data
    const [tasks, teamMembers, metrics] = await Promise.all([
      get_tasks(workspace.id),
      get_team_members(workspace.id),
      get_team_metrics(workspace.id),
    ]);

    const today = new Date().toISOString().split("T")[0];

    // Build data summary for AI (structured, not raw data)
    const overdueTasks = tasks.filter(
      (t) =>
        t.dueDate &&
        t.status !== "COMPLETED" &&
        new Date(t.dueDate) < new Date()
    );

    const overdueByAssignee: Record<string, number> = {};
    for (const t of overdueTasks) {
      const name = t.assigneeName || "Unassigned";
      overdueByAssignee[name] = (overdueByAssignee[name] || 0) + 1;
    }

    const workloadSummary = teamMembers
      .map(
        (m) =>
          `${m.name || m.email}: ${m.assignedTaskCount} assigned, ${m.completedTaskCount} completed, ${m.overdueTaskCount} overdue`
      )
      .join("\n");

    const highPriorityPending = tasks.filter(
      (t) => t.priority === "HIGH" && t.status !== "COMPLETED"
    );

    const dataContext = `
WORKSPACE METRICS (real data):
- Total tasks: ${metrics.totalTasks}
- Completed: ${metrics.completedTasks}
- Pending: ${metrics.pendingTasks}
- In Progress: ${metrics.inProgressTasks}
- Overdue: ${metrics.overdueTasks}
- High priority tasks: ${metrics.highPriorityTasks}
- Created this week: ${metrics.tasksCreatedThisWeek}
- Completed this week: ${metrics.tasksCompletedThisWeek}
- Completed last week: ${metrics.tasksCompletedLastWeek}

TEAM WORKLOAD:
${workloadSummary || "No team members"}

OVERDUE BY ASSIGNEE:
${Object.entries(overdueByAssignee)
  .map(([name, count]) => `${name}: ${count} overdue task(s)`)
  .join("\n") || "No overdue tasks"}

HIGH PRIORITY PENDING TASKS (${highPriorityPending.length}):
${highPriorityPending
  .slice(0, 10)
  .map(
    (t) =>
      `- "${t.title}" assigned to ${t.assigneeName || "nobody"} (due: ${t.dueDate || "no date"})`
  )
  .join("\n") || "None"}
`;

    const aiPrompt = `You are a project management analyst generating team productivity insights.
Today's date: ${today}

${dataContext}

Based ONLY on the real data above (do not invent any numbers), generate 3–8 meaningful insights.
Each insight must reference actual data points.

Return ONLY valid JSON (no markdown, no explanation):
{
  "insights": [
    {
      "type": "warning" | "info" | "success" | "bottleneck",
      "title": "short insight title (max 80 chars)",
      "detail": "specific, data-driven detail (max 300 chars)",
      "metric": "key metric reference (max 80 chars, optional)"
    }
  ],
  "generatedAt": "${today}"
}

Rules:
- type "warning": overdue, risk, or concern
- type "bottleneck": blocking or workload imbalance
- type "success": positive trends
- type "info": neutral observations
- Every insight must cite a specific number from the data.
- Do NOT invent statistics not present in the data.`;

    const rawText = await generateAIContent(aiPrompt);
    const parsed = parseAIJson<AIInsightsResponse>(rawText);
    const validated = AIInsightsResponseSchema.parse(parsed);

    return NextResponse.json({
      insights: validated,
      metrics, // also return raw metrics for display
    });
  } catch (error) {
    console.error("[AI Insights] Error:", error);
    return NextResponse.json(
      { error: "AI insights generation failed. Please try again." },
      { status: 500 }
    );
  }
}
