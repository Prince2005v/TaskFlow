/**
 * POST /api/ai/breakdown
 *
 * Given an existing task ID, generates useful subtasks using AI.
 * Returns a proposal — user must approve individual subtasks.
 */
import { NextResponse } from "next/server";
import { getAuthUserWithWorkspace } from "@/lib/workspace-helpers";
import { generateAIContent, parseAIJson } from "@/lib/ai-client";
import { get_task_details } from "@/lib/ai-tools";
import { AIBreakdownResponseSchema, type AIBreakdownResponse } from "@/lib/ai-schemas";

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

    // Fetch task details (workspace-isolated)
    const task = await get_task_details(body.taskId, workspace.id);
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const today = new Date().toISOString().split("T")[0];

    const aiPrompt = `You are a project planning assistant.
Today's date is ${today}.

Analyze this task and generate a practical breakdown into subtasks:

Task: "${task.title}"
Description: ${task.description || "No description provided"}
Priority: ${task.priority}
Due date: ${task.dueDate || "Not set"}
Status: ${task.status}

Generate 3–8 specific, actionable subtasks that together complete this task.
Return ONLY valid JSON with no markdown or explanation:
{
  "subtasks": [
    {
      "title": "string (max 255 chars, action-oriented)",
      "description": "string or null"
    }
  ],
  "reasoning": "brief explanation of the breakdown approach (max 200 chars)"
}

Rules:
- Each subtask title must be specific and actionable (start with a verb).
- Do not repeat the parent task title.
- subtasks must make logical sense for the parent task.
- Maximum 10 subtasks.`;

    const rawText = await generateAIContent(aiPrompt);
    const parsed = parseAIJson<AIBreakdownResponse>(rawText);
    const validated = AIBreakdownResponseSchema.parse(parsed);

    return NextResponse.json({ breakdown: validated, task: { id: task.id, title: task.title } });
  } catch (error) {
    console.error("[AI Breakdown] Error:", error);
    return NextResponse.json(
      { error: "AI breakdown failed. Please try again." },
      { status: 500 }
    );
  }
}
