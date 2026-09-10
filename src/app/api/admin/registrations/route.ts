import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasAdminPermission } from "@/lib/auth";
import { logAdminAction } from "@/lib/audit";
import { createNotification } from "@/lib/notifications";
import { cancelRegistration } from "@/lib/cancellation";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasAdminPermission(user.role, "TOURNAMENT")) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 403 });
    }

    const { searchParams } = request.nextUrl;
    const tournamentId = searchParams.get("tournamentId");

    const where: any = {};
    if (tournamentId) where.tournamentId = tournamentId;

    const registrations = await prisma.tournamentRegistration.findMany({
      where,
      include: {
        tournament: true,
        team: {
          include: {
            captain: { include: { profile: true } },
            members: {
              include: { user: { include: { profile: true } } },
            },
          },
        },
        payment: true,
      },
      orderBy: { registeredAt: "asc" },
    });

    return NextResponse.json({ success: true, registrations });
  } catch (error) {
    console.error("Admin registrations GET error:", error);
    return NextResponse.json({ success: false, message: "Failed to load registrations." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasAdminPermission(user.role, "TOURNAMENT")) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 403 });
    }

    const { registrationId, status, reason } = await request.json();
    if (!registrationId || !status) {
      return NextResponse.json({ success: false, message: "Missing registrationId or status." }, { status: 400 });
    }

    const validStatuses = ["APPROVED", "REJECTED", "WAITLIST", "DISQUALIFIED", "PENDING", "UNDER_REVIEW", "CANCELLED"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ success: false, message: "Invalid status." }, { status: 400 });
    }

    // For CANCELLED, use the full cancellation flow (slot release, waitlist assign, history)
    if (status === "CANCELLED") {
      const result = await cancelRegistration(
        registrationId,
        user.id,
        reason || "Cancelled by admin",
        true // isAdmin = true, skip tournament-started guard
      );

      if (!result.success) {
        return NextResponse.json({ success: false, message: result.message }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        message: result.message,
        waitlistTeamAssigned: result.waitlistTeamAssigned,
      });
    }

    // For WAITLIST — update position
    if (status === "WAITLIST") {
      const registration = await prisma.tournamentRegistration.findUnique({
        where: { id: registrationId },
        include: { team: { include: { captain: true } }, tournament: true },
      });
      if (!registration) {
        return NextResponse.json({ success: false, message: "Registration not found." }, { status: 404 });
      }

      // Find next waitlist position for this tournament
      const lastWaitlist = await prisma.tournamentRegistration.findFirst({
        where: { tournamentId: registration.tournamentId, status: "WAITLIST" },
        orderBy: { waitlistPosition: "desc" },
        select: { waitlistPosition: true },
      });
      const waitlistPosition = (lastWaitlist?.waitlistPosition ?? 0) + 1;

      await prisma.tournamentRegistration.update({
        where: { id: registrationId },
        data: { status: "WAITLIST", slotNumber: null, waitlistPosition },
      });

      await logAdminAction(
        user.id,
        "MOVE_TO_WAITLIST",
        `Team "${registration.team.name}" in ${registration.tournament.title}`,
        reason || "Moved to waitlist by admin"
      );

      await createNotification(
        registration.team.captainId,
        "Moved to Waitlist",
        `Your team "${registration.team.name}" has been moved to the waitlist for ${registration.tournament.title} (Position #${waitlistPosition}).`,
        "WARNING"
      );

      return NextResponse.json({
        success: true,
        message: `Team moved to waitlist at position #${waitlistPosition}.`,
      });
    }

    // Standard status update (APPROVED, REJECTED, PENDING, DISQUALIFIED, UNDER_REVIEW)
    const registration = await prisma.tournamentRegistration.update({
      where: { id: registrationId },
      data: { status },
      include: {
        team: { include: { captain: true } },
        tournament: true,
      },
    });

    await logAdminAction(
      user.id,
      "UPDATE_REGISTRATION_STATUS",
      `Team "${registration.team.name}" in ${registration.tournament.title}`,
      `Changed status to ${status}${reason ? `: ${reason}` : ""}`
    );

    await createNotification(
      registration.team.captainId,
      `Registration ${status}`,
      `Your registration for ${registration.tournament.title} has been marked as ${status}.`,
      status === "APPROVED" ? "SUCCESS" : "WARNING"
    );

    return NextResponse.json({
      success: true,
      message: `Registration status updated to ${status}.`,
      registration,
    });
  } catch (error) {
    console.error("Admin registration update error:", error);
    return NextResponse.json({ success: false, message: "Failed to update registration." }, { status: 500 });
  }
}
