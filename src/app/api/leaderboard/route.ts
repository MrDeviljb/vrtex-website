import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const tournamentId = searchParams.get("tournamentId");
    const type = searchParams.get("type") || "overall"; // overall | weekly | monthly

    let whereClause: any = {};
    if (tournamentId) {
      whereClause.match = { tournamentId };
    } else if (type === "weekly") {
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);
      whereClause.createdAt = { gte: oneWeekAgo };
    } else if (type === "monthly") {
      const oneMonthAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000);
      whereClause.createdAt = { gte: oneMonthAgo };
    }

    const results = await prisma.result.findMany({
      where: whereClause,
      include: {
        team: {
          include: {
            captain: {
              include: { profile: true },
            },
          },
        },
      },
    });

    // Aggregate by team
    const teamMap: Record<
      string,
      {
        teamId: string;
        name: string;
        tag: string;
        logoUrl: string | null;
        matches: number;
        wwcd: number;
        kills: number;
        placementPoints: number;
        killPoints: number;
        totalPoints: number;
      }
    > = {};

    for (const r of results) {
      if (!teamMap[r.teamId]) {
        teamMap[r.teamId] = {
          teamId: r.teamId,
          name: r.team.name,
          tag: r.team.tag,
          logoUrl: r.team.logoUrl,
          matches: 0,
          wwcd: 0,
          kills: 0,
          placementPoints: 0,
          killPoints: 0,
          totalPoints: 0,
        };
      }

      const t = teamMap[r.teamId];
      t.matches += 1;
      if (r.placement === 1) t.wwcd += 1;
      t.kills += r.kills;
      t.placementPoints += r.placementPoints;
      t.killPoints += r.killPoints;
      t.totalPoints += r.totalPoints;
    }

    // Sort: totalPoints desc, wwcd desc, placementPoints desc, kills desc
    const leaderboard = Object.values(teamMap).sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      if (b.wwcd !== a.wwcd) return b.wwcd - a.wwcd;
      if (b.placementPoints !== a.placementPoints) return b.placementPoints - a.placementPoints;
      return b.kills - a.kills;
    });

    const rankedLeaderboard = leaderboard.map((item, index) => ({
      rank: index + 1,
      ...item,
    }));

    return NextResponse.json({
      success: true,
      leaderboard: rankedLeaderboard,
    });
  } catch (error) {
    console.error("Leaderboard GET error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to generate leaderboard." },
      { status: 500 }
    );
  }
}
