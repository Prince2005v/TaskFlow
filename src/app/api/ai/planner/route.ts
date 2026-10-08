/**
 * POST /api/ai/planner
 *
 * Takes a natural language prompt and returns a structured task proposal.
 * Does NOT create tasks — returns a proposal for user review.
 *
 * Human-in-the-loop: User must explicitly approve before tasks are created.
 */
import { NextResponse } from "next/server";
import { getAuthUserWithWorkspace } from "@/lib/workspace-helpers";
import { generateAIContent, parseAIJson } from "@/lib/ai-client";
import { get_team_members } from "@/lib/ai-tools";
import {
  AIPlannerResponseSchema,
  type AIPlannerResponse,
} from "@/lib/ai-schemas";

export async function POST(request: Request) {
  try {
    const auth = await getAuthUserWithWorkspace();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { workspace } = auth;

    const body = await request.json().catch(() => null);
    if (!body?.prompt || typeof body.prompt !== "string") {
      return NextResponse.json(
        { error: "A prompt is required" },
        { status: 400 }
      );
    }

    const prompt = body.prompt.trim().slice(0, 2000);
    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt cannot be empty" },
        { status: 400 }
      );
    }

    // Fetch team context (workspace-isolated)
    const teamMembers = await get_team_members(workspace.id);
    const teamContext = teamMembers
      .map((m) => `- ${m.name || m.email} (${m.email})`)
      .join("\n");

    const today = new Date().toISOString().split("T")[0];

    const aiPrompt = `You are a project planning assistant for a team productivity app.
Today's date is ${today}.

Team members in this workspace:
${teamContext || "No team members found"}

User's request:
"${prompt}"

Analyze this request and generate a structured list of tasks. 
Return ONLY valid JSON matching this exact schema — no markdown, no explanation:
{
  "tasks": [
    {
      "title": "string (max 255 chars)",
      "description": "string or null",
      "priority": "LOW" | "MEDIUM" | "HIGH",
      "suggestedDueDate": "YYYY-MM-DD or null",
      "suggestedAssigneeName": "exact name from team list or null",
      "subtasks": ["string", "string"] (max 10 items, can be empty array)
    }
  ]
}

Rules:
- Generate 1 to 8 tasks. Never more than 8.
- Only suggest assignees that exist in the team list above.
- suggestedDueDate must be today or in the future.
- Keep titles concise and action-oriented.
- subtasks should be specific actionable items.
- Do not invent team members.`;

    const rawText = await generateAIContent(aiPrompt);
    const parsed = parseAIJson<AIPlannerResponse>(rawText);
    const validated = AIPlannerResponseSchema.parse(parsed);

    return NextResponse.json({ proposal: validated });
  } catch (error) {
    console.error("[AI Planner] Error:", error);

    // Never expose raw errors to the browser
    const isValidationError =
      error instanceof Error && error.message.includes("ZodError");

    return NextResponse.json(
      {
        error: isValidationError
          ? "AI returned an unexpected response format. Please try again."
          : "AI analysis failed. Please try again in a moment.",
      },
      { status: 500 }
    );
  }
}
