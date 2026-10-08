/**
 * POST /api/ai/summary
 *
 * Generates a business-friendly summary of a task including
 * status, decisions, blockers, and recommended next action.
 */
import { NextResponse } from "next/server";
import { getAuthUserWithWorkspace } from "@/lib/workspace-helpers";
import { generateAIContent, parseAIJson } from "@/lib/ai-client";
import { get_task_details } from "@/lib/ai-tools";
import { AITaskSummarySchema, type AITaskSummary } from "@/lib/ai-schemas";

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

    const task = await get_task_details(body.taskId, workspace.id);
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const today = new Date().toISOString().split("T")[0];

    const activityContext =
      task.activitySummary.length > 0
        ? task.activitySummary.join("\n")
        : "No activity recorded.";

    const aiPrompt = `You are a project management assistant writing concise task summaries.
Today's date: ${today}

Task details:
- Title: "${task.title}"
- Description: ${task.description || "None"}
- Status: ${task.status}
- Priority: ${task.priority}
- Due date: ${task.dueDate || "Not set"}
- Assignee: ${task.assigneeName || "Unassigned"}
- Comments: ${task.commentCount} comment(s)
- Activity history:
${activityContext}

Write a concise, business-friendly task summary.
Return ONLY valid JSON (no markdown, no explanation):
{
  "summary": "2-4 sentence executive summary of this task (max 400 chars)",
  "currentStatus": "one sentence describing current state (max 150 chars)",
  "importantDecisions": ["decision 1", "decision 2"] (max 5 items, each max 200 chars),
  "blockers": ["blocker 1"] (max 5 items, each max 200 chars, empty if none),
  "nextAction": "specific recommended next step (max 200 chars)"
}

Be concise, professional, and factual. Base everything on the data provided.`;

    const rawText = await generateAIContent(aiPrompt);
    const parsed = parseAIJson<AITaskSummary>(rawText);
    const validated = AITaskSummarySchema.parse(parsed);

    return NextResponse.json({ summary: validated });
  } catch (error) {
    console.error("[AI Summary] Error:", error);
    return NextResponse.json(
      { error: "AI summary generation failed. Please try again." },
      { status: 500 }
    );
  }
}
