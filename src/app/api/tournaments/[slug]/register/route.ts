import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";
import { assignNextAvailableSlot, getNextWaitlistPosition } from "@/lib/slots";

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Please log in to register for tournaments." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { teamId } = body;
    if (!teamId) {
      return NextResponse.json(
        { success: false, message: "Please select a team to register." },
        { status: 400 }
      );
    }

    // Fetch tournament
    const tournament = await prisma.tournament.findUnique({
      where: { slug: params.slug },
      include: {
        registrations: {
          include: {
            team: {
              include: {
                members: true,
              },
            },
          },
        },
      },
    });

    if (!tournament) {
      return NextResponse.json(
        { success: false, message: "Tournament not found." },
        { status: 404 }
      );
    }

    // Check registration status and deadline
    const now = new Date();
    if (tournament.status !== "REGISTRATION_OPEN" && tournament.status !== "UPCOMING") {
      return NextResponse.json(
        { success: false, message: "Registration is not open for this tournament." },
        { status: 400 }
      );
    }

    if (now > new Date(tournament.regEnd)) {
      return NextResponse.json(
        { success: false, message: "Registration has closed for this tournament." },
        { status: 400 }
      );
    }

    // Check if slots are full → waitlist instead of error
    const activeRegistrations = tournament.registrations.filter(
      (r) => !["REJECTED", "DISQUALIFIED", "CANCELLED"].includes(r.status) &&
             r.status !== "WAITLIST"
    );
    const isFull = activeRegistrations.length >= tournament.maxTeams;

    // Fetch team and verify user is captain
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        captain: {
          include: { profile: true },
        },
        members: {
          include: {
            user: {
              include: { profile: true },
            },
          },
        },
      },
    });

    if (!team) {
      return NextResponse.json(
        { success: false, message: "Team not found." },
        { status: 404 }
      );
    }

    if (team.captainId !== user.id) {
      return NextResponse.json(
        { success: false, message: "Only the team captain can register the team for tournaments." },
        { status: 403 }
      );
    }

    // Check duplicate team registration
    const alreadyRegistered = tournament.registrations.some(
      (r) => r.teamId === team.id && !["REJECTED", "DISQUALIFIED", "CANCELLED"].includes(r.status)
    );
    if (alreadyRegistered) {
      return NextResponse.json(
        { success: false, message: "Your team is already registered for this tournament." },
        { status: 400 }
      );
    }

    // Check roster size requirements
    const memberCount = team.members.length;
    if (tournament.gameMode === "Squad" && memberCount < 4) {
      return NextResponse.json(
        {
          success: false,
          message: `Squad tournament requires at least 4 registered players in your team roster (Current: ${memberCount}).`,
        },
        { status: 400 }
      );
    } else if (tournament.gameMode === "Duo" && memberCount < 2) {
      return NextResponse.json(
        {
          success: false,
          message: `Duo tournament requires at least 2 registered players (Current: ${memberCount}).`,
        },
        { status: 400 }
      );
    }

    // Check that all players have verified BGMI UIDs
    const unverifiedMembers = team.members.filter(
      (m) => !m.user.profile?.isVerified || !m.user.profile?.bgmiUid
    );
    if (unverifiedMembers.length > 0) {
      const names = unverifiedMembers.map((m) => m.user.username).join(", ");
      return NextResponse.json(
        {
          success: false,
          message: `All team members must have a verified BGMI UID before entering tournaments. Unverified members: ${names}`,
        },
        { status: 400 }
      );
    }

    // Check if any player is already registered with another team in this tournament
    const currentMemberUserIds = new Set(team.members.map((m) => m.userId));
    for (const reg of activeRegistrations) {
      for (const m of reg.team.members) {
        if (currentMemberUserIds.has(m.userId)) {
          return NextResponse.json(
            {
              success: false,
              message: "One or more of your team players are already registered with another team in this tournament.",
            },
            { status: 400 }
          );
        }
      }
    }

    // Assign slot or place on waitlist
    const isPaid = tournament.entryFee > 0 || tournament.type === "PAID";

    if (isFull) {
      // Place on waitlist
      const waitlistPosition = await getNextWaitlistPosition(tournament.id);
      const registration = await prisma.tournamentRegistration.create({
        data: {
          tournamentId: tournament.id,
          teamId: team.id,
          slotNumber: null,
          status: "WAITLIST",
          waitlistPosition,
        },
      });

      await createNotification(
        user.id,
        "Added to Tournament Waitlist",
        `All slots for ${tournament.title} are currently full. Your team "${team.name}" has been placed at Waitlist position #${waitlistPosition}. You will be notified if a slot becomes available.`,
        "INFO"
      );

      return NextResponse.json({
        success: true,
        waitlisted: true,
        waitlistPosition,
        message: `All ${tournament.maxTeams} slots are full. "${team.name}" has been added to the waitlist at position #${waitlistPosition}.`,
        registration,
      });
    }

    // Assign next available sequential slot
    const assignedSlot = await assignNextAvailableSlot(tournament.id, tournament.maxTeams);
    if (!assignedSlot) {
      // Concurrent registration raced us — put on waitlist
      const waitlistPosition = await getNextWaitlistPosition(tournament.id);
      const registration = await prisma.tournamentRegistration.create({
        data: {
          tournamentId: tournament.id,
          teamId: team.id,
          slotNumber: null,
          status: "WAITLIST",
          waitlistPosition,
        },
      });
      return NextResponse.json({
        success: true,
        waitlisted: true,
        waitlistPosition,
        message: `No slot was available at the moment. "${team.name}" has been waitlisted at position #${waitlistPosition}.`,
        registration,
      });
    }

    const registration = await prisma.tournamentRegistration.create({
      data: {
        tournamentId: tournament.id,
        teamId: team.id,
        slotNumber: assignedSlot,
        status: "PENDING",
      },
    });

    // Write initial slot history
    await prisma.slotHistory.create({
      data: {
        tournamentId: tournament.id,
        slotNumber: assignedSlot,
        registrationId: registration.id,
        previousTeamId: null,
        previousTeamName: "AVAILABLE",
        newTeamId: team.id,
        newTeamName: team.name,
        action: "ASSIGNED",
        changedById: user.id,
        changedByName: user.username,
        reason: "Initial registration",
      },
    }).catch(() => {}); // non-fatal

    await createNotification(
      user.id,
      "Tournament Slot Reserved",
      `Slot ${String(assignedSlot).padStart(2, "0")} reserved for "${team.name}" in ${tournament.title}. ${isPaid ? "Please complete payment." : "Awaiting admin approval."}`,
      "INFO"
    );

    return NextResponse.json({
      success: true,
      message: `Successfully registered "${team.name}"! Slot ${String(assignedSlot).padStart(2, "0")} assigned.`,
      registration,
      requiresPayment: isPaid,
      paymentUrl: isPaid ? `/payment/${registration.id}` : null,
    });
  } catch (error) {
    console.error("Tournament registration error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to register for tournament." },
      { status: 500 }
    );
  }
}
