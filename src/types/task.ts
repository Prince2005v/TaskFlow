import { TaskPriority, TaskStatus, WorkspaceRole, WorkspacePlan, ActivityAction, NotificationType } from "@prisma/client";

export { WorkspaceRole, WorkspacePlan, ActivityAction, NotificationType };

export type SafeUser = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
};

export type SafeWorkspace = {
  id: string;
  name: string;
  slug: string;
  plan: WorkspacePlan;
  ownerId: string;
  role: WorkspaceRole;
};

export type WorkspaceMemberWithUser = {
  id: string;
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
  user: SafeUser;
  createdAt: string;
  assignedTaskCount?: number;
  completedTaskCount?: number;
};

export type TeamMember = SafeUser & {
  role?: WorkspaceRole;
  _count?: {
    assignedTasks: number;
    createdTasks: number;
  };
  createdAt?: Date | string;
};

export type TaskActivityItem = {
  id: string;
  taskId: string;
  userId: string;
  user: SafeUser;
  action: ActivityAction;
  details: string;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
};

export type TaskCommentItem = {
  id: string;
  taskId: string;
  userId: string;
  user: SafeUser;
  content: string;
  createdAt: string;
};

export type InAppNotification = {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
};

export type TaskWithUsers = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: Date | string | null;
  createdById: string;
  assignedToId: string | null;
  workspaceId?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  createdBy: SafeUser;
  assignedTo: SafeUser | null;
  activities?: TaskActivityItem[];
  comments?: TaskCommentItem[];
};
