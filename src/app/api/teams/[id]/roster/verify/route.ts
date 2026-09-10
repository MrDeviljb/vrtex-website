import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { verifyBgmiUidWithAluu } from "@/lib/aluu";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/teams/[id]/roster/verify
 * Captain-only: verifies a BGMI UID using the existing Aluu system.
 * Returns the player name if valid.
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

    const { bgmiUid } = await request.json();

    if (!bgmiUid || String(bgmiUid).trim().length < 5) {
      return NextResponse.json(
        { success: false, message: "Please provide a valid BGMI UID." },
        { status: 400 }
      );
    }

    // Server-side: verify caller is actually the captain
    const team = await prisma.team.findUnique({
      where: { id: params.id },
      select: { captainId: true },
    });

    if (!team) {
      return NextResponse.json(
        { success: false, message: "Team not found." },
        { status: 404 }
      );
    }

    if (team.captainId !== user.id) {
      return NextResponse.json(
        { success: false, message: "Only the Team Captain can verify players." },
        { status: 403 }
      );
    }

    const cleanUid = String(bgmiUid).trim();
    const result = await verifyBgmiUidWithAluu(cleanUid);

    if (!result.success || !result.player) {
      return NextResponse.json(
        { success: false, message: result.message || "BGMI UID could not be verified." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      player: {
        uid: result.player.uid,
        username: result.player.username,
      },
    });
  } catch (error) {
    console.error("Roster verify error:", error);
    return NextResponse.json(
      { success: false, message: "Verification failed. Please try again." },
      { status: 500 }
    );
  }
}
