/**
 * POST /api/ai/planner/approve
 *
 * After the user reviews and approves a proposal from /api/ai/planner,
 * this endpoint creates the actual tasks in the database.
 *
 * Backend validates the proposal schema again before any DB writes.
 */
import { NextResponse } from "next/server";
import { getAuthUserWithWorkspace } from "@/lib/workspace-helpers";
import { prisma } from "@/lib/prisma";
import { ActivityAction, NotificationType, TaskPriority } from "@prisma/client";
import {
  AIPlannerResponseSchema,
  type AIProposedTask,
} from "@/lib/ai-schemas";
import { recordTaskActivity, createInAppNotification } from "@/lib/workspace-helpers";
import { resolve_member_by_name } from "@/lib/ai-tools";

export async function POST(request: Request) {
  try {
    const auth = await getAuthUserWithWorkspace();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { user: currentUser, workspace } = auth;

    const body = await request.json().catch(() => null);
    if (!body?.tasks || !Array.isArray(body.tasks)) {
      return NextResponse.json(
        { error: "tasks array is required" },
        { status: 400 }
      );
    }

    // Re-validate the proposal with the same Zod schema (security: never trust client)
    let validated: ReturnType<typeof AIPlannerResponseSchema.parse>;
    try {
      validated = AIPlannerResponseSchema.parse({ tasks: body.tasks });
    } catch {
      return NextResponse.json(
        { error: "Proposal data is invalid or malformed" },
        { status: 400 }
      );
    }

    const createdTasks = [];

    for (const proposedTask of validated.tasks) {
      // Resolve assignee ID by name (workspace-scoped lookup)
      let assignedToId: string | null = null;
      if (proposedTask.suggestedAssigneeName) {
        const member = await resolve_member_by_name(
          workspace.id,
          proposedTask.suggestedAssigneeName
        );
        if (member) {
          assignedToId = member.id;
        }
      }

      // Parse and validate due date
      let dueDate: Date | null = null;
      if (proposedTask.suggestedDueDate) {
        const parsed = new Date(proposedTask.suggestedDueDate);
        if (!isNaN(parsed.getTime())) {
          dueDate = parsed;
        }
      }

      const priority = proposedTask.priority as TaskPriority;

      // Create parent task
      const newTask = await prisma.task.create({
        data: {
          title: proposedTask.title,
          description: proposedTask.description || null,
          priority,
          status: "PENDING",
          dueDate,
          createdById: currentUser.id,
          assignedToId,
          workspaceId: workspace.id,
        },
        include: {
          createdBy: { select: { id: true, name: true, email: true, image: true } },
          assignedTo: { select: { id: true, name: true, email: true, image: true } },
        },
      });

      // Create subtasks
      if (proposedTask.subtasks && proposedTask.subtasks.length > 0) {
        for (const subtitleStr of proposedTask.subtasks) {
          await prisma.task.create({
            data: {
              title: subtitleStr,
              priority,
              status: "PENDING",
              createdById: currentUser.id,
              assignedToId,
              workspaceId: workspace.id,
              parentId: newTask.id,
            },
          });
        }
      }

      // Audit log
      await recordTaskActivity({
        taskId: newTask.id,
        userId: currentUser.id,
        action: ActivityAction.CREATED,
        details: `${currentUser.name || currentUser.email} created this task via AI Planner`,
      });

      // Notify assignee if different from creator
      if (assignedToId && assignedToId !== currentUser.id) {
        await createInAppNotification({
          userId: assignedToId,
          type: NotificationType.TASK_ASSIGNED,
          title: "New Task Assigned (AI Planner)",
          message: `${currentUser.name || "A teammate"} assigned "${newTask.title}" to you via AI Planner.`,
          link: `/dashboard?view=tasks&taskId=${newTask.id}`,
        });
      }

      createdTasks.push(newTask);
    }

    return NextResponse.json(
      { tasks: createdTasks, count: createdTasks.length },
      { status: 201 }
    );
  } catch (error) {
    console.error("[AI Planner Approve] Error:", error);
    return NextResponse.json(
      { error: "Failed to create tasks. Please try again." },
      { status: 500 }
    );
  }
}
