import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(
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

    const team = await prisma.team.findUnique({
      where: { id: params.id },
      include: {
        captain: { include: { profile: true } },
        members: {
          include: {
            user: { include: { profile: true } },
          },
          orderBy: { joinedAt: "asc" },
        },
      },
    });

    if (!team) {
      return NextResponse.json(
        { success: false, message: "Team not found." },
        { status: 404 }
      );
    }

    // Verify caller is a member or captain of this team
    const isOnTeam =
      team.captainId === user.id ||
      team.members.some((m) => m.userId === user.id);

    if (!isOnTeam) {
      return NextResponse.json(
        { success: false, message: "Access denied." },
        { status: 403 }
      );
    }

    const isCaptain = team.captainId === user.id;

    // Separate members by role
    const captainMember = team.members.find((m) => m.role === "CAPTAIN");
    const mainMembers = team.members.filter((m) => m.role === "PLAYER");
    const substitutes = team.members.filter((m) => m.role === "SUBSTITUTE");

    const formatMember = (m: any) => ({
      memberId: m.id,
      userId: m.userId,
      username: m.user.username,
      bgmiUsername: m.user.profile?.bgmiUsername || null,
      bgmiUid: m.user.profile?.bgmiUid || null,
      isVerified: m.user.profile?.isVerified || false,
      role: m.role,
      joinedAt: m.joinedAt,
      isCaptainOfTeam: m.userId === team.captainId,
    });

    return NextResponse.json({
      success: true,
      teamId: team.id,
      teamName: team.name,
      teamTag: team.tag,
      captainId: team.captainId,
      isCaptain,
      captain: {
        userId: team.captain.id,
        username: team.captain.username,
        bgmiUsername: team.captain.profile?.bgmiUsername || null,
        bgmiUid: team.captain.profile?.bgmiUid || null,
        isVerified: team.captain.profile?.isVerified || false,
      },
      mainMembers: mainMembers.map(formatMember),
      substitutes: substitutes.map(formatMember),
      counts: {
        main: mainMembers.length + 1, // +1 for captain
        sub: substitutes.length,
        totalMembers: team.members.length,
      },
    });
  } catch (error) {
    console.error("Roster GET error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load roster." },
      { status: 500 }
    );
  }
}
