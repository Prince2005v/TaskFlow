import { prisma } from "@/lib/prisma";
import { getAuthUser, AuthUser } from "@/lib/auth-helpers";
import { ActivityAction, NotificationType, WorkspaceRole, WorkspacePlan } from "@prisma/client";
import { SafeWorkspace } from "@/types/task";

/**
 * Retrieves the user's active workspace or provisions a default one if none exists.
 * Automatically links any orphan tasks created by the user to this workspace.
 */
export async function getUserWorkspace(userId: string): Promise<SafeWorkspace> {
  // Check if user has an existing workspace membership
  const existingMembership = await prisma.workspaceMember.findFirst({
    where: { userId },
    include: {
      workspace: true,
    },
    orderBy: { createdAt: "asc" },
  });

  if (existingMembership) {
    return {
      id: existingMembership.workspace.id,
      name: existingMembership.workspace.name,
      slug: existingMembership.workspace.slug,
      plan: existingMembership.workspace.plan,
      ownerId: existingMembership.workspace.ownerId,
      role: existingMembership.role,
    };
  }

  // Find user details to name the workspace
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true },
  });

  const baseName = user?.name ? `${user.name}'s Workspace` : "My Workspace";
  const slug = `workspace-${userId.slice(-6)}-${Date.now().toString(36)}`;

  // Provision workspace and set user as OWNER in a transaction
  const newWorkspace = await prisma.workspace.create({
    data: {
      name: baseName,
      slug,
      plan: WorkspacePlan.FREE,
      ownerId: userId,
      members: {
        create: {
          userId,
          role: WorkspaceRole.OWNER,
        },
      },
    },
  });

  // Link any existing orphan tasks created by this user
  await prisma.task.updateMany({
    where: {
      createdById: userId,
      workspaceId: null,
    },
    data: {
      workspaceId: newWorkspace.id,
    },
  });

  return {
    id: newWorkspace.id,
    name: newWorkspace.name,
    slug: newWorkspace.slug,
    plan: newWorkspace.plan,
    ownerId: newWorkspace.ownerId,
    role: WorkspaceRole.OWNER,
  };
}

/**
 * Resolves the authenticated user along with their active workspace.
 */
export async function getAuthUserWithWorkspace(): Promise<{
  user: AuthUser;
  workspace: SafeWorkspace;
} | null> {
  const currentUser = await getAuthUser();
  if (!currentUser) return null;

  const workspace = await getUserWorkspace(currentUser.id);
  return {
    user: currentUser,
    workspace,
  };
}

/**
 * Checks if a member's role satisfies the required permission level.
 */
export function hasRolePermission(
  userRole: WorkspaceRole,
  requiredRole: "OWNER" | "ADMIN" | "MEMBER"
): boolean {
  if (userRole === WorkspaceRole.OWNER) return true;
  if (userRole === WorkspaceRole.ADMIN && requiredRole !== "OWNER") return true;
  if (userRole === WorkspaceRole.MEMBER && requiredRole === "MEMBER") return true;
  return false;
}

/**
 * Records an activity/audit log entry for a task.
 */
export async function recordTaskActivity(params: {
  taskId: string;
  userId: string;
  action: ActivityAction;
  details: string;
  oldValue?: string | null;
  newValue?: string | null;
}) {
  try {
    return await prisma.taskActivity.create({
      data: {
        taskId: params.taskId,
        userId: params.userId,
        action: params.action,
        details: params.details,
        oldValue: params.oldValue || null,
        newValue: params.newValue || null,
      },
    });
  } catch (err) {
    console.error("[audit] Failed to record task activity:", err);
    return null;
  }
}

/**
 * Creates an in-app notification record for a user.
 */
export async function createInAppNotification(params: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string | null;
}) {
  try {
    return await prisma.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        link: params.link || null,
      },
    });
  } catch (err) {
    console.error("[notification] Failed to create in-app notification:", err);
    return null;
  }
}
