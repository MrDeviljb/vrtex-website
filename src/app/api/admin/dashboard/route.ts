import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasAdminPermission } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !hasAdminPermission(user.role, "ANY_ADMIN")) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 403 });
    }

    const [
      totalUsers,
      totalTeams,
      upcomingTournaments,
      liveTournaments,
      activeScrims,
      pendingRegistrations,
      totalPrizePool,
      completedMatches,
      recentRegistrations,
      recentAuditLogs,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.team.count(),
      prisma.tournament.count({ where: { status: "UPCOMING", isScrim: false } }),
      prisma.tournament.count({ where: { status: "LIVE", isScrim: false } }),
      prisma.tournament.count({ where: { isScrim: true, status: { in: ["REGISTRATION_OPEN", "LIVE"] } } }),
      prisma.tournamentRegistration.count({ where: { status: "PENDING" } }),
      prisma.tournament.aggregate({ _sum: { prizePool: true } }),
      prisma.match.count({ where: { status: "COMPLETED" } }),
      prisma.tournamentRegistration.findMany({
        take: 8,
        orderBy: { registeredAt: "desc" },
        include: {
          team: {
            include: {
              captain: { include: { profile: true } },
            },
          },
          tournament: true,
        },
      }),
      prisma.auditLog.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          admin: true,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers,
        totalTeams,
        upcomingTournaments,
        liveTournaments,
        activeScrims,
        pendingRegistrations,
        totalPrizePool: totalPrizePool._sum.prizePool || 0,
        completedMatches,
      },
      recentRegistrations,
      recentAuditLogs,
    });
  } catch (error) {
    console.error("Admin dashboard error:", error);
    return NextResponse.json({ success: false, message: "Failed to load dashboard." }, { status: 500 });
  }
}
