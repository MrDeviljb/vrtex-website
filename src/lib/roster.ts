/**
 * Server-side roster validation helpers.
 * All validation runs here on the backend — do NOT rely on frontend restrictions alone.
 */

import { prisma } from "@/lib/prisma";

export interface RosterCounts {
  totalMain: number;   // captain + PLAYER members
  totalSub: number;    // SUBSTITUTE members
  maxMain: number;
  maxSub: number;
  mainFull: boolean;
  subFull: boolean;
}

/**
 * Returns current roster counts for a team against configured limits.
 * "main" = CAPTAIN + PLAYER roles combined.
 */
export async function getTeamRosterCounts(
  teamId: string,
  maxMain: number,
  maxSub: number
): Promise<RosterCounts> {
  const members = await prisma.teamMember.findMany({
    where: { teamId },
    select: { role: true },
  });

  const totalMain = members.filter((m) => m.role === "CAPTAIN" || m.role === "PLAYER").length;
  const totalSub = members.filter((m) => m.role === "SUBSTITUTE").length;

  return {
    totalMain,
    totalSub,
    maxMain,
    maxSub,
    mainFull: totalMain >= maxMain,
    subFull: totalSub >= maxSub,
  };
}

/**
 * Validates all server-side rules before adding a player to a team roster.
 *
 * Returns { valid: true } or { valid: false, message: string }
 */
export async function validateAddMember(opts: {
  teamId: string;
  bgmiUid: string;
  role: "PLAYER" | "SUBSTITUTE";
  captainId: string;
  requestingUserId: string;
  maxMain: number;
  maxSub: number;
}): Promise<{ valid: boolean; message?: string }> {
  const { teamId, bgmiUid, role, captainId, requestingUserId, maxMain, maxSub } = opts;

  // 1. Only captain can modify roster
  if (requestingUserId !== captainId) {
    return { valid: false, message: "Only the Team Captain can modify the roster." };
  }

  // 2. Fetch current team with members
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      members: {
        include: {
          user: { include: { profile: true } },
        },
      },
    },
  });

  if (!team) return { valid: false, message: "Team not found." };

  // 3. Captain cannot be added as a regular member (they're already on the team)
  const captainProfile = await prisma.profile.findFirst({
    where: { userId: captainId },
    select: { bgmiUid: true },
  });
  if (captainProfile?.bgmiUid && captainProfile.bgmiUid === bgmiUid) {
    return { valid: false, message: "The team captain cannot be added as a team member — they are already in the roster." };
  }

  // 4. No duplicate UID in this team
  const duplicateOnTeam = team.members.some(
    (m) => m.user.profile?.bgmiUid === bgmiUid
  );
  if (duplicateOnTeam) {
    return { valid: false, message: "This BGMI UID is already registered in your team roster." };
  }

  // 5. Check roster size limits
  const counts = await getTeamRosterCounts(teamId, maxMain, maxSub);
  if (role === "PLAYER" && counts.mainFull) {
    return { valid: false, message: `Main roster is full (${counts.totalMain}/${maxMain}).` };
  }
  if (role === "SUBSTITUTE" && counts.subFull) {
    return { valid: false, message: `Substitute slot is full (${counts.totalSub}/${maxSub}).` };
  }

  // 6. Check player not already in another team for the same active tournament(s)
  // Find the target user by their BGMI UID
  const targetUserProfile = await prisma.profile.findFirst({
    where: { bgmiUid },
    select: { userId: true },
  });

  if (targetUserProfile) {
    // Get the team's active tournament registrations
    const teamRegistrations = await prisma.tournamentRegistration.findMany({
      where: {
        teamId,
        status: { notIn: ["REJECTED", "DISQUALIFIED", "CANCELLED"] },
      },
      select: { tournamentId: true },
    });

    if (teamRegistrations.length > 0) {
      const tournamentIds = teamRegistrations.map((r) => r.tournamentId);

      // Find if target user is in any other team registered for same tournaments
      const conflictingMembership = await prisma.teamMember.findFirst({
        where: {
          userId: targetUserProfile.userId,
          teamId: { not: teamId },
          team: {
            registrations: {
              some: {
                tournamentId: { in: tournamentIds },
                status: { notIn: ["REJECTED", "DISQUALIFIED", "CANCELLED"] },
              },
            },
          },
        },
        include: {
          team: { select: { name: true } },
        },
      });

      if (conflictingMembership) {
        return {
          valid: false,
          message: `This player is already registered with team "${conflictingMembership.team.name}" in one of the same tournaments.`,
        };
      }
    }
  }

  return { valid: true };
}
