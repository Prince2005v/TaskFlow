import { NextResponse } from "next/server";
import { getAuthUserWithWorkspace } from "@/lib/workspace-helpers";
import { prisma } from "@/lib/prisma";
import { WorkspaceRole } from "@prisma/client";

export async function GET() {
  try {
    const auth = await getAuthUserWithWorkspace();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspace } = auth;

    const [memberCount, taskCount] = await Promise.all([
      prisma.workspaceMember.count({ where: { workspaceId: workspace.id } }),
      prisma.task.count({ where: { workspaceId: workspace.id } }),
    ]);

    return NextResponse.json({
      workspace: {
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
        plan: workspace.plan,
        role: workspace.role,
        memberCount,
        taskCount,
      },
    });
  } catch (error) {
    console.error("Error fetching workspace details:", error);
    return NextResponse.json({ error: "Failed to fetch workspace" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await getAuthUserWithWorkspace();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspace } = auth;

    // RBAC: Only OWNER or ADMIN can modify workspace settings
    if (workspace.role !== WorkspaceRole.OWNER && workspace.role !== WorkspaceRole.ADMIN) {
      return NextResponse.json(
        { error: "Only workspace owners and administrators can change workspace settings" },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body.name !== "string" || !body.name.trim()) {
      return NextResponse.json({ error: "Workspace name is required" }, { status: 400 });
    }

    const updated = await prisma.workspace.update({
      where: { id: workspace.id },
      data: { name: body.name.trim() },
    });

    return NextResponse.json({
      workspace: {
        id: updated.id,
        name: updated.name,
        slug: updated.slug,
        plan: updated.plan,
        role: workspace.role,
      },
      message: "Workspace updated successfully",
    });
  } catch (error) {
    console.error("Error updating workspace:", error);
    return NextResponse.json({ error: "Failed to update workspace" }, { status: 500 });
  }
}
