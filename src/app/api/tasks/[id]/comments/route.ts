import { NextResponse } from "next/server";
import { getAuthUserWithWorkspace, recordTaskActivity, createInAppNotification } from "@/lib/workspace-helpers";
import { prisma } from "@/lib/prisma";
import { ActivityAction, NotificationType } from "@prisma/client";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthUserWithWorkspace();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspace } = auth;
    const { id: taskId } = await params;
    if (!taskId) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { id: true, workspaceId: true },
    });

    if (!task || (task.workspaceId && task.workspaceId !== workspace.id)) {
      return NextResponse.json({ error: "Task not found in this workspace" }, { status: 404 });
    }

    const comments = await prisma.taskComment.findMany({
      where: { taskId },
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ comments });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthUserWithWorkspace();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { user: currentUser, workspace } = auth;
    const { id: taskId } = await params;
    if (!taskId) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { id: true, title: true, createdById: true, assignedToId: true, workspaceId: true },
    });

    if (!task || (task.workspaceId && task.workspaceId !== workspace.id)) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body.content !== "string" || !body.content.trim()) {
      return NextResponse.json({ error: "Comment text cannot be empty" }, { status: 400 });
    }

    const content = body.content.trim();

    const newComment = await prisma.taskComment.create({
      data: {
        taskId,
        userId: currentUser.id,
        content,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
    });

    // Record activity audit log
    const commenterName = currentUser.name || currentUser.email;
    await recordTaskActivity({
      taskId,
      userId: currentUser.id,
      action: ActivityAction.COMMENTED,
      details: `${commenterName} commented on this task`,
    });

    // Dispatch notifications to creator and assignee if different from commenter
    const recipientIds = new Set<string>();
    if (task.createdById && task.createdById !== currentUser.id) {
      recipientIds.add(task.createdById);
    }
    if (task.assignedToId && task.assignedToId !== currentUser.id) {
      recipientIds.add(task.assignedToId);
    }

    for (const recipientId of recipientIds) {
      await createInAppNotification({
        userId: recipientId,
        type: NotificationType.COMMENT_ADDED,
        title: "New Comment",
        message: `${commenterName} commented on "${task.title}": "${content.slice(0, 60)}${content.length > 60 ? "..." : ""}"`,
        link: `/dashboard?view=tasks&taskId=${task.id}`,
      });
    }

    return NextResponse.json({ comment: newComment }, { status: 201 });
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json({ error: "Failed to create comment" }, { status: 500 });
  }
}
