import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Authentication required." },
        { status: 401 }
      );
    }

    // Get user's teams (captain or member)
    const captainTeamIds = user.captainTeams.map((t) => t.id);
    const memberTeamIds = user.teamMemberships.map((m) => m.teamId);
    const userTeamIds = Array.from(new Set([...captainTeamIds, ...memberTeamIds]));

    if (userTeamIds.length === 0) {
      return NextResponse.json({ success: true, registrations: [] });
    }

    const registrations = await prisma.tournamentRegistration.findMany({
      where: { teamId: { in: userTeamIds } },
      include: {
        tournament: {
          include: {
            matches: { select: { id: true, status: true } },
          },
        },
        team: {
          include: {
            captain: { include: { profile: true } },
            members: {
              include: { user: { include: { profile: true } } },
              orderBy: { joinedAt: "asc" },
            },
          },
        },
        payment: true,
      },
      orderBy: { registeredAt: "desc" },
    });

    const blockedStatusesForCancel = ["LIVE", "COMPLETED", "CANCELLED"];

    const formattedList = registrations.map((reg) => {
      let paymentStatus = "FREE";
      if (reg.tournament.entryFee > 0) {
        paymentStatus = reg.payment?.status || "PENDING";
      }

      // Determine match status
      let matchStatus = reg.tournament.status;
      const liveMatch = reg.tournament.matches.find((m) => m.status === "LIVE");
      const roomReleased = reg.tournament.matches.find((m) => m.status === "ROOM_RELEASED");
      if (liveMatch) matchStatus = "LIVE";
      else if (roomReleased) matchStatus = "ROOM_RELEASED";

      const isCaptain = reg.team.captainId === user.id;

      // Can captain cancel?
      const canCancel =
        isCaptain &&
        reg.status !== "CANCELLED" &&
        reg.status !== "DISQUALIFIED" &&
        !blockedStatusesForCancel.includes(reg.tournament.status);

      // Build roster display
      const captainMember = {
        userId: reg.team.captain.id,
        bgmiUsername: reg.team.captain.profile?.bgmiUsername || reg.team.captain.username,
        bgmiUid: reg.team.captain.profile?.bgmiUid || null,
        isVerified: reg.team.captain.profile?.isVerified || false,
        role: "CAPTAIN",
      };

      const mainMembers = reg.team.members
        .filter((m) => m.role === "PLAYER")
        .map((m) => ({
          userId: m.userId,
          bgmiUsername: m.user.profile?.bgmiUsername || m.user.username,
          bgmiUid: m.user.profile?.bgmiUid || null,
          isVerified: m.user.profile?.isVerified || false,
          role: "PLAYER",
        }));

      const substitutes = reg.team.members
        .filter((m) => m.role === "SUBSTITUTE")
        .map((m) => ({
          userId: m.userId,
          bgmiUsername: m.user.profile?.bgmiUsername || m.user.username,
          bgmiUid: m.user.profile?.bgmiUid || null,
          isVerified: m.user.profile?.isVerified || false,
          role: "SUBSTITUTE",
        }));

      return {
        registrationId: reg.id,
        tournamentId: reg.tournament.id,
        tournamentTitle: reg.tournament.title,
        tournamentSlug: reg.tournament.slug,
        bannerUrl: reg.tournament.bannerUrl,
        startDate: reg.tournament.startDate,
        gameMode: reg.tournament.gameMode,
        tournamentStatus: reg.tournament.status,
        teamId: reg.team.id,
        teamName: reg.team.name,
        teamTag: reg.team.tag,
        slotNumber: reg.slotNumber
          ? `Slot ${String(reg.slotNumber).padStart(2, "0")}`
          : reg.status === "WAITLIST"
          ? `Waitlist #${reg.waitlistPosition}`
          : "Unassigned",
        registrationStatus: reg.status,
        waitlistPosition: reg.waitlistPosition,
        paymentStatus,
        matchStatus,
        entryFee: reg.tournament.entryFee,
        registeredAt: reg.registeredAt,
        isCaptain,
        canCancel,
        roster: {
          captain: captainMember,
          mainMembers,
          substitutes,
          counts: {
            main: mainMembers.length + 1,
            sub: substitutes.length,
            maxMain: reg.tournament.maxRosterMain ?? 4,
            maxSub: reg.tournament.maxRosterSub ?? 1,
          },
        },
      };
    });

    return NextResponse.json({ success: true, registrations: formattedList });
  } catch (error) {
    console.error("My tournaments GET error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load my tournaments." },
      { status: 500 }
    );
  }
}
