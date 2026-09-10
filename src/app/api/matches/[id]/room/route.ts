import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasAdminPermission } from "@/lib/auth";
import { logAdminAction } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          locked: true,
          message: "You must be logged in to view room details.",
        },
        { status: 401 }
      );
    }

    const match = await prisma.match.findUnique({
      where: { id: params.id },
      include: {
        tournament: {
          include: {
            registrations: {
              include: {
                team: {
                  include: {
                    members: true,
                  },
                },
              },
            },
          },
        },
        room: true,
      },
    });

    if (!match || !match.room) {
      return NextResponse.json(
        {
          success: false,
          locked: true,
          message: "Room details have not been configured for this match yet.",
        },
        { status: 404 }
      );
    }

    const room = match.room;
    const now = new Date();
    const isAdmin = hasAdminPermission(user.role, "TOURNAMENT");

    // If Admin, they always have access
    if (isAdmin) {
      return NextResponse.json({
        success: true,
        locked: false,
        isAdmin: true,
        room: {
          id: room.id,
          roomId: room.roomId,
          roomPassword: room.roomPassword,
          releaseTime: room.releaseTime,
          isReleased: room.isReleased,
          isManuallyHidden: room.isManuallyHidden,
        },
      });
    }

    // Check if tournament is active
    if (match.tournament.status === "CANCELLED") {
      return NextResponse.json(
        {
          success: false,
          locked: true,
          message: "This tournament has been cancelled.",
        },
        { status: 403 }
      );
    }

    // Check if user is registered in this tournament
    const userTeamIds = new Set([
      ...user.captainTeams.map((t) => t.id),
      ...user.teamMemberships.map((tm) => tm.teamId),
    ]);

    const registration = match.tournament.registrations.find((reg) =>
      userTeamIds.has(reg.teamId)
    );

    if (!registration) {
      return NextResponse.json(
        {
          success: false,
          locked: true,
          message: "Room details are not available for your account. You are not registered for this tournament.",
        },
        { status: 403 }
      );
    }

    if (registration.status === "DISQUALIFIED") {
      return NextResponse.json(
        {
          success: false,
          locked: true,
          message: "Your team has been disqualified from this tournament.",
        },
        { status: 403 }
      );
    }

    if (registration.status !== "APPROVED") {
      return NextResponse.json(
        {
          success: false,
          locked: true,
          message: `Your registration status is ${registration.status}. Only APPROVED teams can access the room.`,
        },
        { status: 403 }
      );
    }

    // Check if manually hidden by admin
    if (room.isManuallyHidden) {
      return NextResponse.json(
        {
          success: false,
          locked: true,
          message: "Room access has been temporarily paused by tournament administrators.",
        },
        { status: 403 }
      );
    }

    // Check server time against releaseTime
    const releaseTime = new Date(room.releaseTime);
    if (now < releaseTime) {
      return NextResponse.json(
        {
          success: false,
          locked: true,
          releaseTime: room.releaseTime,
          message: `Room details are locked. They will be released at ${releaseTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.`,
        },
        { status: 403 }
      );
    }

    // All security checks passed! Return room credentials securely
    return NextResponse.json({
      success: true,
      locked: false,
      room: {
        id: room.id,
        roomId: room.roomId,
        roomPassword: room.roomPassword,
        releaseTime: room.releaseTime,
      },
    });
  } catch (error) {
    console.error("Room access check error:", error);
    return NextResponse.json(
      { success: false, locked: true, message: "Error verifying room access." },
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
    if (!user || !hasAdminPermission(user.role, "TOURNAMENT")) {
      return NextResponse.json({ success: false, message: "Admin access required." }, { status: 403 });
    }

    const { action, roomId, roomPassword, releaseTime, isManuallyHidden } = await request.json();

    const match = await prisma.match.findUnique({
      where: { id: params.id },
      include: { room: true, tournament: true },
    });

    if (!match) {
      return NextResponse.json({ success: false, message: "Match not found." }, { status: 404 });
    }

    if (action === "UPSERT") {
      const updated = await prisma.room.upsert({
        where: { matchId: match.id },
        update: {
          roomId: roomId || undefined,
          roomPassword: roomPassword || undefined,
          releaseTime: releaseTime ? new Date(releaseTime) : undefined,
          isManuallyHidden: typeof isManuallyHidden === "boolean" ? isManuallyHidden : undefined,
        },
        create: {
          matchId: match.id,
          roomId: roomId || "000000",
          roomPassword: roomPassword || "12345",
          releaseTime: releaseTime ? new Date(releaseTime) : new Date(),
          isReleased: false,
          isManuallyHidden: false,
        },
      });

      await logAdminAction(
        user.id,
        "UPDATE_ROOM",
        `Match #${match.matchNumber} (${match.tournament.title})`,
        `Set Room ID: ${updated.roomId}, Release: ${updated.releaseTime.toISOString()}`
      );

      return NextResponse.json({ success: true, message: "Room details saved.", room: updated });
    }

    if (action === "RELEASE_NOW") {
      const updated = await prisma.room.update({
        where: { matchId: match.id },
        data: {
          releaseTime: new Date(Date.now() - 1000), // set to past so server time condition immediately passes
          isReleased: true,
          isManuallyHidden: false,
        },
      });

      await logAdminAction(
        user.id,
        "RELEASE_ROOM_NOW",
        `Match #${match.matchNumber} (${match.tournament.title})`,
        "Manually triggered immediate room release"
      );

      return NextResponse.json({
        success: true,
        message: "Room released to all eligible players!",
        room: updated,
      });
    }

    if (action === "TOGGLE_HIDE") {
      const current = match.room?.isManuallyHidden || false;
      const updated = await prisma.room.update({
        where: { matchId: match.id },
        data: { isManuallyHidden: !current },
      });

      await logAdminAction(
        user.id,
        !current ? "HIDE_ROOM" : "UNHIDE_ROOM",
        `Match #${match.matchNumber} (${match.tournament.title})`,
        `Room hidden status toggled to ${!current}`
      );

      return NextResponse.json({
        success: true,
        message: !current ? "Room is now hidden." : "Room is now visible.",
        room: updated,
      });
    }

    return NextResponse.json({ success: false, message: "Invalid action." }, { status: 400 });
  } catch (error) {
    console.error("Room update error:", error);
    return NextResponse.json({ success: false, message: "Failed to update room." }, { status: 500 });
  }
}
