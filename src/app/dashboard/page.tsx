import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { LogoutButton } from "./logout-button";
import { TaskWorkspace } from "@/components/tasks/task-workspace";
import { CheckSquare, Sparkles } from "lucide-react";
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

  // Clean serialization for client component
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

  const displayName = currentUser.name || "User";
  const userInitials = displayName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col selection:bg-blue-500/30 selection:text-white">
      {/* Top Navigation */}
      <header className="sticky top-0 z-30 border-b border-zinc-800/80 bg-zinc-900/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          {/* Logo / Brand */}
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600/10 border border-blue-500/20 text-blue-400 shadow-inner">
              <CheckSquare className="h-5 w-5 text-blue-400" />
            </div>
            <span className="text-base font-bold tracking-tight text-white">
              TaskFlow
            </span>
          </div>

          {/* User profile & Logout */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              {currentUser.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={currentUser.image}
                  alt={displayName}
                  className="h-9 w-9 rounded-full border border-zinc-700 object-cover ring-2 ring-blue-500/20"
                />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800 text-xs font-semibold text-zinc-300">
                  {userInitials || "U"}
                </div>
              )}
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-sm font-medium text-white leading-tight">
                  {displayName}
                </span>
                <span className="text-xs text-zinc-400 leading-tight">
                  {currentUser.email}
                </span>
              </div>
            </div>

            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Welcome Banner */}
        <div className="pb-8">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-blue-400 mb-1">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Workspace Overview</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Welcome, {displayName}
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Signed in as{" "}
            <span className="text-zinc-300 font-medium">{currentUser.email}</span>
          </p>
        </div>

        {/* Task Management Workspace */}
        <TaskWorkspace
          initialMyTasks={initialMyTasks}
          initialAssignedTasks={initialAssignedTasks}
          users={users}
          currentUserId={currentUser.id}
        />
      </main>
    </div>
  );
}
