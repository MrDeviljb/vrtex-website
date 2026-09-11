import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { verifyBgmiUidWithAluu } from "@/lib/aluu";
import { validateAddMember } from "@/lib/roster";

/**
 * POST /api/teams/[id]/roster/add
 * Captain-only. Adds a player or substitute to the team by BGMI UID.
 * All validation is server-side (see /lib/roster.ts).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Authentication required." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const rawUid = body.bgmiUid;
    const rawRole = body.role;

    if (!rawUid || String(rawUid).trim().length < 5) {
      return NextResponse.json(
        { success: false, message: "Please provide a valid BGMI UID." },
        { status: 400 }
      );
    }

    const cleanUid = String(rawUid).trim();
    const role: "PLAYER" | "SUBSTITUTE" =
      rawRole === "SUBSTITUTE" ? "SUBSTITUTE" : "PLAYER";

    // Fetch team with captain info
    const team = await prisma.team.findUnique({
      where: { id: params.id },
      include: {
        members: {
          include: { user: { include: { profile: true } } },
        },
      },
    });

    if (!team) {
      return NextResponse.json(
        { success: false, message: "Team not found." },
        { status: 404 }
      );
    }

    // Get tournament roster limits from any active registration
    // Default: 4 main, 1 sub (configurable per tournament)
    const activeReg = await prisma.tournamentRegistration.findFirst({
      where: {
        teamId: team.id,
        status: { notIn: ["REJECTED", "DISQUALIFIED", "CANCELLED"] },
      },
      include: { tournament: true },
      orderBy: { registeredAt: "desc" },
    });

    const maxMain = activeReg?.tournament.maxRosterMain ?? 4;
    const maxSub = activeReg?.tournament.maxRosterSub ?? 1;

    // Run all server-side validations
    const validation = await validateAddMember({
      teamId: team.id,
      bgmiUid: cleanUid,
      role,
      captainId: team.captainId,
      requestingUserId: user.id,
      maxMain,
      maxSub,
    });

    if (!validation.valid) {
      return NextResponse.json(
        { success: false, message: validation.message },
        { status: 400 }
      );
    }

    // Use manual player name if provided, or verify BGMI UID via Aluu API
    const rawPlayerName = body.playerName || body.bgmiUsername;
    let bgmiUsername: string;

    if (rawPlayerName && String(rawPlayerName).trim().length > 0) {
      bgmiUsername = String(rawPlayerName).trim();
    } else {
      const verification = await verifyBgmiUidWithAluu(cleanUid);
      if (verification.success && verification.player) {
        bgmiUsername = verification.player.username;
      } else {
        bgmiUsername = `BGMI_${cleanUid.slice(-4)}`;
      }
    }

    // Find or create a platform user account for this BGMI UID
    let targetUser = await prisma.user.findFirst({
      where: {
        OR: [
          { profile: { bgmiUid: cleanUid } },
          { username: `player_${cleanUid}` },
        ],
      },
      include: { profile: true },
    });

    if (!targetUser) {
      targetUser = await prisma.user.create({
        data: {
          email: `player_${cleanUid}@bgmi.local`,
          username: `player_${cleanUid}`,
          passwordHash: "NOPASSWORD_MANAGED_BY_CAPTAIN",
          role: "PLAYER",
          profile: {
            create: {
              bgmiUid: cleanUid,
              bgmiUsername,
              isVerified: true,
            },
          },
        },
        include: { profile: true },
      });
    } else if (!targetUser.profile?.bgmiUid || !targetUser.profile?.isVerified) {
      await prisma.profile.upsert({
        where: { userId: targetUser.id },
        update: { bgmiUid: cleanUid, bgmiUsername, isVerified: true },
        create: { userId: targetUser.id, bgmiUid: cleanUid, bgmiUsername, isVerified: true },
      });
    }

    // Add to team + write roster change log atomically
    await prisma.$transaction([
      prisma.teamMember.create({
        data: {
          teamId: team.id,
          userId: targetUser.id,
          role,
        },
      }),
      prisma.rosterChangeLog.create({
        data: {
          teamId: team.id,
          actorId: user.id,
          actorUsername: user.username,
          action: role === "SUBSTITUTE" ? "ADD_SUBSTITUTE" : "ADD_PLAYER",
          targetBgmiUid: cleanUid,
          targetBgmiUsername: bgmiUsername,
          role,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: `✓ Player "${bgmiUsername}" (UID: ${cleanUid}) added as ${role === "SUBSTITUTE" ? "Substitute" : "Main Player"}.`,
      player: {
        bgmiUid: cleanUid,
        bgmiUsername,
        role,
        userId: targetUser.id,
      },
    });
  } catch (error: any) {
    // Unique constraint violation = already on team
    if (error?.code === "P2002") {
      return NextResponse.json(
        { success: false, message: "This player is already a member of your team." },
        { status: 400 }
      );
    }
    console.error("Roster add error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to add player. Please try again." },
      { status: 500 }
    );
  }
}
