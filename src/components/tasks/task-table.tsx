"use client";

import { useState, useMemo } from "react";
import {
  Search,
  Filter,
  ArrowUpDown,
  Calendar,
  CircleDashed,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  X,
  Plus,
} from "lucide-react";
import { TaskStatus, TaskPriority } from "@prisma/client";
import { TaskWithUsers, SafeUser } from "@/types/task";

interface TaskTableProps {
  tasks: TaskWithUsers[];
  users: SafeUser[];
  onSelectTask: (task: TaskWithUsers) => void;
  onCreateTaskClick?: () => void;
  emptyMessage?: string;
}

export function TaskTable({
  tasks,
  users,
  onSelectTask,
  onCreateTaskClick,
  emptyMessage = "No tasks found in this view",
}: TaskTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"created_desc" | "created_asc" | "due_asc" | "priority_desc">(
    "created_desc"
  );

  // Filter and sort tasks
  const filteredAndSortedTasks = useMemo(() => {
    let result = [...tasks];

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.description && t.description.toLowerCase().includes(q)) ||
          (t.assignedTo?.name && t.assignedTo.name.toLowerCase().includes(q)) ||
          (t.createdBy?.name && t.createdBy.name.toLowerCase().includes(q))
      );
    }

    // Filter by status
    if (statusFilter !== "ALL") {
      result = result.filter((t) => t.status === statusFilter);
    }

    // Filter by priority
    if (priorityFilter !== "ALL") {
      result = result.filter((t) => t.priority === priorityFilter);
    }

    // Filter by assignee
    if (assigneeFilter !== "ALL") {
      if (assigneeFilter === "UNASSIGNED") {
        result = result.filter((t) => !t.assignedToId);
      } else {
        result = result.filter((t) => t.assignedToId === assigneeFilter);
      }
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === "created_desc") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === "created_asc") {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortBy === "due_asc") {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      if (sortBy === "priority_desc") {
        const order: Record<TaskPriority, number> = {
          HIGH: 3,
          MEDIUM: 2,
          LOW: 1,
        };
        return order[b.priority] - order[a.priority];
      }
      return 0;
    });

    return result;
  }, [tasks, searchQuery, statusFilter, priorityFilter, assigneeFilter, sortBy]);

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    statusFilter !== "ALL" ||
    priorityFilter !== "ALL" ||
    assigneeFilter !== "ALL";

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("ALL");
    setPriorityFilter("ALL");
    setAssigneeFilter("ALL");
  };

  const getPriorityBadge = (p: TaskPriority) => {
    switch (p) {
      case TaskPriority.LOW:
        return (
          <span className="inline-flex items-center gap-1 rounded-md border border-sky-500/20 bg-sky-500/10 px-2 py-0.5 text-[11px] font-medium text-sky-400">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
            Low
          </span>
        );
      case TaskPriority.MEDIUM:
        return (
          <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-400">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            Medium
          </span>
        );
      case TaskPriority.HIGH:
        return (
          <span className="inline-flex items-center gap-1 rounded-md border border-rose-500/20 bg-rose-500/10 px-2 py-0.5 text-[11px] font-medium text-rose-400">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
            High
          </span>
        );
    }
  };

  const getStatusBadge = (s: TaskStatus) => {
    switch (s) {
      case TaskStatus.PENDING:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-300">
            <CircleDashed className="h-3 w-3 text-amber-400" />
            Pending
          </span>
        );
      case TaskStatus.IN_PROGRESS:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-md border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 text-[11px] font-medium text-blue-300">
            <Clock className="h-3 w-3 text-blue-400" />
            In Progress
          </span>
        );
      case TaskStatus.COMPLETED:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-300">
            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
            Completed
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls Bar: Search, Filters & Sorters */}
      <div className="flex flex-col gap-3 rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks by title, description or member..."
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 pl-9 pr-3.5 py-2 text-xs text-white placeholder-zinc-500 outline-none transition-all focus:border-zinc-700 focus:ring-2 focus:ring-blue-500/40"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <ArrowUpDown className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(
                  e.target.value as "created_desc" | "created_asc" | "due_asc" | "priority_desc"
                )
              }
              className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs text-zinc-200 outline-none focus:border-zinc-700 cursor-pointer"
            >
              <option value="created_desc">Newest First</option>
              <option value="created_asc">Oldest First</option>
              <option value="due_asc">Due Date (Soonest)</option>
              <option value="priority_desc">Priority (High to Low)</option>
            </select>
          </div>
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-zinc-800/60 text-xs text-zinc-400">
          <div className="flex items-center gap-1.5 mr-1 font-medium text-zinc-400">
            <Filter className="h-3.5 w-3.5" />
            <span>Filters:</span>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 py-1 text-xs text-zinc-300 outline-none focus:border-zinc-700 cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value={TaskStatus.PENDING}>Pending</option>
            <option value={TaskStatus.IN_PROGRESS}>In Progress</option>
            <option value={TaskStatus.COMPLETED}>Completed</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 py-1 text-xs text-zinc-300 outline-none focus:border-zinc-700 cursor-pointer"
          >
            <option value="ALL">All Priorities</option>
            <option value={TaskPriority.HIGH}>High</option>
            <option value={TaskPriority.MEDIUM}>Medium</option>
            <option value={TaskPriority.LOW}>Low</option>
          </select>

          {/* Assignee Filter */}
          <select
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
            className="rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 py-1 text-xs text-zinc-300 outline-none focus:border-zinc-700 cursor-pointer"
          >
            <option value="ALL">All Assignees</option>
            <option value="UNASSIGNED">Unassigned</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name || u.email}
              </option>
            ))}
          </select>

          {/* Clear Filters button */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 transition-colors ml-auto cursor-pointer"
            >
              <X className="h-3 w-3" />
              <span>Reset filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Task Count Summary */}
      <div className="flex items-center justify-between px-1 text-xs text-zinc-400">
        <span>
          Showing <strong className="text-zinc-200">{filteredAndSortedTasks.length}</strong> of{" "}
          <strong className="text-zinc-200">{tasks.length}</strong> tasks
        </span>
      </div>

      {/* Main Content: Desktop Table & Mobile Cards */}
      {filteredAndSortedTasks.length > 0 ? (
        <>
          {/* Desktop Table (Hidden on small mobile) */}
          <div className="hidden md:block overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/40 shadow-sm">
            <table className="w-full text-left text-xs text-zinc-300 border-collapse">
              <thead className="bg-zinc-900/90 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-800">
                <tr>
                  <th scope="col" className="py-3.5 pl-4 pr-3">
                    Task
                  </th>
                  <th scope="col" className="px-3 py-3.5">
                    Status
                  </th>
                  <th scope="col" className="px-3 py-3.5">
                    Priority
                  </th>
                  <th scope="col" className="px-3 py-3.5">
                    Assignee
                  </th>
                  <th scope="col" className="px-3 py-3.5">
                    Due Date
                  </th>
                  <th scope="col" className="px-3 py-3.5">
                    Created
                  </th>
                  <th scope="col" className="py-3.5 pl-3 pr-4 text-right">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filteredAndSortedTasks.map((t) => {
                  let formattedDueDate = "—";
                  let isOverdue = false;
                  let isDueToday = false;

                  if (t.dueDate) {
                    const d = new Date(t.dueDate);
                    formattedDueDate = d.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    });

                    const now = new Date();
                    const todayStr = now.toISOString().split("T")[0];
                    const dueStr = d.toISOString().split("T")[0];

                    if (t.status !== TaskStatus.COMPLETED) {
                      if (dueStr < todayStr) isOverdue = true;
                      if (dueStr === todayStr) isDueToday = true;
                    }
                  }

                  const formattedCreated = new Date(t.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  });

                  return (
                    <tr
                      key={t.id}
                      onClick={() => onSelectTask(t)}
                      className="hover:bg-zinc-800/40 transition-colors cursor-pointer group"
                    >
                      {/* Title & snippet */}
                      <td className="py-3.5 pl-4 pr-3">
                        <div className="font-medium text-white group-hover:text-blue-400 transition-colors">
                          {t.title}
                        </div>
                        {t.description && (
                          <div className="text-[11px] text-zinc-500 line-clamp-1 max-w-xs sm:max-w-sm mt-0.5">
                            {t.description}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-3 py-3.5 whitespace-nowrap">
                        {getStatusBadge(t.status)}
                      </td>

                      {/* Priority */}
                      <td className="px-3 py-3.5 whitespace-nowrap">
                        {getPriorityBadge(t.priority)}
                      </td>

                      {/* Assignee */}
                      <td className="px-3 py-3.5 whitespace-nowrap">
                        {t.assignedTo ? (
                          <div className="flex items-center gap-2">
                            {t.assignedTo.image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={t.assignedTo.image}
                                alt={t.assignedTo.name || "User"}
                                className="h-5 w-5 rounded-full object-cover border border-zinc-700"
                              />
                            ) : (
                              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-800 text-[10px] font-bold text-zinc-300">
                                {(t.assignedTo.name || t.assignedTo.email).slice(0, 2).toUpperCase()}
                              </div>
                            )}
                            <span className="text-zinc-300 truncate max-w-[120px]">
                              {t.assignedTo.name || t.assignedTo.email}
                            </span>
                          </div>
                        ) : (
                          <span className="text-zinc-500 italic">Unassigned</span>
                        )}
                      </td>

                      {/* Due date */}
                      <td className="px-3 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={
                              isOverdue
                                ? "text-rose-400 font-medium"
                                : isDueToday
                                ? "text-amber-400 font-medium"
                                : "text-zinc-400"
                            }
                          >
                            {formattedDueDate}
                          </span>
                          {isOverdue && (
                            <span className="rounded bg-rose-500/20 px-1.5 py-0.2 text-[10px] font-semibold text-rose-400">
                              Overdue
                            </span>
                          )}
                          {isDueToday && (
                            <span className="rounded bg-amber-500/20 px-1.5 py-0.2 text-[10px] font-semibold text-amber-400">
                              Today
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Created date */}
                      <td className="px-3 py-3.5 whitespace-nowrap text-zinc-400">
                        {formattedCreated}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 pl-3 pr-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectTask(t);
                          }}
                          className="inline-flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900/80 px-2.5 py-1 text-[11px] font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
                        >
                          <span>View</span>
                          <ExternalLink className="h-3 w-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards (Visible only on < 768px) */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {filteredAndSortedTasks.map((t) => {
              let formattedDueDate = "No due date";
              let isOverdue = false;
              let isDueToday = false;

              if (t.dueDate) {
                const d = new Date(t.dueDate);
                formattedDueDate = d.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });

                const now = new Date();
                const todayStr = now.toISOString().split("T")[0];
                const dueStr = d.toISOString().split("T")[0];

                if (t.status !== TaskStatus.COMPLETED) {
                  if (dueStr < todayStr) isOverdue = true;
                  if (dueStr === todayStr) isDueToday = true;
                }
              }

              return (
                <div
                  key={t.id}
                  onClick={() => onSelectTask(t)}
                  className="rounded-xl border border-zinc-800/80 bg-zinc-900/70 p-4 shadow-sm hover:border-zinc-700 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-semibold text-white line-clamp-2">
                      {t.title}
                    </h4>
                    {getPriorityBadge(t.priority)}
                  </div>

                  {t.description && (
                    <p className="mt-2 text-xs text-zinc-400 line-clamp-2">
                      {t.description}
                    </p>
                  )}

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-zinc-800/60 text-xs">
                    <div className="flex items-center gap-2">
                      {getStatusBadge(t.status)}
                    </div>

                    <div className="flex items-center gap-2 text-zinc-400">
                      <Calendar className="h-3.5 w-3.5" />
                      <span
                        className={
                          isOverdue
                            ? "text-rose-400 font-medium"
                            : isDueToday
                            ? "text-amber-400 font-medium"
                            : ""
                        }
                      >
                        {formattedDueDate}
                      </span>
                    </div>
                  </div>

                  {t.assignedTo && (
                    <div className="mt-3 flex items-center gap-2 text-[11px] text-zinc-400">
                      <span className="text-zinc-500">Assigned:</span>
                      <span className="text-zinc-300 font-medium">
                        {t.assignedTo.name || t.assignedTo.email}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800 p-12 text-center bg-zinc-950/30">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-500 mb-4">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-200">
            {hasActiveFilters ? "No tasks match your filters" : emptyMessage}
          </h3>
          <p className="mt-1 text-xs text-zinc-400 max-w-sm">
            {hasActiveFilters
              ? "Try clearing some filters or refining your search keywords."
              : "Create a new task to organize your deliverables and start tracking team progress."}
          </p>

          <div className="mt-5 flex items-center gap-3">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="rounded-lg border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
              >
                Clear all filters
              </button>
            )}
            {onCreateTaskClick && !hasActiveFilters && (
              <button
                type="button"
                onClick={onCreateTaskClick}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition-colors cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Create Task</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
