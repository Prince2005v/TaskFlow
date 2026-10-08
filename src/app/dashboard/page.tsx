import { redirect } from "next/navigation";
import { getAuthUserWithWorkspace } from "@/lib/workspace-helpers";
import { prisma } from "@/lib/prisma";
import { WorkspaceShell } from "@/components/dashboard/workspace-shell";
import { TaskWithUsers, SafeUser, SafeWorkspace, InAppNotification, WorkspaceMemberWithUser } from "@/types/task";

export default async function DashboardPage() {
  const auth = await getAuthUserWithWorkspace();

  if (!auth) {
    redirect("/login");
  }

  const { user: currentUser, workspace } = auth;

  // Fetch workspace tasks, members, and in-app notifications directly from PostgreSQL
  const [allTasksDb, membersDb, notificationsDb] = await Promise.all([
    prisma.task.findMany({
      where: { workspaceId: workspace.id },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true, image: true },
        },
        assignedTo: {
          select: { id: true, name: true, email: true, image: true },
        },
        activities: {
          include: {
            user: { select: { id: true, name: true, email: true, image: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        comments: {
          include: {
            user: { select: { id: true, name: true, email: true, image: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.workspaceMember.findMany({
      where: { workspaceId: workspace.id },
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
      orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    }),
    prisma.notification.findMany({
      where: { userId: currentUser.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  // Clean serialization for client components
  const initialTasks: TaskWithUsers[] = allTasksDb.map((t) => ({
    ...t,
    dueDate: t.dueDate ? t.dueDate.toISOString() : null,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
    activities: (t.activities || []).map((a) => ({
      ...a,
      createdAt: a.createdAt.toISOString(),
    })),
    comments: (t.comments || []).map((c) => ({
      ...c,
      createdAt: c.createdAt.toISOString(),
    })),
  }));

  const initialMyTasks = initialTasks.filter((t) => t.createdById === currentUser.id);
  const initialAssignedTasks = initialTasks.filter((t) => t.assignedToId === currentUser.id);

  const initialUsers: SafeUser[] = membersDb.map((m) => m.user);

  const initialNotifications: InAppNotification[] = notificationsDb.map((n) => ({
    ...n,
    createdAt: n.createdAt.toISOString(),
  }));

  const initialMembers: WorkspaceMemberWithUser[] = membersDb.map((m) => ({
    id: m.id,
    workspaceId: m.workspaceId,
    userId: m.userId,
    role: m.role,
    user: m.user,
    createdAt: m.createdAt.toISOString(),
  }));

  const safeCurrentUser: SafeUser = {
    id: currentUser.id,
    name: currentUser.name,
    email: currentUser.email,
    image: currentUser.image,
  };

  const safeWorkspace: SafeWorkspace = workspace;

  return (
    <WorkspaceShell
      initialTasks={initialTasks}
      initialMyTasks={initialMyTasks}
      initialAssignedTasks={initialAssignedTasks}
      initialUsers={initialUsers}
      initialMembers={initialMembers}
      currentUser={safeCurrentUser}
      workspace={safeWorkspace}
      initialNotifications={initialNotifications}
    />
  );
}
