import { NextResponse } from "next/server";
import { getAuthUserWithWorkspace } from "@/lib/workspace-helpers";
import { prisma } from "@/lib/prisma";
import { WorkspaceRole } from "@prisma/client";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthUserWithWorkspace();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { user: currentUser, workspace } = auth;
    const { id: memberId } = await params;
    if (!memberId) {
      return NextResponse.json({ error: "Member ID is required" }, { status: 400 });
    }

    // Role check: Only OWNER can change roles
    if (workspace.role !== WorkspaceRole.OWNER) {
      return NextResponse.json(
        { error: "Only the workspace owner can modify member roles" },
        { status: 403 }
      );
    }

    const targetMember = await prisma.workspaceMember.findUnique({
      where: { id: memberId },
    });

    if (!targetMember || targetMember.workspaceId !== workspace.id) {
      return NextResponse.json({ error: "Member not found in this workspace" }, { status: 404 });
    }

    if (targetMember.userId === currentUser.id && targetMember.role === WorkspaceRole.OWNER) {
      return NextResponse.json(
        { error: "Cannot change the workspace owner's role directly" },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || !["ADMIN", "MEMBER"].includes(body.role)) {
      return NextResponse.json({ error: "Role must be ADMIN or MEMBER" }, { status: 400 });
    }

    const updatedMember = await prisma.workspaceMember.update({
      where: { id: memberId },
      data: { role: body.role as WorkspaceRole },
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
      },
    });

    return NextResponse.json({ member: updatedMember });
  } catch (error) {
    console.error("Error updating member role:", error);
    return NextResponse.json({ error: "Failed to update member role" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthUserWithWorkspace();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { user: currentUser, workspace } = auth;
    const { id: memberId } = await params;
    if (!memberId) {
      return NextResponse.json({ error: "Member ID is required" }, { status: 400 });
    }

    const targetMember = await prisma.workspaceMember.findUnique({
      where: { id: memberId },
    });

    if (!targetMember || targetMember.workspaceId !== workspace.id) {
      return NextResponse.json({ error: "Member not found in this workspace" }, { status: 404 });
    }

    if (targetMember.role === WorkspaceRole.OWNER) {
      return NextResponse.json({ error: "Cannot remove the workspace owner" }, { status: 400 });
    }

    // Role check: OWNER can remove anyone. ADMIN can remove MEMBER.
    if (workspace.role === WorkspaceRole.MEMBER && targetMember.userId !== currentUser.id) {
      return NextResponse.json({ error: "Unauthorized to remove members" }, { status: 403 });
    }

    if (workspace.role === WorkspaceRole.ADMIN && targetMember.role === WorkspaceRole.ADMIN) {
      return NextResponse.json(
        { error: "Administrators cannot remove other administrators" },
        { status: 403 }
      );
    }

    await prisma.workspaceMember.delete({
      where: { id: memberId },
    });

    return NextResponse.json({ success: true, message: "Member removed from workspace" });
  } catch (error) {
    console.error("Error removing member:", error);
    return NextResponse.json({ error: "Failed to remove member" }, { status: 500 });
  }
}
