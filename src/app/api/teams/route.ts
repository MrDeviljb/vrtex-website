import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const teams = await prisma.team.findMany({
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
        _count: {
          select: {
            registrations: true,
            results: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, teams });
  } catch (error) {
    console.error("Teams GET error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch teams." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "You must be logged in to create a team." },
        { status: 401 }
      );
    }

    if (!user.profile?.isVerified || !user.profile?.bgmiUid) {
      return NextResponse.json(
        {
          success: false,
          message: "Please verify your BGMI UID in your profile before creating a team.",
        },
        { status: 400 }
      );
    }

    const { name, tag, logoUrl, players } = await request.json();
    if (!name || !tag) {
      return NextResponse.json(
        { success: false, message: "Team name and team tag are required." },
        { status: 400 }
      );
    }

    const cleanName = String(name).trim();
    const cleanTag = String(tag).trim().toUpperCase();

    const existingName = await prisma.team.findUnique({
      where: { name: cleanName },
    });
    if (existingName) {
      return NextResponse.json(
        { success: false, message: "A team with this name already exists." },
        { status: 400 }
      );
    }

    // Generate readable random invite code
    const inviteCode = `${cleanTag}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    const team = await prisma.team.create({
      data: {
        name: cleanName,
        tag: cleanTag,
        logoUrl: logoUrl || null,
        captainId: user.id,
        inviteCode,
        members: {
          create: {
            userId: user.id,
            role: "CAPTAIN",
          },
        },
      },
    });

    // If manual players were supplied during team creation, add them
    if (Array.isArray(players) && players.length > 0) {
      for (const p of players) {
        if (!p || !p.bgmiUid) continue;
        const pUid = String(p.bgmiUid).trim();
        if (!pUid || pUid.length < 5) continue;
        if (pUid === user.profile?.bgmiUid) continue; // Skip captain

        const pName = (p.playerName && String(p.playerName).trim()) || `BGMI_${pUid.slice(-4)}`;
        const pRole = p.role === "SUBSTITUTE" ? "SUBSTITUTE" : "PLAYER";

        try {
          let targetUser = await prisma.user.findFirst({
            where: {
              OR: [
                { profile: { bgmiUid: pUid } },
                { username: `player_${pUid}` },
              ],
            },
            include: { profile: true },
          });

          if (!targetUser) {
            targetUser = await prisma.user.create({
              data: {
                email: `player_${pUid}@bgmi.local`,
                username: `player_${pUid}`,
                passwordHash: "NOPASSWORD_MANAGED_BY_CAPTAIN",
                role: "PLAYER",
                profile: {
                  create: {
                    bgmiUid: pUid,
                    bgmiUsername: pName,
                    isVerified: true,
                  },
                },
              },
              include: { profile: true },
            });
          } else if (!targetUser.profile?.bgmiUid || !targetUser.profile?.isVerified) {
            await prisma.profile.upsert({
              where: { userId: targetUser.id },
              update: { bgmiUid: pUid, bgmiUsername: pName, isVerified: true },
              create: { userId: targetUser.id, bgmiUid: pUid, bgmiUsername: pName, isVerified: true },
            });
          }

          // Add to team
          await prisma.teamMember.create({
            data: {
              teamId: team.id,
              userId: targetUser.id,
              role: pRole,
            },
          });

          // Change log
          await prisma.rosterChangeLog.create({
            data: {
              teamId: team.id,
              actorId: user.id,
              actorUsername: user.username,
              action: pRole === "SUBSTITUTE" ? "ADD_SUBSTITUTE" : "ADD_PLAYER",
              targetBgmiUid: pUid,
              targetBgmiUsername: pName,
              role: pRole,
            },
          }).catch(() => {});
        } catch (err) {
          console.error("Error adding player during team creation:", err);
        }
      }
    }

    const fullTeam = await prisma.team.findUnique({
      where: { id: team.id },
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

    return NextResponse.json({
      success: true,
      message: "Team created successfully with all player details!",
      team: fullTeam,
    });
  } catch (error) {
    console.error("Create team error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create team." },
      { status: 500 }
    );
  }
}
