import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const team = await prisma.team.findUnique({
      where: { id: params.id },
      include: {
        captain: {
          include: { profile: true },
        },
        members: {
          include: {
            user: {
              include: { profile: true },
            },
          },
        },
        registrations: {
          include: {
            tournament: true,
          },
        },
        results: {
          include: {
            match: {
              include: { tournament: true },
            },
          },
        },
      },
    });

    if (!team) {
      return NextResponse.json(
        { success: false, message: "Team not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, team });
  } catch (error) {
    console.error("Team GET error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load team." },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }

    const { action, targetUserId, newRole } = await request.json();
    const team = await prisma.team.findUnique({
      where: { id: params.id },
      include: { members: true },
    });

    if (!team) {
      return NextResponse.json({ success: false, message: "Team not found." }, { status: 404 });
    }

    // Action: REMOVE MEMBER (Captain only)
    if (action === "REMOVE_MEMBER") {
      if (team.captainId !== user.id) {
        return NextResponse.json(
          { success: false, message: "Only the captain can remove team members." },
          { status: 403 }
        );
      }
      if (targetUserId === team.captainId) {
        return NextResponse.json(
          { success: false, message: "Captain cannot be removed. Transfer captaincy first." },
          { status: 400 }
        );
      }

      // Fetch member info for audit log before deleting
      const removedMember = await prisma.teamMember.findUnique({
        where: { teamId_userId: { teamId: team.id, userId: targetUserId } },
        include: { user: { include: { profile: true } } },
      });

      await prisma.teamMember.delete({
        where: {
          teamId_userId: {
            teamId: team.id,
            userId: targetUserId,
          },
        },
      });

      // Write roster change log
      if (removedMember) {
        await prisma.rosterChangeLog.create({
          data: {
            teamId: team.id,
            actorId: user.id,
            actorUsername: user.username,
            action: removedMember.role === "SUBSTITUTE" ? "REMOVE_SUBSTITUTE" : "REMOVE_PLAYER",
            targetBgmiUid: removedMember.user.profile?.bgmiUid || "UNKNOWN",
            targetBgmiUsername: removedMember.user.profile?.bgmiUsername || removedMember.user.username,
            role: removedMember.role,
          },
        }).catch(() => {}); // non-fatal
      }

      return NextResponse.json({ success: true, message: "Member removed from team." });
    }

    // Action: TRANSFER CAPTAINCY (Captain only)
    if (action === "TRANSFER_CAPTAINCY") {
      if (team.captainId !== user.id) {
        return NextResponse.json(
          { success: false, message: "Only the current captain can transfer captaincy." },
          { status: 403 }
        );
      }

      await prisma.$transaction([
        prisma.team.update({
          where: { id: team.id },
          data: { captainId: targetUserId },
        }),
        prisma.teamMember.update({
          where: { teamId_userId: { teamId: team.id, userId: targetUserId } },
          data: { role: "CAPTAIN" },
        }),
        prisma.teamMember.update({
          where: { teamId_userId: { teamId: team.id, userId: user.id } },
          data: { role: "PLAYER" },
        }),
      ]);

      return NextResponse.json({ success: true, message: "Captaincy transferred successfully." });
    }

    // Action: LEAVE TEAM (Non-captain member)
    if (action === "LEAVE_TEAM") {
      if (team.captainId === user.id) {
        return NextResponse.json(
          { success: false, message: "Captains cannot leave. Transfer captaincy or delete team." },
          { status: 400 }
        );
      }

      await prisma.teamMember.delete({
        where: {
          teamId_userId: {
            teamId: team.id,
            userId: user.id,
          },
        },
      });

      return NextResponse.json({ success: true, message: "You have left the team." });
    }

    return NextResponse.json({ success: false, message: "Invalid action." }, { status: 400 });
  } catch (error) {
    console.error("Team action error:", error);
    return NextResponse.json(
      { success: false, message: "Team action failed." },
      { status: 500 }
    );
  }
}
