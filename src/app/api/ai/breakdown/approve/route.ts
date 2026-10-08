/**
 * POST /api/ai/breakdown/approve
 *
 * Creates approved subtasks for a parent task.
 * Accepts a filtered list of subtasks that the user has approved.
 */
import { NextResponse } from "next/server";
import { getAuthUserWithWorkspace } from "@/lib/workspace-helpers";
import { prisma } from "@/lib/prisma";
import { ActivityAction } from "@prisma/client";
import { recordTaskActivity } from "@/lib/workspace-helpers";
import { z } from "zod";

const ApproveBreakdownSchema = z.object({
  taskId: z.string().min(1),
  subtasks: z
    .array(
      z.object({
        title: z.string().min(1).max(255),
        description: z.string().max(1000).nullable().optional(),
      })
    )
    .min(1)
    .max(15),
});

export async function POST(request: Request) {
  try {
    const auth = await getAuthUserWithWorkspace();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { user: currentUser, workspace } = auth;

    const body = await request.json().catch(() => null);
    let validated: z.infer<typeof ApproveBreakdownSchema>;
    try {
      validated = ApproveBreakdownSchema.parse(body);
    } catch {
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 }
      );
    }

    // Verify parent task belongs to this workspace
    const parentTask = await prisma.task.findFirst({
      where: { id: validated.taskId, workspaceId: workspace.id },
    });
    if (!parentTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const createdSubtasks = [];

    for (const subtask of validated.subtasks) {
      const created = await prisma.task.create({
        data: {
          title: subtask.title,
          description: subtask.description || null,
          priority: parentTask.priority,
          status: "PENDING",
          createdById: currentUser.id,
          assignedToId: parentTask.assignedToId,
          workspaceId: workspace.id,
          parentId: parentTask.id,
        },
        include: {
          createdBy: { select: { id: true, name: true, email: true, image: true } },
          assignedTo: { select: { id: true, name: true, email: true, image: true } },
        },
      });
      createdSubtasks.push(created);
    }

    // Record activity on the parent task
    await recordTaskActivity({
      taskId: parentTask.id,
      userId: currentUser.id,
      action: ActivityAction.CREATED,
      details: `${currentUser.name || currentUser.email} added ${createdSubtasks.length} subtask(s) via AI Breakdown`,
    });

    return NextResponse.json(
      { subtasks: createdSubtasks, count: createdSubtasks.length },
      { status: 201 }
    );
  } catch (error) {
    console.error("[AI Breakdown Approve] Error:", error);
    return NextResponse.json(
      { error: "Failed to create subtasks. Please try again." },
      { status: 500 }
    );
  }
}
