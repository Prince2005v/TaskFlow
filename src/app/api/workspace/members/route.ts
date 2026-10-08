import { NextResponse } from "next/server";
import { getAuthUserWithWorkspace } from "@/lib/workspace-helpers";
import { prisma } from "@/lib/prisma";
import { WorkspaceRole, TaskStatus } from "@prisma/client";

export async function GET() {
  try {
    const auth = await getAuthUserWithWorkspace();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspace } = auth;

    // Fetch workspace members with user profile details
    const members = await prisma.workspaceMember.findMany({
      where: { workspaceId: workspace.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: [
        { role: "asc" },
        { createdAt: "asc" },
      ],
    });

    // Fetch assigned task counts per user for this workspace
    const workspaceTasks = await prisma.task.findMany({
      where: { workspaceId: workspace.id },
      select: {
        id: true,
        assignedToId: true,
        status: true,
      },
    });

    const membersWithCounts = members.map((m) => {
      const userTasks = workspaceTasks.filter((t) => t.assignedToId === m.userId);
      const assignedTaskCount = userTasks.length;
      const completedTaskCount = userTasks.filter((t) => t.status === TaskStatus.COMPLETED).length;

      return {
        id: m.id,
        workspaceId: m.workspaceId,
        userId: m.userId,
        role: m.role,
        user: m.user,
        createdAt: m.createdAt.toISOString(),
        assignedTaskCount,
        completedTaskCount,
      };
    });

    return NextResponse.json({
      members: membersWithCounts,
      workspaceRole: workspace.role,
    });
  } catch (error) {
    console.error("Error fetching workspace members:", error);
    return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await getAuthUserWithWorkspace();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspace } = auth;

    // RBAC: Only OWNER and ADMIN can invite members
    if (workspace.role !== WorkspaceRole.OWNER && workspace.role !== WorkspaceRole.ADMIN) {
      return NextResponse.json(
        { error: "Only workspace owners and administrators can add members" },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body.email !== "string" || !body.email.trim()) {
      return NextResponse.json({ error: "Valid email address is required" }, { status: 400 });
    }

    const email = body.email.trim().toLowerCase();
    const role: WorkspaceRole =
      body.role === "ADMIN" ? WorkspaceRole.ADMIN : WorkspaceRole.MEMBER;

    // Check if user is already a member
    const existingMember = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId: workspace.id,
        user: { email },
      },
    });

    if (existingMember) {
      return NextResponse.json(
        { error: "User is already a member of this workspace" },
        { status: 400 }
      );
    }

    // Check if user account already exists in DB
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Create user account placeholder so they can be assigned work immediately
      user = await prisma.user.create({
        data: {
          email,
          name: email.split("@")[0],
        },
      });
    }

    // Add user as workspace member
    const newMember = await prisma.workspaceMember.create({
      data: {
        workspaceId: workspace.id,
        userId: user.id,
        role,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
    });

    return NextResponse.json(
      {
        member: {
          id: newMember.id,
          workspaceId: newMember.workspaceId,
          userId: newMember.userId,
          role: newMember.role,
          user: newMember.user,
          createdAt: newMember.createdAt.toISOString(),
          assignedTaskCount: 0,
          completedTaskCount: 0,
        },
        message: `${email} added to workspace`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error adding workspace member:", error);
    return NextResponse.json({ error: "Failed to add member" }, { status: 500 });
  }
}
