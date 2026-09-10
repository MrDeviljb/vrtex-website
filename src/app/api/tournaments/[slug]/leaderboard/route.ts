import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const tournament = await prisma.tournament.findUnique({
      where: { slug: params.slug },
      select: { id: true, title: true, slug: true },
    });

    if (!tournament) {
      return NextResponse.json(
        { success: false, message: "Tournament not found." },
        { status: 404 }
      );
    }

    const results = await prisma.result.findMany({
      where: {
        match: {
          tournamentId: tournament.id,
        },
      },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            tag: true,
            logoUrl: true,
          },
        },
      },
    });

    if (results.length === 0) {
      return NextResponse.json({
        success: true,
        isPublished: false,
        message: "Leaderboard will be available after match results are published.",
        leaderboard: [],
      });
    }

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

    // Sort by totalPoints desc, wwcd desc, placementPoints desc, kills desc
    const sorted = Object.values(teamMap).sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      if (b.wwcd !== a.wwcd) return b.wwcd - a.wwcd;
      if (b.placementPoints !== a.placementPoints) return b.placementPoints - a.placementPoints;
      return b.kills - a.kills;
    });

    const rankedLeaderboard = sorted.map((item, index) => ({
      rank: index + 1,
      ...item,
    }));

    return NextResponse.json({
      success: true,
      isPublished: true,
      tournamentTitle: tournament.title,
      leaderboard: rankedLeaderboard,
    });
  } catch (error) {
    console.error("Tournament leaderboard GET error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to generate tournament leaderboard." },
      { status: 500 }
    );
  }
}
