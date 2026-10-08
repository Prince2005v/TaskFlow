"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { signOut } from "next-auth/react";
import { TaskStatus } from "@prisma/client";
import {
  SafeUser,
  TaskWithUsers,
  SafeWorkspace,
  InAppNotification,
  WorkspaceMemberWithUser,
} from "@/types/task";
import { Sidebar, WorkspaceView } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { OverviewMetrics } from "./overview-metrics";
import { TaskTable } from "@/components/tasks/task-table";
import { TeamView } from "@/components/team/team-view";
import { SettingsView } from "@/components/settings/settings-view";
import { CreateTaskModal } from "@/components/tasks/create-task-modal";
import { TaskDetailModal } from "@/components/tasks/task-detail-modal";
import { CommandPalette } from "@/components/ui/command-palette";
import { AIPlanner } from "@/components/ai/ai-planner";
import { AIInsightsView } from "@/components/ai/ai-insights-view";
import { AIWeeklyReportView } from "@/components/ai/ai-weekly-report";
import { AIChat } from "@/components/ai/ai-chat";

interface WorkspaceShellProps {
  initialMyTasks: TaskWithUsers[];
  initialAssignedTasks: TaskWithUsers[];
  initialUsers: SafeUser[];
  initialMembers?: WorkspaceMemberWithUser[];
  currentUser: SafeUser;
  workspace: SafeWorkspace;
  initialNotifications: InAppNotification[];
  initialTasks?: TaskWithUsers[];
}

export function WorkspaceShell({
  initialMyTasks,
  initialAssignedTasks,
  initialUsers,
  initialMembers,
  currentUser,
  workspace,
  initialNotifications,
  initialTasks,
}: WorkspaceShellProps) {
  // Merge tasks deduplicating by ID
  const initialCombinedTasks = useMemo(() => {
    if (initialTasks && initialTasks.length > 0) return initialTasks;
    const map = new Map<string, TaskWithUsers>();
    initialMyTasks.forEach((t) => map.set(t.id, t));
    initialAssignedTasks.forEach((t) => map.set(t.id, t));
    return Array.from(map.values());
  }, [initialTasks, initialMyTasks, initialAssignedTasks]);

  const [tasks, setTasks] = useState<TaskWithUsers[]>(initialCombinedTasks);
  const [users, setUsers] = useState<SafeUser[]>(initialUsers);
  const [members, setMembers] = useState<WorkspaceMemberWithUser[]>(initialMembers || []);
  const [workspaceState, setWorkspaceState] = useState<SafeWorkspace>(workspace);
  const [notifications, setNotifications] = useState<InAppNotification[]>(initialNotifications || []);

  const [activeView, setActiveView] = useState<WorkspaceView>(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const viewParam = params.get("view") as WorkspaceView | null;
      const validViews = [
        "dashboard",
        "tasks",
        "assigned",
        "created",
        "completed",
        "team",
        "settings",
        "ai-planner",
        "ai-insights",
        "ai-report",
      ];
      if (viewParam && validViews.includes(viewParam)) {
        return viewParam;
      }
    }
    return "dashboard";
  });

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskWithUsers | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Global Cmd+K / Ctrl+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Sync active view on browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const viewParam = params.get("view") as WorkspaceView | null;
      const validViews = [
        "dashboard",
        "tasks",
        "assigned",
        "created",
        "completed",
        "team",
        "settings",
        "ai-planner",
        "ai-insights",
        "ai-report",
      ];
      if (viewParam && validViews.includes(viewParam)) {
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

  // Refreshes tasks, members and users from server APIs
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [tasksRes, usersRes, membersRes, notificationsRes] = await Promise.all([
        fetch("/api/tasks"),
        fetch("/api/users"),
        fetch("/api/workspace/members"),
        fetch("/api/notifications"),
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

      if (membersRes.ok) {
        const membersData = await membersRes.json();
        setMembers(membersData.members || []);
      }

      if (notificationsRes.ok) {
        const notifData = await notificationsRes.json();
        setNotifications(notifData.notifications || []);
      }

      toast.success("Workspace synchronized with latest data");
    } catch {
      toast.error("Could not refresh workspace");
    } finally {
      setIsRefreshing(false);
    }
  }, []);

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
        workspace={workspaceState}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
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
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          initialNotifications={notifications}
          onNotificationTaskSelect={(taskId) => {
            const match = tasks.find((t) => t.id === taskId);
            if (match) setSelectedTask(match);
          }}
        />

        {/* View Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeView === "dashboard" && (
            <OverviewMetrics
              tasks={tasks}
              userName={currentUser.name || "Teammate"}
              currentUserId={currentUser.id}
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
              workspaceRole={workspaceState.role}
              initialMembers={members}
              onMemberAdded={(newMember) => {
                setUsers((prev) => [...prev, newMember]);
              }}
              onMemberRemoved={(userId) => {
                setUsers((prev) => prev.filter((u) => u.id !== userId));
              }}
            />
          )}

          {activeView === "settings" && (
            <SettingsView
              currentUser={currentUser}
              workspace={workspaceState}
              onWorkspaceUpdated={(updatedWs) => setWorkspaceState(updatedWs)}
            />
          )}

          {/* ✨ AI Views */}
          {activeView === "ai-planner" && (
            <div className="space-y-4">
              <div className="pb-2 border-b border-zinc-800/60">
                <h1 className="text-2xl font-bold tracking-tight text-white">
                  AI Task Planner
                </h1>
                <p className="mt-1 text-xs text-zinc-400">
                  Describe your project goal in plain language and let AI generate a structured task plan.
                </p>
              </div>
              <AIPlanner onTasksCreated={handleRefresh} />
            </div>
          )}

          {activeView === "ai-insights" && (
            <div className="space-y-4">
              <div className="pb-2 border-b border-zinc-800/60">
                <h1 className="text-2xl font-bold tracking-tight text-white">
                  AI Team Insights
                </h1>
                <p className="mt-1 text-xs text-zinc-400">
                  AI-powered analysis of your team&apos;s productivity, workload, and potential blockers.
                </p>
              </div>
              <AIInsightsView workspaceName={workspaceState.name || "Workspace"} />
            </div>
          )}

          {activeView === "ai-report" && (
            <div className="space-y-4">
              <div className="pb-2 border-b border-zinc-800/60">
                <h1 className="text-2xl font-bold tracking-tight text-white">
                  AI Weekly Report
                </h1>
                <p className="mt-1 text-xs text-zinc-400">
                  AI-generated weekly summary of team performance, completed work, and recommended priorities.
                </p>
              </div>
              <AIWeeklyReportView />
            </div>
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
        workspaceRole={workspaceState.role}
        users={users}
        onTaskUpdated={handleTaskUpdated}
        onTaskDeleted={handleTaskDeleted}
      />

      {/* Keyboard-Accessible Command Palette (Cmd+K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectView={handleSelectView}
        onCreateTaskClick={() => setIsCreateModalOpen(true)}
        onSelectTask={(task) => setSelectedTask(task)}
        tasks={tasks}
        users={users}
        onSignOutClick={() => signOut({ callbackUrl: "/login" })}
      />

      {/* AI Chat Assistant (floating) */}
      <AIChat />
    </div>
  );
}
