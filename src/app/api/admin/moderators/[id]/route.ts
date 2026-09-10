import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logAdminAction } from "@/lib/audit";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, message: "Access denied. Super Admin privileges required." },
        { status: 403 }
      );
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: params.id },
    });

    if (!targetUser) {
      return NextResponse.json(
        { success: false, message: "Moderator not found." },
        { status: 404 }
      );
    }

    if (targetUser.role === "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, message: "Cannot modify Super Admin accounts." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { isBanned, permissions } = body;

    let updateData: any = {};
    if (typeof isBanned === "boolean") {
      updateData.isBanned = isBanned;
    }
    if (Array.isArray(permissions)) {
      updateData.permissions = JSON.stringify(permissions);
    }

    const updated = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
    });

    await logAdminAction(
      user.id,
      "UPDATE_MODERATOR",
      targetUser.username,
      `Updated permissions/status for moderator ${targetUser.username}`
    );

    return NextResponse.json({
      success: true,
      message: `Moderator "${targetUser.username}" updated successfully!`,
      moderator: updated,
    });
  } catch (error) {
    console.error("Update moderator error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update moderator." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, message: "Access denied. Super Admin privileges required." },
        { status: 403 }
      );
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: params.id },
    });

    if (!targetUser) {
      return NextResponse.json(
        { success: false, message: "Moderator not found." },
        { status: 404 }
      );
    }

    if (targetUser.role === "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, message: "Cannot delete Super Admin accounts." },
        { status: 403 }
      );
    }

    await prisma.user.delete({
      where: { id: params.id },
    });

    await logAdminAction(
      user.id,
      "DELETE_MODERATOR",
      targetUser.username,
      `Deleted moderator account ${targetUser.username}`
    );

    return NextResponse.json({
      success: true,
      message: `Moderator "${targetUser.username}" deleted successfully.`,
    });
  } catch (error) {
    console.error("Delete moderator error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete moderator." },
      { status: 500 }
    );
  }
}
