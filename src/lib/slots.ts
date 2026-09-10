import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

/**
 * Assigns the lowest available slot number (1..maxSlots) for a tournament registration.
 * Replaces the previous random assignment to make slots deterministic and sequential.
 */
export async function assignNextAvailableSlot(
  tournamentId: string,
  maxSlots: number
): Promise<number | null> {
  const activeRegistrations = await prisma.tournamentRegistration.findMany({
    where: {
      tournamentId,
      status: { notIn: ["REJECTED", "DISQUALIFIED", "CANCELLED"] },
      slotNumber: { not: null },
    },
    select: { slotNumber: true },
  });

  const occupiedSlots = new Set(activeRegistrations.map((r) => r.slotNumber as number));

  for (let s = 1; s <= maxSlots; s++) {
    if (!occupiedSlots.has(s)) return s;
  }
  return null; // All slots full
}

/**
 * @deprecated Use assignNextAvailableSlot instead.
 * Kept for backward-compatibility with any existing callers.
 */
export async function assignRandomSlot(
  tournamentId: string,
  maxSlots: number
): Promise<number | null> {
  return assignNextAvailableSlot(tournamentId, maxSlots);
}

/**
 * Finds the next eligible waitlisted team and assigns them the given slot.
 * For FREE tournaments: sets status = APPROVED immediately.
 * For PAID tournaments: sets status = PENDING (admin must approve payment).
 *
 * Writes a SlotHistory record and sends a notification to the captain.
 * Returns true if a team was assigned, false if no waitlisted team exists.
 */
export async function assignSlotToNextWaitlistTeam(
  tournamentId: string,
  slotNumber: number,
  changedById: string | null,
  changedByName: string | null,
  reason: string = "Slot released by previous team"
): Promise<boolean> {
  // Find next eligible waitlisted team (lowest waitlistPosition)
  const nextWaitlisted = await prisma.tournamentRegistration.findFirst({
    where: {
      tournamentId,
      status: "WAITLIST",
      waitlistPosition: { not: null },
    },
    orderBy: { waitlistPosition: "asc" },
    include: {
      team: true,
      tournament: true,
    },
  });

  if (!nextWaitlisted) return false;

  const isPaid = nextWaitlisted.tournament.entryFee > 0 || nextWaitlisted.tournament.type === "PAID";
  const newStatus = isPaid ? "PENDING" : "APPROVED";

  // Reassign slot and update waitlist queue atomically
  await prisma.$transaction(async (tx) => {
    // Assign the slot and move them out of waitlist
    await tx.tournamentRegistration.update({
      where: { id: nextWaitlisted.id },
      data: {
        slotNumber,
        status: newStatus,
        waitlistPosition: null,
      },
    });

    // Shift all remaining waitlist positions down by 1
    await tx.tournamentRegistration.updateMany({
      where: {
        tournamentId,
        status: "WAITLIST",
        waitlistPosition: { not: null },
      },
      data: {
        waitlistPosition: { decrement: 1 },
      },
    });

    // Write slot history
    await tx.slotHistory.create({
      data: {
        tournamentId,
        slotNumber,
        registrationId: nextWaitlisted.id,
        previousTeamId: null,
        previousTeamName: "AVAILABLE",
        newTeamId: nextWaitlisted.teamId,
        newTeamName: nextWaitlisted.team.name,
        action: "REASSIGNED",
        changedById,
        changedByName,
        reason,
      },
    });
  });

  // Notify the captain
  const captain = await prisma.team.findUnique({
    where: { id: nextWaitlisted.teamId },
    select: { captainId: true },
  });

  if (captain) {
    const slotLabel = `Slot ${String(slotNumber).padStart(2, "0")}`;
    await createNotification(
      captain.captainId,
      "Tournament Slot Assigned! 🎮",
      isPaid
        ? `Good news! A slot opened up. Your team \"${nextWaitlisted.team.name}\" has been assigned ${slotLabel} in ${nextWaitlisted.tournament.title}. Please ensure your payment is completed for admin approval.`
        : `Your team \"${nextWaitlisted.team.name}\" has been assigned ${slotLabel} in ${nextWaitlisted.tournament.title} from the waitlist. You are now APPROVED!`,
      "SUCCESS"
    );
  }

  return true;
}

/**
 * Returns the next available waitlist position for a tournament.
 */
export async function getNextWaitlistPosition(tournamentId: string): Promise<number> {
  const last = await prisma.tournamentRegistration.findFirst({
    where: { tournamentId, status: "WAITLIST" },
    orderBy: { waitlistPosition: "desc" },
    select: { waitlistPosition: true },
  });
  return (last?.waitlistPosition ?? 0) + 1;
}
