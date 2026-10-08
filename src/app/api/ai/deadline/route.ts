/**
 * POST /api/ai/deadline
 *
 * Suggests a reasonable deadline for a task based on complexity and workload.
 * Does NOT modify due date — returns suggestion for user approval.
 */
import { NextResponse } from "next/server";
import { getAuthUserWithWorkspace } from "@/lib/workspace-helpers";
import { generateAIContent, parseAIJson } from "@/lib/ai-client";
import { get_task_details, get_team_members } from "@/lib/ai-tools";
import { AIDeadlineResponseSchema, type AIDeadlineResponse } from "@/lib/ai-schemas";

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

    const today = new Date().toISOString().split("T")[0];

    const assigneeMember = task.assigneeName
      ? teamMembers.find((m) =>
          m.name?.toLowerCase() === task.assigneeName?.toLowerCase()
        )
      : null;

    const workloadContext = assigneeMember
      ? `Assignee has ${assigneeMember.pendingTaskCount} pending tasks, ${assigneeMember.overdueTaskCount} overdue tasks.`
      : "No assignee set.";

    const aiPrompt = `You are a project management expert estimating task deadlines.
Today's date: ${today}
Current due date: ${task.dueDate || "Not set"}

Task details:
- Title: "${task.title}"
- Description: ${task.description || "None provided"}
- Priority: ${task.priority}
- Status: ${task.status}
- Assignee workload: ${workloadContext}
- Subtask count: ${task.subtaskCount || 0}

Based on task complexity and current workload, suggest a realistic deadline.
Return ONLY valid JSON (no markdown, no explanation):
{
  "suggestedDate": "YYYY-MM-DD (must be today or future)",
  "reason": "clear business-friendly explanation (max 250 chars)",
  "confidence": "LOW" | "MEDIUM" | "HIGH",
  "estimatedEffortDays": number (integer, positive)
}

Rules:
- suggestedDate must be ${today} or later.
- Be realistic — factor in complexity and workload.`;

    const rawText = await generateAIContent(aiPrompt);
    const parsed = parseAIJson<AIDeadlineResponse>(rawText);
    const validated = AIDeadlineResponseSchema.parse(parsed);

    // Safety: ensure suggested date is not in the past
    const suggestedDate = new Date(validated.suggestedDate);
    const todayDate = new Date(today);
    if (suggestedDate < todayDate) {
      validated.suggestedDate = today;
    }

    return NextResponse.json({ suggestion: validated });
  } catch (error) {
    console.error("[AI Deadline] Error:", error);
    return NextResponse.json(
      { error: "AI deadline suggestion failed. Please try again." },
      { status: 500 }
    );
  }
}
