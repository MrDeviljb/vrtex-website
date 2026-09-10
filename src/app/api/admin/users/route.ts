import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasAdminPermission } from "@/lib/auth";
import { logAdminAction } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasAdminPermission(user.role, "MODERATOR")) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 403 });
    }

    const { searchParams } = request.nextUrl;
    const search = searchParams.get("search") || "";

    const where: any = {};
    if (search) {
      where.OR = [
        { username: { contains: search } },
        { email: { contains: search } },
        { profile: { bgmiUid: { contains: search } } },
        { profile: { bgmiUsername: { contains: search } } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        isBanned: true,
        createdAt: true,
        profile: true,
        captainTeams: {
          select: {
            id: true,
            name: true,
            tag: true,
          },
        },
        _count: {
          select: {
            teamMemberships: true,
            captainTeams: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ success: true, users });
  } catch (error) {
    console.error("Admin users GET error:", error);
    return NextResponse.json({ success: false, message: "Failed to load users." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasAdminPermission(user.role, "MODERATOR")) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 403 });
    }

    const body = await request.json();
    const { targetUserId, action, newRole } = body;

    if (!targetUserId) {
      return NextResponse.json({ success: false, message: "targetUserId is required." }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      include: { captainTeams: true },
    });

    if (!targetUser) {
      return NextResponse.json({ success: false, message: "User not found." }, { status: 404 });
    }

    // Safety rule: Never allow normal admins to modify Super Admin accounts
    if (targetUser.role === "SUPER_ADMIN" && user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, message: "Permission denied: Cannot modify a Super Admin account." },
        { status: 403 }
      );
    }

    // ACTION: SUSPEND / UNBAN / TOGGLE_BAN
    if (action === "TOGGLE_BAN" || action === "SUSPEND" || action === "UNBAN") {
      let newBannedState = !targetUser.isBanned;
      if (action === "SUSPEND") newBannedState = true;
      if (action === "UNBAN") newBannedState = false;

      const updated = await prisma.user.update({
        where: { id: targetUser.id },
        data: { isBanned: newBannedState },
      });

      await logAdminAction(
        user.id,
        updated.isBanned ? "BAN_USER" : "UNBAN_USER",
        `User @${targetUser.username}`,
        `Account status set to ${updated.isBanned ? "SUSPENDED (BANNED)" : "ACTIVE"}`
      );

      return NextResponse.json({
        success: true,
        message: `Player @${targetUser.username} is now ${updated.isBanned ? "SUSPENDED" : "ACTIVE"}.`,
        user: updated,
      });
    }

    // ACTION: DELETE USER
    if (action === "DELETE_USER") {
      if (targetUser.role === "SUPER_ADMIN") {
        return NextResponse.json(
          { success: false, message: "Super Admin accounts cannot be deleted." },
          { status: 403 }
        );
      }

      await prisma.$transaction(async (tx) => {
        // 1. Delete captained teams
        const captainTeams = await tx.team.findMany({
          where: { captainId: targetUser.id },
          select: { id: true },
        });
        const teamIds = captainTeams.map((t) => t.id);

        if (teamIds.length > 0) {
          await tx.slotHistory.deleteMany({
            where: {
              OR: [
                { previousTeamId: { in: teamIds } },
                { newTeamId: { in: teamIds } },
              ],
            },
          });
          await tx.tournamentRegistration.deleteMany({
            where: { teamId: { in: teamIds } },
          });
          await tx.result.deleteMany({
            where: { teamId: { in: teamIds } },
          });
          await tx.payment.deleteMany({
            where: { teamId: { in: teamIds } },
          });
          await tx.teamMember.deleteMany({
            where: { teamId: { in: teamIds } },
          });
          await tx.team.deleteMany({
            where: { id: { in: teamIds } },
          });
        }

        // 2. Delete team memberships of this user
        await tx.teamMember.deleteMany({
          where: { userId: targetUser.id },
        });

        // 3. Delete payments made by this user
        await tx.payment.deleteMany({
          where: { userId: targetUser.id },
        });

        // 4. Delete notifications
        await tx.notification.deleteMany({
          where: { userId: targetUser.id },
        });

        // 5. Delete ticket replies & support tickets
        await tx.ticketReply.deleteMany({
          where: { senderId: targetUser.id },
        });
        await tx.supportTicket.deleteMany({
          where: { userId: targetUser.id },
        });

        // 6. Delete audit logs associated with this user
        await tx.auditLog.deleteMany({
          where: { adminId: targetUser.id },
        });

        // 7. Delete profile
        await tx.profile.deleteMany({
          where: { userId: targetUser.id },
        });

        // 8. Delete user
        await tx.user.delete({
          where: { id: targetUser.id },
        });
      });

      await logAdminAction(
        user.id,
        "DELETE_USER",
        `User @${targetUser.username}`,
        `Deleted user @${targetUser.username} (${targetUser.email}) and related records`
      );

      return NextResponse.json({
        success: true,
        message: `Player @${targetUser.username} deleted successfully.`,
      });
    }

    // ACTION: CHANGE ROLE
    if (action === "CHANGE_ROLE") {
      if (user.role !== "SUPER_ADMIN") {
        return NextResponse.json(
          { success: false, message: "Only Super Admins can modify administrative roles." },
          { status: 403 }
        );
      }

      const validRoles = ["SUPER_ADMIN", "TOURNAMENT_ADMIN", "MODERATOR", "FINANCE_ADMIN", "PLAYER"];
      if (!validRoles.includes(newRole)) {
        return NextResponse.json({ success: false, message: "Invalid role." }, { status: 400 });
      }

      const updated = await prisma.user.update({
        where: { id: targetUser.id },
        data: { role: newRole },
      });

      await logAdminAction(
        user.id,
        "CHANGE_USER_ROLE",
        `User @${targetUser.username}`,
        `Role changed to ${newRole}`
      );

      return NextResponse.json({
        success: true,
        message: `Role for @${targetUser.username} updated to ${newRole}.`,
        user: updated,
      });
    }

    return NextResponse.json({ success: false, message: "Invalid action." }, { status: 400 });
  } catch (error) {
    console.error("Admin user action error:", error);
    return NextResponse.json({ success: false, message: "Failed to process user action." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasAdminPermission(user.role, "MODERATOR")) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 403 });
    }

    const { searchParams } = request.nextUrl;
    let targetUserId = searchParams.get("id");

    if (!targetUserId) {
      try {
        const body = await request.json();
        targetUserId = body.targetUserId;
      } catch {}
    }

    if (!targetUserId) {
      return NextResponse.json({ success: false, message: "User ID is required." }, { status: 400 });
    }

    // Reuse POST with action: "DELETE_USER"
    const dummyReq = new NextRequest(request.url, {
      method: "POST",
      body: JSON.stringify({ targetUserId, action: "DELETE_USER" }),
    });
    return POST(dummyReq);
  } catch (error) {
    console.error("Admin user DELETE error:", error);
    return NextResponse.json({ success: false, message: "Failed to delete user." }, { status: 500 });
  }
}
