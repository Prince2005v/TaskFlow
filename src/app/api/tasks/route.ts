import { NextResponse } from "next/server";
import { getAuthUserWithWorkspace, recordTaskActivity, createInAppNotification } from "@/lib/workspace-helpers";
import { prisma } from "@/lib/prisma";
import { TaskPriority, ActivityAction, NotificationType } from "@prisma/client";
import { sendTaskCreatedEmail } from "@/lib/mail";

const VALID_PRIORITIES = [TaskPriority.LOW, TaskPriority.MEDIUM, TaskPriority.HIGH];

export async function GET(request: Request) {
  try {
    const auth = await getAuthUserWithWorkspace();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { user: currentUser, workspace } = auth;
    const { searchParams } = new URL(request.url);

    const searchQuery = searchParams.get("search")?.trim() || "";
    const statusFilter = searchParams.get("status");
    const priorityFilter = searchParams.get("priority");
    const assigneeFilter = searchParams.get("assigneeId");

    // Build workspace-isolated query filter
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const whereClause: any = {
      workspaceId: workspace.id,
    };

    if (searchQuery) {
      whereClause.OR = [
        { title: { contains: searchQuery, mode: "insensitive" } },
        { description: { contains: searchQuery, mode: "insensitive" } },
      ];
    }

    if (statusFilter && statusFilter !== "ALL") {
      whereClause.status = statusFilter;
    }

    if (priorityFilter && priorityFilter !== "ALL") {
      whereClause.priority = priorityFilter;
    }

    if (assigneeFilter && assigneeFilter !== "ALL") {
      if (assigneeFilter === "UNASSIGNED") {
        whereClause.assignedToId = null;
      } else {
        whereClause.assignedToId = assigneeFilter;
      }
    }

    const allTasks = await prisma.task.findMany({
      where: whereClause,
      include: {
        createdBy: {
          select: { id: true, name: true, email: true, image: true },
        },
        assignedTo: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Derive myTasks and assignedTasks for convenience
    const myTasks = allTasks.filter((t) => t.createdById === currentUser.id);
    const assignedTasks = allTasks.filter((t) => t.assignedToId === currentUser.id);

    return NextResponse.json({
      tasks: allTasks,
      myTasks,
      assignedTasks,
      workspace: {
        id: workspace.id,
        name: workspace.name,
        role: workspace.role,
        plan: workspace.plan,
      },
    });
  } catch (error) {
    console.error("Error fetching workspace tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const auth = await getAuthUserWithWorkspace();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { user: currentUser, workspace } = auth;

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

    // Verify assigned user belongs to this workspace (Workspace Isolation)
    let assignedToId: string | null = null;
    if (body.assignedToId && typeof body.assignedToId === "string") {
      const member = await prisma.workspaceMember.findFirst({
        where: {
          workspaceId: workspace.id,
          userId: body.assignedToId,
        },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      if (!member) {
        return NextResponse.json(
          { error: "Assigned user is not a member of this workspace" },
          { status: 400 }
        );
      }
      assignedToId = member.userId;
    }

    // Create task scoped to active workspace
    const newTask = await prisma.task.create({
      data: {
        title,
        description,
        priority,
        status: "PENDING",
        dueDate,
        createdById: currentUser.id,
        assignedToId,
        workspaceId: workspace.id,
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

    // Record initial TaskActivity audit log
    await recordTaskActivity({
      taskId: newTask.id,
      userId: currentUser.id,
      action: ActivityAction.CREATED,
      details: `${currentUser.name || currentUser.email} created this task`,
    });

    // Notification and email handling
    let emailSent = false;
    let emailError: string | undefined;

    if (newTask.assignedTo && newTask.assignedToId !== currentUser.id) {
      // In-app notification
      await createInAppNotification({
        userId: newTask.assignedToId!,
        type: NotificationType.TASK_ASSIGNED,
        title: "New Task Assigned",
        message: `${currentUser.name || "A teammate"} assigned "${newTask.title}" to you.`,
        link: `/dashboard?view=tasks&taskId=${newTask.id}`,
      });

      // Email notification
      if (newTask.assignedTo.email) {
        const result = await sendTaskCreatedEmail({
          assignedUserEmail: newTask.assignedTo.email,
          assignedUserName: newTask.assignedTo.name,
          creatorName: newTask.createdBy.name || newTask.createdBy.email,
          taskTitle: newTask.title,
          taskDescription: newTask.description,
          taskPriority: newTask.priority,
          taskDueDate: newTask.dueDate,
        }).catch((err) => {
          console.error("[mail] Error sending task creation email:", err);
          return { sent: false, error: "Email delivery failed" };
        });

        emailSent = result.sent;
        emailError = result.error;
      }
    }

    return NextResponse.json(
      {
        task: newTask,
        notification: {
          sent: emailSent,
          ...(emailError ? { message: "Email notification could not be delivered." } : {}),
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
