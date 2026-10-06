import { TaskPriority, TaskStatus } from "@prisma/client";

export type SafeUser = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
};

export type TeamMember = SafeUser & {
  _count?: {
    assignedTasks: number;
    createdTasks: number;
  };
  createdAt?: Date | string;
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
  createdAt: Date | string;
  updatedAt: Date | string;
  createdBy: SafeUser;
  assignedTo: SafeUser | null;
};
