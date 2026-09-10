import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { cancelRegistration } from "@/lib/cancellation";

/**
 * POST /api/registrations/[id]/cancel
 * Captain self-service cancellation.
 * Validates that the requesting user is the captain of the registered team.
 * All actual logic is in /lib/cancellation.ts (transactional).
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

    const registrationId = params.id;

    // Fetch registration to verify the caller is the team captain
    // Do NOT trust any captain/team ID from the request body
    const registration = await prisma.tournamentRegistration.findUnique({
      where: { id: registrationId },
      include: {
        team: { select: { captainId: true, name: true } },
        tournament: { select: { title: true, status: true, entryFee: true, type: true } },
        payment: { select: { status: true } },
      },
    });

    if (!registration) {
      return NextResponse.json(
        { success: false, message: "Registration not found." },
        { status: 404 }
      );
    }

    // SERVER-SIDE captain check — do not trust any body param
    if (registration.team.captainId !== user.id) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Access denied. Only the Team Captain can cancel this tournament registration.",
        },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const reason = body.reason || "Cancelled by team captain";

    const result = await cancelRegistration(
      registrationId,
      user.id,
      reason,
      false // not admin — apply tournament-started guard
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      waitlistTeamAssigned: result.waitlistTeamAssigned,
    });
  } catch (error) {
    console.error("Self-cancel registration error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to cancel registration. Please try again." },
      { status: 500 }
    );
  }
}

/**
 * GET /api/registrations/[id]/cancel
 * Returns eligibility info for displaying the cancel modal.
 */
export async function GET(
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

    const registration = await prisma.tournamentRegistration.findUnique({
      where: { id: params.id },
      include: {
        team: { select: { captainId: true, name: true } },
        tournament: {
          select: {
            title: true,
            status: true,
            entryFee: true,
            type: true,
          },
        },
        payment: { select: { status: true } },
      },
    });

    if (!registration) {
      return NextResponse.json(
        { success: false, message: "Registration not found." },
        { status: 404 }
      );
    }

    if (registration.team.captainId !== user.id) {
      return NextResponse.json({ success: false, message: "Access denied." }, { status: 403 });
    }

    const blockedStatuses = ["LIVE", "COMPLETED", "CANCELLED"];
    const canCancel =
      registration.status !== "CANCELLED" &&
      !blockedStatuses.includes(registration.tournament.status);

    const isPaid =
      registration.tournament.entryFee > 0 ||
      registration.tournament.type === "PAID";

    return NextResponse.json({
      success: true,
      canCancel,
      blockedReason: !canCancel
        ? registration.status === "CANCELLED"
          ? "This registration is already cancelled."
          : "Registration cancellation is no longer available because this tournament has started."
        : null,
      details: {
        tournamentTitle: registration.tournament.title,
        tournamentStatus: registration.tournament.status,
        teamName: registration.team.name,
        slotNumber: registration.slotNumber
          ? `Slot ${String(registration.slotNumber).padStart(2, "0")}`
          : "Unassigned",
        registrationStatus: registration.status,
        paymentStatus: isPaid ? (registration.payment?.status || "PENDING") : "FREE",
        isPaid,
      },
    });
  } catch (error) {
    console.error("Cancel eligibility check error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to check cancellation eligibility." },
      { status: 500 }
    );
  }
}
