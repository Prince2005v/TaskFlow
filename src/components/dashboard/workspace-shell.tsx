"use client";

import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import { TaskStatus } from "@prisma/client";
import { SafeUser, TaskWithUsers } from "@/types/task";
import { Sidebar, WorkspaceView } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { OverviewMetrics } from "./overview-metrics";
import { TaskTable } from "@/components/tasks/task-table";
import { TeamView } from "@/components/team/team-view";
import { SettingsView } from "@/components/settings/settings-view";
import { CreateTaskModal } from "@/components/tasks/create-task-modal";
import { TaskDetailModal } from "@/components/tasks/task-detail-modal";

interface WorkspaceShellProps {
  initialMyTasks: TaskWithUsers[];
  initialAssignedTasks: TaskWithUsers[];
  initialUsers: SafeUser[];
  currentUser: SafeUser;
}

export function WorkspaceShell({
  initialMyTasks,
  initialAssignedTasks,
  initialUsers,
  currentUser,
}: WorkspaceShellProps) {
  // Merge tasks deduplicating by ID
  const initialCombinedTasks = useMemo(() => {
    const map = new Map<string, TaskWithUsers>();
    initialMyTasks.forEach((t) => map.set(t.id, t));
    initialAssignedTasks.forEach((t) => map.set(t.id, t));
    return Array.from(map.values());
  }, [initialMyTasks, initialAssignedTasks]);

  const [tasks, setTasks] = useState<TaskWithUsers[]>(initialCombinedTasks);
  const [users, setUsers] = useState<SafeUser[]>(initialUsers);
  const [activeView, setActiveView] = useState<WorkspaceView>(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const viewParam = params.get("view") as WorkspaceView | null;
      if (
        viewParam &&
        ["dashboard", "tasks", "assigned", "created", "completed", "team", "settings"].includes(
          viewParam
        )
      ) {
        return viewParam;
      }
    }
    return "dashboard";
  });

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskWithUsers | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Sync active view on browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const viewParam = params.get("view") as WorkspaceView | null;
      if (
        viewParam &&
        ["dashboard", "tasks", "assigned", "created", "completed", "team", "settings"].includes(
          viewParam
        )
      ) {
        setActiveView(viewParam);
      } else {
        setActiveView("dashboard");
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handleSelectView = (view: WorkspaceView) => {
    setActiveView(view);
    const url = new URL(window.location.href);
    if (view === "dashboard") {
      url.searchParams.delete("view");
    } else {
      url.searchParams.set("view", view);
    }
    window.history.replaceState({}, "", url.toString());
  };

  // Refreshes tasks and users from server APIs
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const [tasksRes, usersRes] = await Promise.all([
        fetch("/api/tasks"),
        fetch("/api/users"),
      ]);

      if (!tasksRes.ok) throw new Error("Failed to fetch tasks");
      const tasksData = await tasksRes.json();

      const map = new Map<string, TaskWithUsers>();
      (tasksData.myTasks || []).forEach((t: TaskWithUsers) => map.set(t.id, t));
      (tasksData.assignedTasks || []).forEach((t: TaskWithUsers) => map.set(t.id, t));
      setTasks(Array.from(map.values()));

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData.users || []);
      }

      toast.success("Workspace synchronized with latest data");
    } catch {
      toast.error("Could not refresh workspace");
    } finally {
      setIsRefreshing(false);
    }
  };

  // Task mutation handlers
  const handleTaskCreated = (newTask: TaskWithUsers) => {
    setTasks((prev) => [newTask, ...prev]);
  };

  const handleTaskUpdated = (updatedTask: TaskWithUsers) => {
    setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
    if (selectedTask?.id === updatedTask.id) {
      setSelectedTask(updatedTask);
    }
  };

  const handleTaskDeleted = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    if (selectedTask?.id === taskId) {
      setSelectedTask(null);
    }
  };

  // Filtered task lists for views
  const assignedToMeTasks = useMemo(() => {
    return tasks.filter((t) => t.assignedToId === currentUser.id);
  }, [tasks, currentUser.id]);

  const createdByMeTasks = useMemo(() => {
    return tasks.filter((t) => t.createdById === currentUser.id);
  }, [tasks, currentUser.id]);

  const completedTasks = useMemo(() => {
    return tasks.filter((t) => t.status === TaskStatus.COMPLETED);
  }, [tasks]);

  const taskCounts = {
    all: tasks.length,
    assigned: assignedToMeTasks.length,
    created: createdByMeTasks.length,
    completed: completedTasks.length,
  };

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100 selection:bg-blue-600/30 selection:text-white">
      {/* Sidebar (Desktop + Mobile Drawer) */}
      <Sidebar
        activeView={activeView}
        onSelectView={handleSelectView}
        currentUser={currentUser}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        taskCounts={taskCounts}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Header Bar */}
        <Header
          activeView={activeView}
          onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
          onCreateTaskClick={() => setIsCreateModalOpen(true)}
          onRefreshClick={handleRefresh}
          isRefreshing={isRefreshing}
        />

        {/* View Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeView === "dashboard" && (
            <OverviewMetrics
              tasks={tasks}
              userName={currentUser.name || "Teammate"}
              onCreateTaskClick={() => setIsCreateModalOpen(true)}
              onSelectTask={(task) => setSelectedTask(task)}
              onViewAllTasksClick={() => handleSelectView("tasks")}
            />
          )}

          {activeView === "tasks" && (
            <div className="space-y-4">
              <div className="pb-2 border-b border-zinc-800/60">
                <h1 className="text-2xl font-bold tracking-tight text-white">
                  All Workspace Tasks
                </h1>
                <p className="mt-1 text-xs text-zinc-400">
                  Search, filter, and track all deliverables across your team.
                </p>
              </div>
              <TaskTable
                tasks={tasks}
                users={users}
                onSelectTask={(task) => setSelectedTask(task)}
                onCreateTaskClick={() => setIsCreateModalOpen(true)}
                emptyMessage="No tasks found in the workspace"
              />
            </div>
          )}

          {activeView === "assigned" && (
            <div className="space-y-4">
              <div className="pb-2 border-b border-zinc-800/60">
                <h1 className="text-2xl font-bold tracking-tight text-white">
                  Assigned to Me
                </h1>
                <p className="mt-1 text-xs text-zinc-400">
                  Deliverables and items where you have designated ownership.
                </p>
              </div>
              <TaskTable
                tasks={assignedToMeTasks}
                users={users}
                onSelectTask={(task) => setSelectedTask(task)}
                onCreateTaskClick={() => setIsCreateModalOpen(true)}
                emptyMessage="You have no assigned tasks right now"
              />
            </div>
          )}

          {activeView === "created" && (
            <div className="space-y-4">
              <div className="pb-2 border-b border-zinc-800/60">
                <h1 className="text-2xl font-bold tracking-tight text-white">
                  Created by Me
                </h1>
                <p className="mt-1 text-xs text-zinc-400">
                  Tasks initiated and managed by your account.
                </p>
              </div>
              <TaskTable
                tasks={createdByMeTasks}
                users={users}
                onSelectTask={(task) => setSelectedTask(task)}
                onCreateTaskClick={() => setIsCreateModalOpen(true)}
                emptyMessage="You haven't created any tasks yet"
              />
            </div>
          )}

          {activeView === "completed" && (
            <div className="space-y-4">
              <div className="pb-2 border-b border-zinc-800/60">
                <h1 className="text-2xl font-bold tracking-tight text-white">
                  Completed Archive
                </h1>
                <p className="mt-1 text-xs text-zinc-400">
                  Verified and completed deliverables across the project.
                </p>
              </div>
              <TaskTable
                tasks={completedTasks}
                users={users}
                onSelectTask={(task) => setSelectedTask(task)}
                onCreateTaskClick={() => setIsCreateModalOpen(true)}
                emptyMessage="No completed tasks found"
              />
            </div>
          )}

          {activeView === "team" && (
            <TeamView
              users={users}
              tasks={tasks}
              currentUserId={currentUser.id}
            />
          )}

          {activeView === "settings" && (
            <SettingsView currentUser={currentUser} />
          )}
        </main>
      </div>

      {/* Global Create Task Modal */}
      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        users={users}
        onTaskCreated={handleTaskCreated}
        currentUserId={currentUser.id}
      />

      {/* Global Task Detail / Edit Modal */}
      <TaskDetailModal
        task={selectedTask}
        isOpen={selectedTask !== null}
        onClose={() => setSelectedTask(null)}
        currentUserId={currentUser.id}
        users={users}
        onTaskUpdated={handleTaskUpdated}
        onTaskDeleted={handleTaskDeleted}
      />
    </div>
  );
}
