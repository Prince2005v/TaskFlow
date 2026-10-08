/**
 * AI Tools — Controlled database access functions for the AI layer.
 *
 * The LLM NEVER executes arbitrary queries. These are the ONLY data
 * access functions AI features may use. Each function enforces
 * workspace isolation and returns only sanitized, safe data.
 */
import { prisma } from "@/lib/prisma";
import { TaskStatus, TaskPriority } from "@prisma/client";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AITaskContext {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  assigneeName: string | null;
  assigneeEmail: string | null;
  createdByName: string | null;
  createdAt: string;
  commentCount: number;
  activitySummary: string[];
  subtaskCount?: number;
}

export interface AITeamMemberContext {
  id: string;
  name: string | null;
  email: string;
  assignedTaskCount: number;
  completedTaskCount: number;
  overdueTaskCount: number;
  pendingTaskCount: number;
}

export interface AIWorkspaceMetrics {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  highPriorityTasks: number;
  tasksCreatedThisWeek: number;
  tasksCompletedThisWeek: number;
  tasksCompletedLastWeek: number;
}

// ─── Controlled Tool Functions ────────────────────────────────────────────────

/**
 * Returns all tasks in the workspace, stripped to safe fields.
 */
export async function get_tasks(workspaceId: string): Promise<AITaskContext[]> {
  const tasks = await prisma.task.findMany({
    where: { workspaceId },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
      comments: { select: { id: true } },
      activities: {
        select: { action: true, details: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
      subtasks: { select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const now = new Date();
  return tasks.map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    status: t.status,
    priority: t.priority,
    dueDate: t.dueDate ? t.dueDate.toISOString().split("T")[0] : null,
    assigneeName: t.assignedTo?.name ?? null,
    assigneeEmail: t.assignedTo?.email ?? null,
    createdByName: t.createdBy?.name ?? null,
    createdAt: t.createdAt.toISOString().split("T")[0],
    commentCount: t.comments.length,
    activitySummary: t.activities.map((a) => a.details),
    isOverdue:
      t.dueDate !== null &&
      t.status !== TaskStatus.COMPLETED &&
      new Date(t.dueDate) < now,
    subtaskCount: t.subtasks.length,
  }));
}

/**
 * Returns a single task with full context (activities + comments).
 * Verifies workspace ownership before returning.
 */
export async function get_task_details(
  taskId: string,
  workspaceId: string
): Promise<AITaskContext | null> {
  const task = await prisma.task.findFirst({
    where: { id: taskId, workspaceId },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
      comments: {
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "asc" },
        take: 30,
      },
      activities: {
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      subtasks: { select: { id: true } },
    },
  });

  if (!task) return null;

  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate ? task.dueDate.toISOString().split("T")[0] : null,
    assigneeName: task.assignedTo?.name ?? null,
    assigneeEmail: task.assignedTo?.email ?? null,
    createdByName: task.createdBy?.name ?? null,
    createdAt: task.createdAt.toISOString().split("T")[0],
    commentCount: task.comments.length,
    activitySummary: [
      ...task.activities.map((a) => `[${a.action}] ${a.details}`),
      ...task.comments.map(
        (c) =>
          `[COMMENT by ${c.user.name ?? "user"}]: ${c.content.slice(0, 150)}`
      ),
    ],
    subtaskCount: task.subtasks.length,
  };
}

/**
 * Returns team members with workload metrics for the workspace.
 */
export async function get_team_members(
  workspaceId: string
): Promise<AITeamMemberContext[]> {
  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  const now = new Date();
  const results: AITeamMemberContext[] = [];

  for (const member of members) {
    const tasks = await prisma.task.findMany({
      where: { workspaceId, assignedToId: member.userId },
      select: { status: true, dueDate: true },
    });

    const assigned = tasks.length;
    const completed = tasks.filter(
      (t) => t.status === TaskStatus.COMPLETED
    ).length;
    const overdue = tasks.filter(
      (t) =>
        t.dueDate !== null &&
        t.status !== TaskStatus.COMPLETED &&
        new Date(t.dueDate) < now
    ).length;
    const pending = tasks.filter(
      (t) => t.status === TaskStatus.PENDING
    ).length;

    results.push({
      id: member.userId,
      name: member.user.name,
      email: member.user.email,
      assignedTaskCount: assigned,
      completedTaskCount: completed,
      overdueTaskCount: overdue,
      pendingTaskCount: pending,
    });
  }

  return results;
}

/**
 * Returns aggregate workspace metrics for AI insights & reports.
 */
export async function get_team_metrics(
  workspaceId: string
): Promise<AIWorkspaceMetrics> {
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const twoWeeksAgo = new Date(now);
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

  const [
    total,
    completed,
    pending,
    inProgress,
    overdue,
    highPriority,
    createdThisWeek,
    completedThisWeek,
    completedLastWeek,
  ] = await Promise.all([
    prisma.task.count({ where: { workspaceId } }),
    prisma.task.count({
      where: { workspaceId, status: TaskStatus.COMPLETED },
    }),
    prisma.task.count({ where: { workspaceId, status: TaskStatus.PENDING } }),
    prisma.task.count({
      where: { workspaceId, status: TaskStatus.IN_PROGRESS },
    }),
    prisma.task.count({
      where: {
        workspaceId,
        status: { not: TaskStatus.COMPLETED },
        dueDate: { lt: now },
      },
    }),
    prisma.task.count({
      where: { workspaceId, priority: TaskPriority.HIGH },
    }),
    prisma.task.count({
      where: { workspaceId, createdAt: { gte: weekAgo } },
    }),
    prisma.task.count({
      where: {
        workspaceId,
        status: TaskStatus.COMPLETED,
        updatedAt: { gte: weekAgo },
      },
    }),
    prisma.task.count({
      where: {
        workspaceId,
        status: TaskStatus.COMPLETED,
        updatedAt: { gte: twoWeeksAgo, lt: weekAgo },
      },
    }),
  ]);

  return {
    totalTasks: total,
    completedTasks: completed,
    pendingTasks: pending,
    inProgressTasks: inProgress,
    overdueTasks: overdue,
    highPriorityTasks: highPriority,
    tasksCreatedThisWeek: createdThisWeek,
    tasksCompletedThisWeek: completedThisWeek,
    tasksCompletedLastWeek: completedLastWeek,
  };
}

/**
 * Resolves team member IDs by name (fuzzy match) for task assignment.
 * Used by the AI Planner to map "Rahul" → userId.
 */
export async function resolve_member_by_name(
  workspaceId: string,
  name: string
): Promise<{ id: string; name: string | null; email: string } | null> {
  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  const normalized = name.toLowerCase().trim();
  const match = members.find(
    (m) =>
      m.user.name?.toLowerCase().includes(normalized) ||
      m.user.email.toLowerCase().includes(normalized)
  );

  return match ? match.user : null;
}

/**
 * Returns completed tasks in the past N days (for weekly reports).
 */
export async function get_completed_tasks_since(
  workspaceId: string,
  days: number
): Promise<AITaskContext[]> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const tasks = await prisma.task.findMany({
    where: {
      workspaceId,
      status: TaskStatus.COMPLETED,
      updatedAt: { gte: since },
    },
    include: {
      assignedTo: { select: { name: true, email: true } },
      createdBy: { select: { name: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });

  return tasks.map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    status: t.status,
    priority: t.priority,
    dueDate: t.dueDate ? t.dueDate.toISOString().split("T")[0] : null,
    assigneeName: t.assignedTo?.name ?? null,
    assigneeEmail: t.assignedTo?.email ?? null,
    createdByName: t.createdBy?.name ?? null,
    createdAt: t.createdAt.toISOString().split("T")[0],
    commentCount: 0,
    activitySummary: [],
  }));
}
