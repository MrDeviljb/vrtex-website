import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasAdminPermission } from "@/lib/auth";
import { parseScoringRules, calculatePoints } from "@/lib/scoring";
import { logAdminAction } from "@/lib/audit";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const results = await prisma.result.findMany({
      where: { matchId: params.id },
      include: {
        team: {
          include: {
            captain: { include: { profile: true } },
          },
        },
      },
      orderBy: { placement: "asc" },
    });

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error("Fetch results error:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch results." }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasAdminPermission(user.role, "TOURNAMENT")) {
      return NextResponse.json({ success: false, message: "Admin access required." }, { status: 403 });
    }

    const { teamResults } = await request.json();
    // teamResults is an array of { teamId, placement, kills }

    if (!Array.isArray(teamResults) || teamResults.length === 0) {
      return NextResponse.json(
        { success: false, message: "Valid team results array is required." },
        { status: 400 }
      );
    }

    const match = await prisma.match.findUnique({
      where: { id: params.id },
      include: {
        tournament: true,
      },
    });

    if (!match) {
      return NextResponse.json({ success: false, message: "Match not found." }, { status: 404 });
    }

    const scoringRules = parseScoringRules(match.tournament.scoringRulesJson);

    // Run transaction to upsert results and update player profile totals
    await prisma.$transaction(async (tx) => {
      for (const item of teamResults) {
        const placement = Number(item.placement);
        const kills = Math.max(0, Number(item.kills) || 0);
        const { placementPoints, killPoints, totalPoints } = calculatePoints(
          placement,
          kills,
          scoringRules
        );

        await tx.result.upsert({
          where: {
            matchId_teamId: {
              matchId: match.id,
              teamId: item.teamId,
            },
          },
          update: {
            placement,
            kills,
            placementPoints,
            killPoints,
            totalPoints,
          },
          create: {
            matchId: match.id,
            teamId: item.teamId,
            placement,
            kills,
            placementPoints,
            killPoints,
            totalPoints,
          },
        });

        // Update team members' stats
        const members = await tx.teamMember.findMany({
          where: { teamId: item.teamId },
        });

        for (const m of members) {
          await tx.profile.updateMany({
            where: { userId: m.userId },
            data: {
              wins: placement === 1 ? { increment: 1 } : undefined,
              kills: { increment: Math.floor(kills / Math.max(1, members.length)) },
              points: { increment: totalPoints },
            },
          });
        }
      }

      // Mark match status as COMPLETED
      await tx.match.update({
        where: { id: match.id },
        data: { status: "COMPLETED" },
      });
    });

    await logAdminAction(
      user.id,
      "RECORD_RESULTS",
      `Match #${match.matchNumber} (${match.tournament.title})`,
      `Recorded results for ${teamResults.length} teams.`
    );

    return NextResponse.json({
      success: true,
      message: `Results recorded and points computed for Match #${match.matchNumber}!`,
    });
  } catch (error) {
    console.error("Save results error:", error);
    return NextResponse.json({ success: false, message: "Failed to record results." }, { status: 500 });
  }
}
