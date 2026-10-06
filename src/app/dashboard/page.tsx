import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { WorkspaceShell } from "@/components/dashboard/workspace-shell";
import { TaskWithUsers, SafeUser } from "@/types/task";

export default async function DashboardPage() {
  const currentUser = await getAuthUser();

  if (!currentUser) {
    redirect("/login");
  }

  // Fetch initial tasks and registered users directly from PostgreSQL
  const [myTasksDb, assignedTasksDb, usersDb] = await Promise.all([
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
    prisma.user.findMany({
      select: { id: true, name: true, email: true, image: true },
      orderBy: [{ name: "asc" }, { email: "asc" }],
    }),
  ]);

  // Clean serialization for client components
  const initialMyTasks: TaskWithUsers[] = myTasksDb.map((t) => ({
    ...t,
    dueDate: t.dueDate ? t.dueDate.toISOString() : null,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  }));

  const initialAssignedTasks: TaskWithUsers[] = assignedTasksDb.map((t) => ({
    ...t,
    dueDate: t.dueDate ? t.dueDate.toISOString() : null,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  }));

  const users: SafeUser[] = usersDb;

  const safeCurrentUser: SafeUser = {
    id: currentUser.id,
    name: currentUser.name,
    email: currentUser.email,
    image: currentUser.image,
  };

  return (
    <WorkspaceShell
      initialMyTasks={initialMyTasks}
      initialAssignedTasks={initialAssignedTasks}
      initialUsers={users}
      currentUser={safeCurrentUser}
    />
  );
}
