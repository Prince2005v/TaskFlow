"use client";

import { useState } from "react";
import {
  Plus,
  ListTodo,
  UserCheck,
  Calendar,
  Layers,
  RefreshCw,
  Search,
} from "lucide-react";
import { TaskStatus } from "@prisma/client";
import { SafeUser, TaskWithUsers } from "@/types/task";
import { TaskCard } from "./task-card";
import { CreateTaskModal } from "./create-task-modal";
import { toast } from "sonner";

interface TaskWorkspaceProps {
  initialMyTasks: TaskWithUsers[];
  initialAssignedTasks: TaskWithUsers[];
  users: SafeUser[];
  currentUserId: string;
}

export function TaskWorkspace({
  initialMyTasks,
  initialAssignedTasks,
  users,
  currentUserId,
}: TaskWorkspaceProps) {
  const [myTasks, setMyTasks] = useState<TaskWithUsers[]>(initialMyTasks);
  const [assignedTasks, setAssignedTasks] = useState<TaskWithUsers[]>(initialAssignedTasks);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const refreshTasks = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/tasks");
      if (!res.ok) throw new Error("Failed to refresh tasks");
      const data = await res.json();
      setMyTasks(data.myTasks || []);
      setAssignedTasks(data.assignedTasks || []);
      toast.success("Tasks refreshed");
    } catch {
      toast.error("Could not refresh tasks");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleTaskCreated = (newTask: TaskWithUsers) => {
    setMyTasks((prev) => [newTask, ...prev]);
    // If the task was also assigned to current user, add to assignedTasks too
    if (newTask.assignedToId === currentUserId) {
      setAssignedTasks((prev) => [newTask, ...prev]);
    }
  };

  const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
    setMyTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );
    setAssignedTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );
  };

  const filterTasks = (taskList: TaskWithUsers[]) => {
    if (!searchQuery.trim()) return taskList;
    const query = searchQuery.toLowerCase();
    return taskList.filter(
      (t) =>
        t.title.toLowerCase().includes(query) ||
        (t.description && t.description.toLowerCase().includes(query)) ||
        (t.assignedTo?.name && t.assignedTo.name.toLowerCase().includes(query)) ||
        (t.createdBy?.name && t.createdBy.name.toLowerCase().includes(query))
    );
  };

  const filteredMyTasks = filterTasks(myTasks);
  const filteredAssignedTasks = filterTasks(assignedTasks);

  return (
    <>
      {/* Action Bar: Search, Refresh & Create Task */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-8 border-b border-zinc-800/60">
        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter tasks..."
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900/80 pl-9 pr-3.5 py-2 text-xs text-white placeholder-zinc-500 outline-none transition-all focus:border-zinc-700 focus:ring-2 focus:ring-blue-500/40"
            />
          </div>

          <button
            type="button"
            onClick={refreshTasks}
            disabled={isRefreshing}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/80 text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh tasks"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer self-start sm:self-auto active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          <span>Create Task</span>
        </button>
      </div>

      {/* Task Sections Grid */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Section 1: My Tasks */}
        <section className="flex flex-col rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-6 shadow-sm backdrop-blur-sm">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600/10 border border-blue-500/20 text-blue-400">
                <ListTodo className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-white">My Tasks</h2>
                <p className="text-xs text-zinc-400">Tasks created by you</p>
              </div>
            </div>
            <span className="rounded-full border border-zinc-800 bg-zinc-900 px-2.5 py-0.5 text-xs font-medium text-zinc-300">
              {filteredMyTasks.length} {filteredMyTasks.length === 1 ? "Task" : "Tasks"}
            </span>
          </div>

          {/* Cards List or Empty State */}
          <div className="mt-6 flex-1">
            {filteredMyTasks.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {filteredMyTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    currentUserId={currentUserId}
                    onStatusChange={handleStatusChange}
                  />
                ))}
              </div>
            ) : (
              <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-zinc-800 p-8 text-center bg-zinc-950/30">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900 border border-zinc-800 text-zinc-500 mb-3">
                  <Calendar className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-medium text-zinc-300">
                  {searchQuery ? "No matching tasks found" : "No tasks created yet"}
                </h3>
                <p className="mt-1 text-xs text-zinc-500 max-w-xs">
                  {searchQuery
                    ? "Try adjusting your search query to find what you are looking for."
                    : "Get started by creating your first task to track your work and priorities."}
                </p>
                {!searchQuery && (
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(true)}
                    className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-400 hover:bg-blue-500/20 transition-colors cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Create a Task</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Section 2: Assigned Tasks */}
        <section className="flex flex-col rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-6 shadow-sm backdrop-blur-sm">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600/10 border border-emerald-500/20 text-emerald-400">
                <UserCheck className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-white">Assigned Tasks</h2>
                <p className="text-xs text-zinc-400">Tasks assigned to you</p>
              </div>
            </div>
            <span className="rounded-full border border-zinc-800 bg-zinc-900 px-2.5 py-0.5 text-xs font-medium text-zinc-300">
              {filteredAssignedTasks.length} {filteredAssignedTasks.length === 1 ? "Task" : "Tasks"}
            </span>
          </div>

          {/* Cards List or Empty State */}
          <div className="mt-6 flex-1">
            {filteredAssignedTasks.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {filteredAssignedTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    currentUserId={currentUserId}
                    onStatusChange={handleStatusChange}
                  />
                ))}
              </div>
            ) : (
              <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-zinc-800 p-8 text-center bg-zinc-950/30">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900 border border-zinc-800 text-zinc-500 mb-3">
                  <Layers className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-medium text-zinc-300">
                  {searchQuery ? "No matching tasks found" : "No assigned tasks"}
                </h3>
                <p className="mt-1 text-xs text-zinc-500 max-w-xs">
                  {searchQuery
                    ? "Try adjusting your search query."
                    : "When teammates assign tasks to your account, they will automatically appear here."}
                </p>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        users={users}
        onTaskCreated={handleTaskCreated}
        currentUserId={currentUserId}
      />
    </>
  );
}
