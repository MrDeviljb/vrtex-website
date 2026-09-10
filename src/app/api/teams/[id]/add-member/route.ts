import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { verifyBgmiUid } from "@/lib/aluu";

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

    const { bgmiUid, role } = await request.json();

    if (!bgmiUid || String(bgmiUid).trim().length < 5) {
      return NextResponse.json(
        { success: false, message: "Please provide a valid BGMI UID." },
        { status: 400 }
      );
    }

    const cleanUid = String(bgmiUid).trim();
    const memberRole = role === "SUBSTITUTE" ? "SUBSTITUTE" : "PLAYER";

    const team = await prisma.team.findUnique({
      where: { id: params.id },
      include: {
        members: {
          include: {
            user: {
              include: { profile: true },
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

    // Captain Authorization Check
    if (team.captainId !== user.id) {
      return NextResponse.json(
        { success: false, message: "Only the Team Captain can add members to the roster." },
        { status: 403 }
      );
    }

    // Check Max Roster Limits (1 Captain + 3 Players + 1 Substitute = 5 total)
    if (team.members.length >= 5) {
      return NextResponse.json(
        { success: false, message: "Team roster is full (Maximum 5 players allowed: 1 Captain, 3 Main Members, 1 Substitute)." },
        { status: 400 }
      );
    }

    if (memberRole === "SUBSTITUTE") {
      const hasSubstitute = team.members.some((m) => m.role === "SUBSTITUTE");
      if (hasSubstitute) {
        return NextResponse.json(
          { success: false, message: "Your team already has 1 registered substitute." },
          { status: 400 }
        );
      }
    }

    // ALUU BGMI Verification
    const verification = await verifyBgmiUid(cleanUid);
    if (!verification.success || !verification.data?.inGameName) {
      return NextResponse.json(
        { success: false, message: verification.message || "Failed to verify BGMI UID with official game servers." },
        { status: 400 }
      );
    }

    const bgmiUsername = verification.data.inGameName;

    // Check Duplicate UID on current team
    const duplicateOnTeam = team.members.some(
      (m) => m.user.profile?.bgmiUid === cleanUid
    );
    if (duplicateOnTeam) {
      return NextResponse.json(
        { success: false, message: "This BGMI UID is already registered in your team roster." },
        { status: 400 }
      );
    }

    // Find or Create User for this BGMI UID
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
        update: {
          bgmiUid: cleanUid,
          bgmiUsername,
          isVerified: true,
        },
        create: {
          userId: targetUser.id,
          bgmiUid: cleanUid,
          bgmiUsername,
          isVerified: true,
        },
      });
    }

    // Add to Team
    await prisma.teamMember.create({
      data: {
        teamId: team.id,
        userId: targetUser.id,
        role: memberRole,
      },
    });

    return NextResponse.json({
      success: true,
      message: `✓ Verified & Added! Player "${bgmiUsername}" (UID: ${cleanUid}) added to ${team.name} as ${memberRole}.`,
      player: {
        id: targetUser.id,
        bgmiUid: cleanUid,
        bgmiUsername,
        role: memberRole,
      },
    });
  } catch (error) {
    console.error("Add team member error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to add player to team." },
      { status: 500 }
    );
  }
}
