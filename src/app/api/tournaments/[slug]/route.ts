import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasAdminPermission } from "@/lib/auth";
import { logAdminAction } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params.slug;
    const user = await getCurrentUser();

    const tournament = await prisma.tournament.findUnique({
      where: { slug },
      include: {
        matches: {
          include: {
            room: true,
            results: {
              include: {
                team: true,
              },
            },
          },
          orderBy: { matchNumber: "asc" },
        },
        registrations: {
          include: {
            team: {
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
              },
            },
          },
          orderBy: { registeredAt: "asc" },
        },
        prizes: {
          orderBy: { rank: "asc" },
        },
      },
    });

    if (!tournament) {
      return NextResponse.json(
        { success: false, message: "Tournament not found." },
        { status: 404 }
      );
    }

    // Determine current user's registration status in this tournament
    let userRegistration = null;
    if (user) {
      const userTeamIds = [
        ...user.captainTeams.map((t) => t.id),
        ...user.teamMemberships.map((tm) => tm.teamId),
      ];

      userRegistration = tournament.registrations.find((reg) =>
        userTeamIds.includes(reg.teamId)
      );
    }

    // Mask Room passwords and Room IDs from matches for security!
    // Room details must strictly not be leaked in this general detail route
    const now = new Date();
    const isAdmin = user && hasAdminPermission(user.role, "TOURNAMENT");

    const safeMatches = tournament.matches.map((m) => {
      const hasRoom = !!m.room;
      let roomUnlocked = false;

      if (hasRoom && m.room) {
        const isTimePassed = new Date(m.room.releaseTime) <= now;
        const isUserRegistered =
          userRegistration && userRegistration.status === "APPROVED";
        const notHidden = !m.room.isManuallyHidden;

        if (isAdmin || (isUserRegistered && isTimePassed && notHidden)) {
          roomUnlocked = true;
        }
      }

      return {
        id: m.id,
        matchNumber: m.matchNumber,
        map: m.map,
        mode: m.mode,
        startTime: m.startTime,
        status: m.status,
        results: m.results,
        room: m.room
          ? {
              id: m.room.id,
              releaseTime: m.room.releaseTime,
              isReleased: m.room.isReleased,
              isManuallyHidden: m.room.isManuallyHidden,
              roomUnlocked,
              // Only expose credentials if unlocked
              roomId: roomUnlocked ? m.room.roomId : null,
              roomPassword: roomUnlocked ? m.room.roomPassword : null,
            }
          : null,
      };
    });

    return NextResponse.json({
      success: true,
      tournament: {
        ...tournament,
        matches: safeMatches,
      },
      userRegistration: userRegistration || null,
    });
  } catch (error) {
    console.error("Tournament detail error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load tournament." },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasAdminPermission(user.role, "TOURNAMENT")) {
      return NextResponse.json(
        { success: false, message: "Access denied." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const updateData: any = {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.bannerUrl !== undefined) updateData.bannerUrl = body.bannerUrl;
    if (body.gameMode !== undefined) updateData.gameMode = body.gameMode;
    if (body.perspective !== undefined) updateData.perspective = body.perspective;
    if (body.maxTeams !== undefined) updateData.maxTeams = Number(body.maxTeams);
    if (body.maxRosterMain !== undefined) updateData.maxRosterMain = Number(body.maxRosterMain);
    if (body.maxRosterSub !== undefined) updateData.maxRosterSub = Number(body.maxRosterSub);
    if (body.entryFee !== undefined) updateData.entryFee = Number(body.entryFee);
    if (body.prizePool !== undefined) updateData.prizePool = Number(body.prizePool);
    if (body.regStart !== undefined) updateData.regStart = new Date(body.regStart);
    if (body.regEnd !== undefined) updateData.regEnd = new Date(body.regEnd);
    if (body.startDate !== undefined) updateData.startDate = new Date(body.startDate);
    if (body.status !== undefined) updateData.status = body.status;
    if (body.rulesText !== undefined) updateData.rulesText = body.rulesText;
    if (body.scoringRulesJson !== undefined) updateData.scoringRulesJson = body.scoringRulesJson;
    if (body.isScrim !== undefined) updateData.isScrim = !!body.isScrim;

    const tournament = await prisma.tournament.update({
      where: { slug: params.slug },
      data: updateData,
    });

    await logAdminAction(
      user.id,
      "UPDATE_TOURNAMENT",
      tournament.title,
      body.status ? `Updated tournament ${tournament.slug} status to ${body.status}` : `Updated tournament ${tournament.slug}`
    );

    return NextResponse.json({
      success: true,
      message: body.status ? `Status updated to ${body.status}` : "Tournament updated successfully.",
      tournament,
    });
  } catch (error) {
    console.error("Tournament update error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update tournament." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasAdminPermission(user.role, "TOURNAMENT")) {
      return NextResponse.json(
        { success: false, message: "Access denied." },
        { status: 403 }
      );
    }

    const tournament = await prisma.tournament.findUnique({
      where: { slug: params.slug },
      include: {
        matches: { select: { id: true } },
      },
    });

    if (!tournament) {
      return NextResponse.json(
        { success: false, message: "Tournament not found." },
        { status: 404 }
      );
    }

    const matchIds = tournament.matches.map((m) => m.id);

    // Atomically clean up all cascading dependencies
    await prisma.$transaction(async (tx) => {
      // 1. Delete slot histories
      await tx.slotHistory.deleteMany({
        where: { tournamentId: tournament.id },
      });

      // 2. Delete match rooms and results
      if (matchIds.length > 0) {
        await tx.room.deleteMany({
          where: { matchId: { in: matchIds } },
        });
        await tx.result.deleteMany({
          where: { matchId: { in: matchIds } },
        });
        await tx.match.deleteMany({
          where: { id: { in: matchIds } },
        });
      }

      // 3. Delete registrations
      await tx.tournamentRegistration.deleteMany({
        where: { tournamentId: tournament.id },
      });

      // 4. Delete payments for this tournament
      await tx.payment.deleteMany({
        where: { tournamentId: tournament.id },
      });

      // 5. Delete prizes
      await tx.prize.deleteMany({
        where: { tournamentId: tournament.id },
      });

      // 6. Delete roster change logs associated with this tournament
      await tx.rosterChangeLog.deleteMany({
        where: { tournamentId: tournament.id },
      });

      // 7. Finally, delete the tournament
      await tx.tournament.delete({
        where: { id: tournament.id },
      });
    });

    await logAdminAction(
      user.id,
      "DELETE_TOURNAMENT",
      tournament.title,
      `Deleted tournament "${tournament.title}" (${tournament.slug}) and all associated records`
    );

    return NextResponse.json({
      success: true,
      message: `Tournament "${tournament.title}" deleted successfully.`,
    });
  } catch (error) {
    console.error("Tournament delete error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete tournament." },
      { status: 500 }
    );
  }
}

export { PUT as PATCH };
