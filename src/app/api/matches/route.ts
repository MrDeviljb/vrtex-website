import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasAdminPermission } from "@/lib/auth";
import { logAdminAction } from "@/lib/audit";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasAdminPermission(user.role, "TOURNAMENT")) {
      return NextResponse.json({ success: false, message: "Admin access required." }, { status: 403 });
    }

    const { tournamentId, matchNumber, map, mode, startTime, roomId, roomPassword, releaseTime } = await request.json();

    if (!tournamentId || !matchNumber || !startTime) {
      return NextResponse.json(
        { success: false, message: "Tournament, match number, and start time are required." },
        { status: 400 }
      );
    }

    const match = await prisma.match.create({
      data: {
        tournamentId,
        matchNumber: Number(matchNumber),
        map: map || "Erangel",
        mode: mode || "Squad",
        startTime: new Date(startTime),
        status: "SCHEDULED",
        room: roomId
          ? {
              create: {
                roomId: String(roomId),
                roomPassword: String(roomPassword || "12345"),
                releaseTime: releaseTime ? new Date(releaseTime) : new Date(new Date(startTime).getTime() - 15 * 60 * 1000),
                isReleased: false,
                isManuallyHidden: false,
              },
            }
          : undefined,
      },
      include: {
        room: true,
        tournament: true,
      },
    });

    await logAdminAction(
      user.id,
      "CREATE_MATCH",
      `Match #${match.matchNumber} (${match.tournament.title})`,
      `Map: ${match.map}, Start: ${match.startTime.toISOString()}`
    );

    return NextResponse.json({
      success: true,
      message: `Match #${match.matchNumber} created successfully.`,
      match,
    });
  } catch (error) {
    console.error("Create match error:", error);
    return NextResponse.json({ success: false, message: "Failed to create match." }, { status: 500 });
  }
}
