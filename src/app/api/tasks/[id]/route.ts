import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { TaskStatus, TaskPriority } from "@prisma/client";
import { sendTaskCompletedEmail } from "@/lib/mail";

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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getAuthUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { error: "Task ID is required" },
        { status: 400 }
      );
    }

    // Fetch existing task WITH relations (needed for email and auth checks)
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

    const isCreator = existingTask.createdById === currentUser.id;
    const isAssignee = existingTask.assignedToId === currentUser.id;

    if (!isCreator && !isAssignee) {
      return NextResponse.json(
        { error: "You are not authorized to update this task" },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const dataToUpdate: {
      status?: TaskStatus;
      priority?: TaskPriority;
      title?: string;
      description?: string | null;
      dueDate?: Date | null;
      assignedToId?: string | null;
    } = {};

    // Determine if this update triggers completion email
    const isBeingCompleted =
      body.status === TaskStatus.COMPLETED &&
      existingTask.status !== TaskStatus.COMPLETED;

    // Both creator and assignee can update status
    if (body.status) {
      if (!VALID_STATUSES.includes(body.status)) {
        return NextResponse.json(
          { error: "Invalid status value" },
          { status: 400 }
        );
      }
      dataToUpdate.status = body.status;
    }

    // Only creator can update task details
    if (isCreator) {
      if (typeof body.title === "string") {
        const trimmedTitle = body.title.trim();
        if (!trimmedTitle) {
          return NextResponse.json(
            { error: "Title cannot be empty" },
            { status: 400 }
          );
        }
        dataToUpdate.title = trimmedTitle;
      }

      if (body.description !== undefined) {
        dataToUpdate.description =
          typeof body.description === "string"
            ? body.description.trim()
            : null;
      }

      if (body.priority && VALID_PRIORITIES.includes(body.priority)) {
        dataToUpdate.priority = body.priority;
      }

      if (body.dueDate !== undefined) {
        if (!body.dueDate) {
          dataToUpdate.dueDate = null;
        } else {
          const parsed = new Date(body.dueDate);
          if (!isNaN(parsed.getTime())) {
            dataToUpdate.dueDate = parsed;
          }
        }
      }

      if (body.assignedToId !== undefined) {
        if (!body.assignedToId) {
          dataToUpdate.assignedToId = null;
        } else {
          const targetUser = await prisma.user.findUnique({
            where: { id: body.assignedToId },
            select: { id: true },
          });
          if (!targetUser) {
            return NextResponse.json(
              { error: "Assigned user not found" },
              { status: 400 }
            );
          }
          dataToUpdate.assignedToId = targetUser.id;
        }
      }
    }

    // ── Persist update ────────────────────────────────────────────────────
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

    // ── Send completion email (only when transitioning to COMPLETED) ───────
    let emailSent = false;
    let emailError: string | undefined;

    if (isBeingCompleted && updatedTask.createdBy?.email) {
      const result = await sendTaskCompletedEmail({
        creatorEmail: updatedTask.createdBy.email,
        creatorName: updatedTask.createdBy.name,
        completedByName:
          currentUser.name || currentUser.email,
        taskTitle: updatedTask.title,
        taskPriority: updatedTask.priority,
      }).catch((err) => {
        console.error("[mail] Unexpected error in sendTaskCompletedEmail:", err);
        return { sent: false, error: "Unexpected email error" };
      });

      emailSent = result.sent;
      emailError = result.error;
    }

    return NextResponse.json({
      task: updatedTask,
      ...(isBeingCompleted
        ? {
            notification: {
              sent: emailSent,
              ...(emailError
                ? { message: "Email notification could not be sent." }
                : {}),
            },
          }
        : {}),
    });
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 }
    );
  }
}
