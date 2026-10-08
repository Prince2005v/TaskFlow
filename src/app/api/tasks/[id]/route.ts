import { NextResponse } from "next/server";
import { getAuthUserWithWorkspace, recordTaskActivity, createInAppNotification } from "@/lib/workspace-helpers";
import { prisma } from "@/lib/prisma";
import { TaskStatus, TaskPriority, ActivityAction, NotificationType, WorkspaceRole } from "@prisma/client";
import { sendTaskCompletedEmail, sendTaskCreatedEmail } from "@/lib/mail";

const VALID_STATUSES = [
  TaskStatus.PENDING,
  TaskStatus.IN_PROGRESS,
  TaskStatus.COMPLETED,
];

const VALID_PRIORITIES = [
  TaskPriority.LOW,
  TaskPriority.MEDIUM,
  TaskPriority.HIGH,
];

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
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
    }

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true, image: true },
        },
        assignedTo: {
          select: { id: true, name: true, email: true, image: true },
        },
        activities: {
          include: {
            user: {
              select: { id: true, name: true, email: true, image: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        comments: {
          include: {
            user: {
              select: { id: true, name: true, email: true, image: true },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Workspace Isolation Check
    if (task.workspaceId && task.workspaceId !== workspace.id) {
      return NextResponse.json({ error: "Access denied to task outside your workspace" }, { status: 403 });
    }

    return NextResponse.json({ task });
  } catch (error) {
    console.error("Error fetching task:", error);
    return NextResponse.json(
      { error: "Failed to fetch task" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthUserWithWorkspace();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { user: currentUser, workspace } = auth;
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
    }

    const existingTask = await prisma.task.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true, image: true },
        },
        assignedTo: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
    });

    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Workspace Isolation
    if (existingTask.workspaceId && existingTask.workspaceId !== workspace.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const isCreator = existingTask.createdById === currentUser.id;
    const isAssignee = existingTask.assignedToId === currentUser.id;
    const isWorkspaceManager =
      workspace.role === WorkspaceRole.OWNER || workspace.role === WorkspaceRole.ADMIN;

    if (!isCreator && !isAssignee && !isWorkspaceManager) {
      return NextResponse.json(
        { error: "You are not authorized to update this task" },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const dataToUpdate: {
      status?: TaskStatus;
      priority?: TaskPriority;
      title?: string;
      description?: string | null;
      dueDate?: Date | null;
      assignedToId?: string | null;
    } = {};

    const authorDisplayName = currentUser.name || currentUser.email;

    // 1. Status update
    let isStatusChanged = false;
    const oldStatus = existingTask.status;
    let newStatus = existingTask.status;

    if (body.status !== undefined) {
      if (!VALID_STATUSES.includes(body.status)) {
        return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
      }
      if (body.status !== existingTask.status) {
        dataToUpdate.status = body.status;
        isStatusChanged = true;
        newStatus = body.status;
      }
    }

    // 2. Details update (only creator or workspace owner/admin)
    let isReassigned = false;
    let newAssigneeUser: { id: string; name: string | null; email: string } | null = null;
    let isPriorityChanged = false;
    let isDueDateChanged = false;

    if (isCreator || isWorkspaceManager) {
      if (body.title !== undefined) {
        if (typeof body.title !== "string" || !body.title.trim()) {
          return NextResponse.json({ error: "Title cannot be empty" }, { status: 400 });
        }
        dataToUpdate.title = body.title.trim();
      }

      if (body.description !== undefined) {
        dataToUpdate.description =
          typeof body.description === "string" ? body.description.trim() || null : null;
      }

      if (body.priority !== undefined && VALID_PRIORITIES.includes(body.priority)) {
        if (body.priority !== existingTask.priority) {
          dataToUpdate.priority = body.priority;
          isPriorityChanged = true;
        }
      }

      if (body.dueDate !== undefined) {
        if (!body.dueDate) {
          dataToUpdate.dueDate = null;
          isDueDateChanged = true;
        } else {
          const parsed = new Date(body.dueDate);
          if (isNaN(parsed.getTime())) {
            return NextResponse.json({ error: "Invalid due date" }, { status: 400 });
          }
          dataToUpdate.dueDate = parsed;
          isDueDateChanged = true;
        }
      }

      if (body.assignedToId !== undefined) {
        if (!body.assignedToId) {
          dataToUpdate.assignedToId = null;
          if (existingTask.assignedToId !== null) isReassigned = true;
        } else if (body.assignedToId !== existingTask.assignedToId) {
          // Check workspace membership
          const member = await prisma.workspaceMember.findFirst({
            where: {
              workspaceId: workspace.id,
              userId: body.assignedToId,
            },
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
          });

          if (!member) {
            return NextResponse.json({ error: "Assigned user is not in this workspace" }, { status: 400 });
          }

          dataToUpdate.assignedToId = member.userId;
          newAssigneeUser = member.user;
          isReassigned = true;
        }
      }
    }

    // Persist update in DB
    const updatedTask = await prisma.task.update({
      where: { id },
      data: dataToUpdate,
      include: {
        createdBy: {
          select: { id: true, name: true, email: true, image: true },
        },
        assignedTo: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
    });

    // ── Audit History & In-App Notifications ──

    // Status changed audit
    if (isStatusChanged) {
      await recordTaskActivity({
        taskId: id,
        userId: currentUser.id,
        action: ActivityAction.STATUS_CHANGED,
        details: `${authorDisplayName} updated status to ${newStatus.replace("_", " ")}`,
        oldValue: oldStatus,
        newValue: newStatus,
      });

      if (newStatus === TaskStatus.COMPLETED && oldStatus !== TaskStatus.COMPLETED) {
        await recordTaskActivity({
          taskId: id,
          userId: currentUser.id,
          action: ActivityAction.COMPLETED,
          details: `${authorDisplayName} completed this task`,
        });

        // Notify creator if not the completer
        if (updatedTask.createdById !== currentUser.id) {
          await createInAppNotification({
            userId: updatedTask.createdById,
            type: NotificationType.TASK_COMPLETED,
            title: "Task Completed",
            message: `${authorDisplayName} completed "${updatedTask.title}".`,
            link: `/dashboard?view=tasks&taskId=${updatedTask.id}`,
          });

          // Email creator
          if (updatedTask.createdBy?.email) {
            sendTaskCompletedEmail({
              creatorEmail: updatedTask.createdBy.email,
              creatorName: updatedTask.createdBy.name,
              completedByName: authorDisplayName,
              taskTitle: updatedTask.title,
              taskPriority: updatedTask.priority,
            }).catch((err) => console.error("[mail] Completion email error:", err));
          }
        }
      }
    }

    // Reassigned audit
    if (isReassigned) {
      const assigneeName = newAssigneeUser?.name || newAssigneeUser?.email || "Unassigned";
      await recordTaskActivity({
        taskId: id,
        userId: currentUser.id,
        action: ActivityAction.REASSIGNED,
        details: `${authorDisplayName} reassigned task to ${assigneeName}`,
        newValue: newAssigneeUser?.id || null,
      });

      if (newAssigneeUser && newAssigneeUser.id !== currentUser.id) {
        await createInAppNotification({
          userId: newAssigneeUser.id,
          type: NotificationType.TASK_REASSIGNED,
          title: "Task Reassigned to You",
          message: `${authorDisplayName} assigned "${updatedTask.title}" to you.`,
          link: `/dashboard?view=tasks&taskId=${updatedTask.id}`,
        });

        if (newAssigneeUser.email) {
          sendTaskCreatedEmail({
            assignedUserEmail: newAssigneeUser.email,
            assignedUserName: newAssigneeUser.name,
            creatorName: authorDisplayName,
            taskTitle: updatedTask.title,
            taskDescription: updatedTask.description,
            taskPriority: updatedTask.priority,
            taskDueDate: updatedTask.dueDate,
          }).catch((err) => console.error("[mail] Reassignment email error:", err));
        }
      }
    }

    // Priority changed audit
    if (isPriorityChanged && body.priority) {
      await recordTaskActivity({
        taskId: id,
        userId: currentUser.id,
        action: ActivityAction.PRIORITY_CHANGED,
        details: `${authorDisplayName} set priority to ${body.priority}`,
        oldValue: existingTask.priority,
        newValue: body.priority,
      });
    }

    // Due date changed audit
    if (isDueDateChanged) {
      await recordTaskActivity({
        taskId: id,
        userId: currentUser.id,
        action: ActivityAction.DUE_DATE_CHANGED,
        details: `${authorDisplayName} updated the due date`,
      });
    }

    return NextResponse.json({ task: updatedTask });
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthUserWithWorkspace();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { user: currentUser, workspace } = auth;
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
    }

    const existingTask = await prisma.task.findUnique({
      where: { id },
      select: { id: true, createdById: true, workspaceId: true },
    });

    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Workspace Isolation
    if (existingTask.workspaceId && existingTask.workspaceId !== workspace.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const isCreator = existingTask.createdById === currentUser.id;
    const isWorkspaceManager =
      workspace.role === WorkspaceRole.OWNER || workspace.role === WorkspaceRole.ADMIN;

    if (!isCreator && !isWorkspaceManager) {
      return NextResponse.json(
        { error: "Only the task creator or a workspace admin can delete this task" },
        { status: 403 }
      );
    }

    await prisma.task.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Task deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting task:", error);
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
  }
}
