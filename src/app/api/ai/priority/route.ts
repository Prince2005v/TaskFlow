/**
 * POST /api/ai/priority
 *
 * Analyzes a task and recommends a priority level.
 * Does NOT modify priority — returns recommendation for user approval.
 */
import { NextResponse } from "next/server";
import { getAuthUserWithWorkspace } from "@/lib/workspace-helpers";
import { generateAIContent, parseAIJson } from "@/lib/ai-client";
import { get_task_details, get_team_members } from "@/lib/ai-tools";
import { AIPriorityResponseSchema, type AIPriorityResponse } from "@/lib/ai-schemas";

export async function POST(request: Request) {
  try {
    const auth = await getAuthUserWithWorkspace();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { workspace } = auth;

    const body = await request.json().catch(() => null);
    if (!body?.taskId || typeof body.taskId !== "string") {
      return NextResponse.json({ error: "taskId is required" }, { status: 400 });
    }

    const [task, teamMembers] = await Promise.all([
      get_task_details(body.taskId, workspace.id),
      get_team_members(workspace.id),
    ]);

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    // Calculate team workload for context
    const assigneeMember = task.assigneeName
      ? teamMembers.find((m) =>
          m.name?.toLowerCase() === task.assigneeName?.toLowerCase()
        )
      : null;

    const assigneeWorkload = assigneeMember
      ? `Assignee (${assigneeMember.name}) has ${assigneeMember.assignedTaskCount} assigned tasks, ${assigneeMember.overdueTaskCount} overdue.`
      : "No assignee";

    let dueDateContext = "No due date set";
    if (task.dueDate) {
      const dueDate = new Date(task.dueDate);
      const daysUntilDue = Math.ceil(
        (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysUntilDue < 0) {
        dueDateContext = `OVERDUE by ${Math.abs(daysUntilDue)} day(s)`;
      } else if (daysUntilDue === 0) {
        dueDateContext = "Due TODAY";
      } else {
        dueDateContext = `Due in ${daysUntilDue} day(s)`;
      }
    }

    const aiPrompt = `You are a project management expert analyzing task priority.
Today's date: ${todayStr}

Task details:
- Title: "${task.title}"
- Description: ${task.description || "None"}
- Current priority: ${task.priority}
- Status: ${task.status}
- Due date: ${dueDateContext}
- Assignee workload: ${assigneeWorkload}
- Activity history: ${task.activitySummary.slice(0, 5).join("; ") || "None"}

Analyze and recommend the appropriate priority.
Return ONLY valid JSON (no markdown, no explanation):
{
  "recommendedPriority": "LOW" | "MEDIUM" | "HIGH",
  "currentPriority": "${task.priority}",
  "reason": "clear business-friendly explanation (max 250 chars)",
  "confidence": "LOW" | "MEDIUM" | "HIGH"
}

Be conservative — only suggest HIGH if there is clear urgency.`;

    const rawText = await generateAIContent(aiPrompt);
    const parsed = parseAIJson<AIPriorityResponse>(rawText);
    const validated = AIPriorityResponseSchema.parse(parsed);

    return NextResponse.json({ recommendation: validated });
  } catch (error) {
    console.error("[AI Priority] Error:", error);
    return NextResponse.json(
      { error: "AI priority analysis failed. Please try again." },
      { status: 500 }
    );
  }
}
