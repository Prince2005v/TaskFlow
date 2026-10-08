/**
 * POST /api/ai/chat
 *
 * AI Chat assistant that answers questions about the user's workspace.
 * Access is strictly limited to workspace data the authenticated user can see.
 * Never exposes data from other workspaces.
 */
import { NextResponse } from "next/server";
import { getAuthUserWithWorkspace } from "@/lib/workspace-helpers";
import { generateAIContent, parseAIJson } from "@/lib/ai-client";
import { get_tasks, get_team_members, get_team_metrics } from "@/lib/ai-tools";
import { AIChatResponseSchema, type AIChatResponse } from "@/lib/ai-schemas";

export async function POST(request: Request) {
  try {
    const auth = await getAuthUserWithWorkspace();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { user: currentUser, workspace } = auth;

    const body = await request.json().catch(() => null);
    if (!body?.message || typeof body.message !== "string") {
      return NextResponse.json(
        { error: "message is required" },
        { status: 400 }
      );
    }

    const message = body.message.trim().slice(0, 500);
    if (!message) {
      return NextResponse.json(
        { error: "Message cannot be empty" },
        { status: 400 }
      );
    }

    // Fetch workspace data for context
    const [tasks, teamMembers, metrics] = await Promise.all([
      get_tasks(workspace.id),
      get_team_members(workspace.id),
      get_team_metrics(workspace.id),
    ]);

    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    // Build context snapshot
    const overdueTasks = tasks.filter(
      (t) =>
        t.dueDate && t.status !== "COMPLETED" && new Date(t.dueDate) < today
    );

    const tasksSummary = tasks
      .slice(0, 50)
      .map(
        (t) =>
          `[${t.status}/${t.priority}] "${t.title}" → ${t.assigneeName || "unassigned"} (due: ${t.dueDate || "none"})`
      )
      .join("\n");

    const teamSummary = teamMembers
      .map(
        (m) =>
          `${m.name || m.email}: ${m.assignedTaskCount} assigned, ${m.completedTaskCount} done, ${m.overdueTaskCount} overdue`
      )
      .join("\n");

    const aiPrompt = `You are TaskFlow AI, a helpful assistant for the "${workspace.name}" workspace.
You only have access to this workspace's data. Never reference other workspaces.
Current user: ${currentUser.name || currentUser.email}
Today's date: ${todayStr}

WORKSPACE DATA (${workspace.name}):
Metrics: ${metrics.totalTasks} total tasks, ${metrics.completedTasks} completed, ${metrics.overdueTasks} overdue, ${metrics.highPriorityTasks} high priority

Tasks (up to 50):
${tasksSummary || "No tasks yet"}

Team:
${teamSummary || "No team members"}

Overdue tasks: ${overdueTasks.length}
${overdueTasks
  .slice(0, 5)
  .map((t) => `- "${t.title}" (${t.assigneeName || "unassigned"}, due ${t.dueDate})`)
  .join("\n")}

User question: "${message}"

Answer the question concisely and helpfully based on the real workspace data above.
Return ONLY valid JSON (no markdown, no explanation):
{
  "answer": "your helpful answer (max 800 chars, well-formatted with line breaks where needed)",
  "dataPoints": ["key data point 1", "key data point 2"] (max 10 items, specific facts referenced)
}

Rules:
- Only reference data that exists above.
- Be specific with numbers and names.
- If the data doesn't have enough info, say so honestly.
- Keep the answer concise and actionable.`;

    const rawText = await generateAIContent(aiPrompt);
    const parsed = parseAIJson<AIChatResponse>(rawText);
    const validated = AIChatResponseSchema.parse(parsed);

    return NextResponse.json({ response: validated });
  } catch (error) {
    console.error("[AI Chat] Error:", error);
    return NextResponse.json(
      { error: "AI assistant failed to respond. Please try again." },
      { status: 500 }
    );
  }
}
