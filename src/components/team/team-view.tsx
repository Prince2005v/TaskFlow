"use client";

import { useState, useMemo } from "react";
import {
  Users,
  Search,
  CheckCircle2,
  Clock,
  UserCheck,
  Plus,
  Shield,
  Trash2,
  Loader2,
  AlertTriangle,
  Mail,
  X,
} from "lucide-react";
import { SafeUser, TaskWithUsers, WorkspaceRole, WorkspaceMemberWithUser } from "@/types/task";
import { TaskStatus } from "@prisma/client";
import { toast } from "sonner";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

interface TeamViewProps {
  users: SafeUser[];
  tasks: TaskWithUsers[];
  currentUserId: string;
  workspaceRole: WorkspaceRole;
  initialMembers?: WorkspaceMemberWithUser[];
  onMemberAdded?: (newMember: SafeUser) => void;
  onMemberRemoved?: (userId: string) => void;
}

export function TeamView({
  users,
  tasks,
  currentUserId,
  workspaceRole,
  initialMembers,
  onMemberAdded,
  onMemberRemoved,
}: TeamViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"MEMBER" | "ADMIN">("MEMBER");
  const [isInviting, setIsInviting] = useState(false);

  const [memberToRemove, setMemberToRemove] = useState<WorkspaceMemberWithUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Initialize members list from initialMembers or fallback
  const [members, setMembers] = useState<WorkspaceMemberWithUser[]>(() => {
    if (initialMembers && initialMembers.length > 0) return initialMembers;
    return users.map((u) => ({
      id: `member-${u.id}`,
      workspaceId: "workspace",
      userId: u.id,
      role: u.id === currentUserId && workspaceRole === WorkspaceRole.OWNER ? WorkspaceRole.OWNER : WorkspaceRole.MEMBER,
      user: u,
      createdAt: new Date().toISOString(),
    }));
  });

  const isOwner = workspaceRole === WorkspaceRole.OWNER;
  const isOwnerOrAdmin = workspaceRole === WorkspaceRole.OWNER || workspaceRole === WorkspaceRole.ADMIN;

  // Workload calculations per member
  const memberWorkloads = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];

    return members.map((member) => {
      const user = member.user;
      const assigned = tasks.filter((t) => t.assignedToId === user.id);
      const inProgress = assigned.filter((t) => t.status === TaskStatus.IN_PROGRESS).length;
      const completed = assigned.filter((t) => t.status === TaskStatus.COMPLETED).length;
      const pending = assigned.filter((t) => t.status === TaskStatus.PENDING).length;

      const overdue = assigned.filter((t) => {
        if (t.status === TaskStatus.COMPLETED || !t.dueDate) return false;
        return new Date(t.dueDate).toISOString().split("T")[0] < todayStr;
      }).length;

      const isCurrentUser = user.id === currentUserId;
      const canChangeRole = isOwner && member.userId !== currentUserId;
      const canRemove =
        (isOwner && member.role !== WorkspaceRole.OWNER) ||
        (workspaceRole === WorkspaceRole.ADMIN && member.role === WorkspaceRole.MEMBER);

      return {
        ...member,
        assignedTotal: assigned.length,
        inProgress,
        completed,
        pending,
        overdue,
        isCurrentUser,
        canChangeRole,
        canRemove,
      };
    });
  }, [members, tasks, currentUserId, isOwner, workspaceRole]);

  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return memberWorkloads;
    const q = searchQuery.toLowerCase();
    return memberWorkloads.filter(
      (m) =>
        (m.user.name && m.user.name.toLowerCase().includes(q)) ||
        m.user.email.toLowerCase().includes(q)
    );
  }, [memberWorkloads, searchQuery]);

  // Handle Invite Member
  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = inviteEmail.trim().toLowerCase();
    if (!email) return;

    setIsInviting(true);
    try {
      const res = await fetch("/api/workspace/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role: inviteRole }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add member");

      toast.success(data.message || "Member added successfully");
      if (data.member) {
        setMembers((prev) => [...prev, data.member]);
        if (data.member.user && onMemberAdded) {
          onMemberAdded(data.member.user);
        }
      }
      setInviteEmail("");
      setIsInviteModalOpen(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to invite member";
      toast.error(message);
    } finally {
      setIsInviting(false);
    }
  };

  // Handle Role Change (Owner only)
  const handleRoleChange = async (memberId: string, newRole: "ADMIN" | "MEMBER") => {
    try {
      const res = await fetch(`/api/workspace/members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update member role");

      setMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, role: newRole as WorkspaceRole } : m))
      );
      toast.success(`Role changed to ${newRole}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Role update failed";
      toast.error(message);
    }
  };

  // Handle Remove Member
  const handleRemoveMemberConfirm = async () => {
    if (!memberToRemove) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/workspace/members/${memberToRemove.id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to remove member");

      setMembers((prev) => prev.filter((m) => m.id !== memberToRemove.id));
      if (onMemberRemoved) {
        onMemberRemoved(memberToRemove.userId);
      }
      toast.success("Member removed from workspace");
      setMemberToRemove(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to remove member";
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  };

  const getRoleBadge = (role: WorkspaceRole) => {
    switch (role) {
      case WorkspaceRole.OWNER:
        return (
          <span className="inline-flex items-center gap-1 rounded-md border border-purple-500/20 bg-purple-500/10 px-2 py-0.5 text-[10px] font-bold text-purple-400">
            <Shield className="h-3 w-3" />
            OWNER
          </span>
        );
      case WorkspaceRole.ADMIN:
        return (
          <span className="inline-flex items-center gap-1 rounded-md border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-400">
            <Shield className="h-3 w-3" />
            ADMIN
          </span>
        );
      case WorkspaceRole.MEMBER:
        return (
          <span className="inline-flex items-center gap-1 rounded-md border border-zinc-700 bg-zinc-800/80 px-2 py-0.5 text-[10px] font-medium text-zinc-300">
            MEMBER
          </span>
        );
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800/60">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-emerald-400 mb-1">
            <Users className="h-3.5 w-3.5" />
            <span>Team Workspace</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Team &amp; Workload
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-zinc-400">
            Monitor workload capacity, rebalance project tasks, and manage team seats.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search team member..."
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900/80 pl-9 pr-3.5 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-zinc-700 focus:ring-2 focus:ring-emerald-500/30"
            />
          </div>

          {isOwnerOrAdmin && (
            <button
              type="button"
              onClick={() => setIsInviteModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-500 transition-colors cursor-pointer shrink-0"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Invite Member</span>
            </button>
          )}
        </div>
      </div>

      {/* Section 1: Team Workload Table */}
      <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-6 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div>
            <h3 className="text-sm font-semibold text-white">Workload Distribution</h3>
            <p className="text-xs text-zinc-400">Real-time task volume and active load by team member</p>
          </div>
          <span className="text-xs text-zinc-500">
            {memberWorkloads.length} Members Active
          </span>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-300 border-collapse">
            <thead className="bg-zinc-900/80 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-800">
              <tr>
                <th scope="col" className="py-3 pl-4 pr-3">Member</th>
                <th scope="col" className="px-3 py-3 text-center">Role</th>
                <th scope="col" className="px-3 py-3 text-center">Assigned</th>
                <th scope="col" className="px-3 py-3 text-center">In Progress</th>
                <th scope="col" className="px-3 py-3 text-center">Completed</th>
                <th scope="col" className="px-3 py-3 text-center">Overdue</th>
                <th scope="col" className="py-3 pl-3 pr-4 text-right">Workload Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {filteredMembers.map((m) => {
                const totalActive = m.inProgress + m.pending;
                let statusColor = "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
                let statusLabel = "Balanced";

                if (m.overdue > 0) {
                  statusColor = "text-rose-400 bg-rose-500/10 border-rose-500/20";
                  statusLabel = "At Risk";
                } else if (totalActive > 5) {
                  statusColor = "text-amber-400 bg-amber-500/10 border-amber-500/20";
                  statusLabel = "Heavy Load";
                }

                return (
                  <tr key={m.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="py-3 pl-4 pr-3">
                      <div className="flex items-center gap-2.5">
                        {m.user.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={m.user.image}
                            alt="Avatar"
                            className="h-7 w-7 rounded-full object-cover border border-zinc-700"
                          />
                        ) : (
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-800 text-[10px] font-bold text-zinc-300 border border-zinc-700">
                            {(m.user.name || m.user.email).slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-white block">
                              {m.user.name || m.user.email}
                            </span>
                            {m.isCurrentUser && (
                              <span className="rounded bg-blue-500/20 px-1.5 py-0.2 text-[9px] font-semibold text-blue-400">
                                You
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-zinc-500 block">
                            {m.user.email}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-3 py-3 text-center">
                      {getRoleBadge(m.role)}
                    </td>

                    <td className="px-3 py-3 text-center font-semibold text-white">
                      {m.assignedTotal}
                    </td>

                    <td className="px-3 py-3 text-center text-blue-400 font-semibold">
                      {m.inProgress}
                    </td>

                    <td className="px-3 py-3 text-center text-emerald-400 font-semibold">
                      {m.completed}
                    </td>

                    <td className="px-3 py-3 text-center">
                      {m.overdue > 0 ? (
                        <span className="font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded">
                          {m.overdue}
                        </span>
                      ) : (
                        <span className="text-zinc-500">0</span>
                      )}
                    </td>

                    <td className="py-3 pl-3 pr-4 text-right">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold border ${statusColor}`}>
                        {statusLabel}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 2: Member Directory Cards with Role Management */}
      <div>
        <h3 className="text-sm font-semibold text-white mb-4">Workspace Member Directory</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMembers.map((member) => (
            <div
              key={member.id}
              className="rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-5 shadow-sm hover:border-zinc-700/80 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {member.user.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={member.user.image}
                        alt="Avatar"
                        className="h-10 w-10 rounded-full object-cover border border-zinc-700"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800 text-xs font-bold text-zinc-300 border border-zinc-700">
                        {(member.user.name || member.user.email).slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold text-white">
                          {member.user.name || "Teammate"}
                        </span>
                        {member.isCurrentUser && (
                          <span className="rounded bg-blue-500/20 px-1.5 py-0.2 text-[10px] font-semibold text-blue-400">
                            You
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-zinc-400 block truncate max-w-[170px]">
                        {member.user.email}
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {getRoleBadge(member.role)}
                  </div>
                </div>

                {/* Metrics */}
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-2.5 text-center">
                    <span className="text-[11px] text-zinc-500 block">Assigned Tasks</span>
                    <span className="text-sm font-bold text-white mt-0.5 block">
                      {member.assignedTotal}
                    </span>
                  </div>
                  <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-2.5 text-center">
                    <span className="text-[11px] text-zinc-500 block">Completed</span>
                    <span className="text-sm font-bold text-emerald-400 mt-0.5 block">
                      {member.completed}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions: Change Role / Remove Member */}
              <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-xs">
                {member.canChangeRole ? (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-zinc-500">Role:</span>
                    <select
                      value={member.role}
                      onChange={(e) => handleRoleChange(member.id, e.target.value as "ADMIN" | "MEMBER")}
                      className="rounded-lg border border-zinc-800 bg-zinc-950 px-2 py-1 text-[11px] text-zinc-300 outline-none focus:border-zinc-700 cursor-pointer"
                    >
                      <option value="MEMBER">MEMBER</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </div>
                ) : (
                  <span className="text-[11px] text-zinc-500 flex items-center gap-1">
                    <UserCheck className="h-3 w-3 text-emerald-400" />
                    <span>{member.inProgress} In Progress</span>
                  </span>
                )}

                {member.canRemove && (
                  <button
                    type="button"
                    onClick={() => setMemberToRemove(member)}
                    className="inline-flex items-center gap-1 rounded-lg border border-rose-500/20 bg-rose-500/10 px-2 py-1 text-[11px] font-medium text-rose-400 hover:bg-rose-500/20 transition-colors cursor-pointer"
                    title="Remove member from workspace"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>Remove</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Invite Member Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in-0 duration-150">
          <div className="relative w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-blue-400" />
                <h3 className="text-sm font-semibold text-white">Invite Teammate</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsInviteModalOpen(false)}
                className="text-zinc-500 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleInviteSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Email Address <span className="text-rose-400">*</span>
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-zinc-700 focus:ring-2 focus:ring-blue-500/40"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Role Permission
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as "MEMBER" | "ADMIN")}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-white outline-none focus:border-zinc-700 focus:ring-2 focus:ring-blue-500/40"
                >
                  <option value="MEMBER">Member (Can create &amp; manage assigned tasks)</option>
                  <option value="ADMIN">Admin (Can manage members &amp; workspace tasks)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isInviting || !inviteEmail.trim()}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
                >
                  {isInviting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Add to Workspace</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Dialog for Member Removal */}
      <ConfirmationDialog
        isOpen={memberToRemove !== null}
        title="Remove Team Member"
        description={`Are you sure you want to remove ${memberToRemove?.user.name || memberToRemove?.user.email} from this workspace? They will no longer have access to workspace deliverables.`}
        confirmLabel="Remove Member"
        cancelLabel="Cancel"
        isLoading={isDeleting}
        onConfirm={handleRemoveMemberConfirm}
        onCancel={() => setMemberToRemove(null)}
      />
    </div>
  );
}
