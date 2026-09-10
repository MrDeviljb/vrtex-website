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
      include: {
        registrations: {
          where: {
            status: { notIn: ["REJECTED", "DISQUALIFIED", "CANCELLED"] },
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
        },
      },
    });

    if (!tournament) {
      return NextResponse.json(
        { success: false, message: "Tournament not found." },
        { status: 404 }
      );
    }

    const totalSlots = tournament.maxTeams;
    const occupiedCount = tournament.registrations.filter(
      (r) => r.status !== "WAITLIST" && r.status === "APPROVED"
    ).length;
    const activeCount = tournament.registrations.filter(
      (r) => r.status !== "WAITLIST"
    ).length;

    // Fetch waitlisted teams separately
    const waitlistedRegs = await prisma.tournamentRegistration.findMany({
      where: { tournamentId: tournament.id, status: "WAITLIST" },
      include: { team: { select: { id: true, name: true, tag: true } } },
      orderBy: { waitlistPosition: "asc" },
    });

    // Map slot numbers 1 to totalSlots
    const slotsMap = new Map<number, any>();
    tournament.registrations.forEach((reg) => {
      if (reg.slotNumber) {
        slotsMap.set(reg.slotNumber, reg);
      }
    });

    const slotsList = [];
    for (let slotNum = 1; slotNum <= totalSlots; slotNum++) {
      const reg = slotsMap.get(slotNum);
      if (reg) {
        let displayStatus = "APPROVED";
        if (reg.status === "PENDING") {
          displayStatus = tournament.entryFee > 0 ? "PAYMENT PENDING" : "PENDING APPROVAL";
        } else if (reg.status === "UNDER_REVIEW") {
          displayStatus = "UNDER REVIEW";
        }

        slotsList.push({
          slotNumber: slotNum,
          slotLabel: `Slot ${String(slotNum).padStart(2, "0")}`,
          isOccupied: true,
          registrationId: reg.id,
          teamId: reg.team.id,
          teamName: reg.team.name,
          teamTag: reg.team.tag,
          logoUrl: reg.team.logoUrl,
          status: reg.status,
          displayStatus,
          isApproved: reg.status === "APPROVED",
        });
      } else {
        slotsList.push({
          slotNumber: slotNum,
          slotLabel: `Slot ${String(slotNum).padStart(2, "0")}`,
          isOccupied: false,
          teamId: null,
          teamName: "AVAILABLE",
          teamTag: null,
          logoUrl: null,
          status: "AVAILABLE",
          displayStatus: "AVAILABLE",
          isApproved: false,
        });
      }
    }

    const formattedDate = new Date(tournament.startDate).toISOString().split("T")[0];

    return NextResponse.json({
      success: true,
      data: {
        tournamentId: tournament.id,
        tournamentTitle: tournament.title,
        tournamentSlug: tournament.slug,
        sessionHeader: tournament.sessionHeader || "DAILY SCRIMS",
        totalSlots,
        occupiedSlots: occupiedCount,
        activeSlots: activeCount,
        waitlistCount: waitlistedRegs.length,
        waitlistTeams: waitlistedRegs.map((r) => ({
          registrationId: r.id,
          waitlistPosition: r.waitlistPosition,
          teamId: r.team.id,
          teamName: r.team.name,
          teamTag: r.team.tag,
          status: r.status,
        })),
        dateOfSlotlist: formattedDate,
        slots: slotsList,
      },
    });
  } catch (error) {
    console.error("Slot list GET error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch slot list." },
      { status: 500 }
    );
  }
}
