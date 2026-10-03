import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { TaskPriority } from "@prisma/client";
import { sendTaskCreatedEmail } from "@/lib/mail";

const VALID_PRIORITIES = [TaskPriority.LOW, TaskPriority.MEDIUM, TaskPriority.HIGH];

export async function GET() {
  try {
    const currentUser = await getAuthUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [myTasks, assignedTasks] = await Promise.all([
      prisma.task.findMany({
        where: { createdById: currentUser.id },
        include: {
          createdBy: {
            select: { id: true, name: true, email: true, image: true },
          },
          assignedTo: {
            select: { id: true, name: true, email: true, image: true },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.task.findMany({
        where: { assignedToId: currentUser.id },
        include: {
          createdBy: {
            select: { id: true, name: true, email: true, image: true },
          },
          assignedTo: {
            select: { id: true, name: true, email: true, image: true },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return NextResponse.json({ myTasks, assignedTasks });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const currentUser = await getAuthUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const title = typeof body.title === "string" ? body.title.trim() : "";
    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const description =
      typeof body.description === "string" ? body.description.trim() : null;

    let priority: TaskPriority = TaskPriority.MEDIUM;
    if (body.priority && VALID_PRIORITIES.includes(body.priority)) {
      priority = body.priority;
    }

    let dueDate: Date | null = null;
    if (body.dueDate) {
      const parsedDate = new Date(body.dueDate);
      if (!isNaN(parsedDate.getTime())) {
        dueDate = parsedDate;
      }
    }

    // Validate assignedTo user exists before creating task
    let assignedToId: string | null = null;
    if (body.assignedToId && typeof body.assignedToId === "string") {
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
      assignedToId = targetUser.id;
    }

    // ── Create task in PostgreSQL ──────────────────────────────────────────
    const newTask = await prisma.task.create({
      data: {
        title,
        description,
        priority,
        status: "PENDING",
        dueDate,
        createdById: currentUser.id,
        assignedToId,
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true, image: true },
        },
        assignedTo: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
    });

    // ── Send email notification (non-blocking, never crashes task creation) ──
    let emailSent = false;
    let emailError: string | undefined;

    // Only send if assigned to a different user (not self-assignment edge case)
    if (newTask.assignedTo && newTask.assignedTo.email) {
      const result = await sendTaskCreatedEmail({
        assignedUserEmail: newTask.assignedTo.email,
        assignedUserName: newTask.assignedTo.name,
        creatorName: newTask.createdBy.name || newTask.createdBy.email,
        taskTitle: newTask.title,
        taskDescription: newTask.description,
        taskPriority: newTask.priority,
        taskDueDate: newTask.dueDate,
      }).catch((err) => {
        console.error("[mail] Unexpected error in sendTaskCreatedEmail:", err);
        return { sent: false, error: "Unexpected email error" };
      });

      emailSent = result.sent;
      emailError = result.error;
    }

    return NextResponse.json(
      {
        task: newTask,
        notification: {
          sent: emailSent,
          ...(emailError ? { message: "Email notification could not be sent." } : {}),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}
