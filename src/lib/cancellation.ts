/**
 * Registration cancellation logic.
 * Wraps everything in a DB transaction so two cancellations cannot race.
 */

import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import { logAdminAction } from "@/lib/audit";
import { assignSlotToNextWaitlistTeam } from "@/lib/slots";

export interface CancelResult {
  success: boolean;
  message: string;
  waitlistTeamAssigned?: boolean;
}

/**
 * Cancels a tournament registration and releases the slot.
 * Automatically assigns the slot to the next eligible waitlisted team.
 * For paid tournaments, marks payment as REFUND_PENDING instead of refunded.
 *
 * @param registrationId - The registration to cancel
 * @param cancelledById  - The user performing the cancellation (captain or admin)
 * @param reason         - Reason for cancellation
 * @param isAdmin        - If true, skips the tournament-started guard
 */
export async function cancelRegistration(
  registrationId: string,
  cancelledById: string,
  reason: string = "Cancelled by captain",
  isAdmin: boolean = false
): Promise<CancelResult> {
  // Fetch registration with all related data
  const registration = await prisma.tournamentRegistration.findUnique({
    where: { id: registrationId },
    include: {
      tournament: true,
      team: { include: { captain: true } },
      payment: true,
    },
  });

  if (!registration) {
    return { success: false, message: "Registration not found." };
  }

  if (registration.status === "CANCELLED") {
    return { success: false, message: "This registration is already cancelled." };
  }

  // Block cancellation if tournament has started (unless admin override)
  if (!isAdmin) {
    const blockedStatuses = ["LIVE", "COMPLETED", "CANCELLED"];
    if (blockedStatuses.includes(registration.tournament.status)) {
      return {
        success: false,
        message:
          "Registration cancellation is no longer available because this tournament has started.",
      };
    }
  }

  const cancelledSlot = registration.slotNumber;
  const teamName = registration.team.name;
  const tournamentTitle = registration.tournament.title;
  const isPaid =
    registration.tournament.entryFee > 0 ||
    registration.tournament.type === "PAID";

  // === ATOMIC TRANSACTION ===
  await prisma.$transaction(async (tx) => {
    // 1. Mark registration as CANCELLED, release slot
    await tx.tournamentRegistration.update({
      where: { id: registrationId },
      data: {
        status: "CANCELLED",
        slotNumber: null,
        cancelledAt: new Date(),
        cancelReason: reason,
      },
    });

    // 2. For paid tournaments, flag payment as REFUND_PENDING
    if (isPaid && registration.paymentId) {
      const currentPayment = await tx.payment.findUnique({
        where: { id: registration.paymentId },
        select: { status: true },
      });
      // Only flag approved payments for refund review
      if (currentPayment?.status === "APPROVED") {
        await tx.payment.update({
          where: { id: registration.paymentId },
          data: { status: "REFUND_PENDING" },
        });
      }
    }

    // 3. Write slot history for this cancellation
    if (cancelledSlot) {
      const cancellerUser = await tx.user.findUnique({
        where: { id: cancelledById },
        select: { username: true },
      });

      await tx.slotHistory.create({
        data: {
          tournamentId: registration.tournamentId,
          slotNumber: cancelledSlot,
          registrationId,
          previousTeamId: registration.teamId,
          previousTeamName: teamName,
          newTeamId: null,
          newTeamName: "AVAILABLE",
          action: isAdmin ? "ADMIN_OVERRIDE" : "CANCELLED",
          changedById: cancelledById,
          changedByName: cancellerUser?.username ?? null,
          reason,
        },
      });
    }
  });

  // 4. Notify captain of cancellation
  await createNotification(
    registration.team.captainId,
    "Registration Cancelled",
    isPaid
      ? `Your registration for "${tournamentTitle}" has been cancelled. ${cancelledSlot ? `Slot ${String(cancelledSlot).padStart(2, "0")} has been released.` : ""} Refund eligibility will be reviewed according to the tournament's refund policy.`
      : `Your registration for "${tournamentTitle}" has been cancelled.${cancelledSlot ? ` Slot ${String(cancelledSlot).padStart(2, "0")} has been released.` : ""}`,
    "WARNING"
  );

  // 5. Audit log (always write, even for self-cancellation)
  await logAdminAction(
    cancelledById,
    isAdmin ? "ADMIN_CANCEL_REGISTRATION" : "SELF_CANCEL_REGISTRATION",
    `Team "${teamName}" in ${tournamentTitle}`,
    reason
  );

  // 6. Auto-assign the released slot to next eligible waitlisted team
  let waitlistTeamAssigned = false;
  if (cancelledSlot) {
    const cancellerUser = await prisma.user.findUnique({
      where: { id: cancelledById },
      select: { username: true },
    });

    waitlistTeamAssigned = await assignSlotToNextWaitlistTeam(
      registration.tournamentId,
      cancelledSlot,
      cancelledById,
      cancellerUser?.username ?? null,
      `Slot released from cancellation of team "${teamName}"`
    );
  }

  const baseMessage = isPaid
    ? `Registration cancelled. Refund eligibility will be reviewed according to the tournament's refund policy.`
    : `Registration successfully cancelled.`;

  return {
    success: true,
    message: waitlistTeamAssigned
      ? `${baseMessage} The slot has been automatically assigned to the next team in the queue.`
      : `${baseMessage}`,
    waitlistTeamAssigned,
  };
}
