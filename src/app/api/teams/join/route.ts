import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Please log in to join a team." },
        { status: 401 }
      );
    }

    if (!user.profile?.isVerified || !user.profile?.bgmiUid) {
      return NextResponse.json(
        {
          success: false,
          message: "Please verify your BGMI UID before joining a team.",
        },
        { status: 400 }
      );
    }

    const { inviteCode } = await request.json();
    if (!inviteCode) {
      return NextResponse.json(
        { success: false, message: "Invite code is required." },
        { status: 400 }
      );
    }

    const team = await prisma.team.findUnique({
      where: { inviteCode: String(inviteCode).trim().toUpperCase() },
      include: {
        members: true,
      },
    });

    if (!team) {
      return NextResponse.json(
        { success: false, message: "Invalid team invite code." },
        { status: 404 }
      );
    }

    // Check if already a member
    const isMember = team.members.some((m) => m.userId === user.id);
    if (isMember) {
      return NextResponse.json(
        { success: false, message: "You are already a member of this team." },
        { status: 400 }
      );
    }

    // Limit squad size to 6 (4 starters + 2 substitutes)
    if (team.members.length >= 6) {
      return NextResponse.json(
        { success: false, message: "This team roster is full (max 6 players)." },
        { status: 400 }
      );
    }

    await prisma.teamMember.create({
      data: {
        teamId: team.id,
        userId: user.id,
        role: team.members.length >= 4 ? "SUBSTITUTE" : "PLAYER",
      },
    });

    return NextResponse.json({
      success: true,
      message: `Successfully joined ${team.name}!`,
      teamId: team.id,
    });
  } catch (error) {
    console.error("Team join error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to join team." },
      { status: 500 }
    );
  }
}
