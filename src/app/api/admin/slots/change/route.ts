import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { logAdminAction } from "@/lib/audit";
import { createNotification } from "@/lib/notifications";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || (!hasPermission(user, "MANAGE_SLOTS") && user.role !== "SUPER_ADMIN")) {
      return NextResponse.json(
        { success: false, message: "Access denied. Slot management permission required." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { registrationId, newSlotNumber } = body;

    if (!registrationId || !newSlotNumber) {
      return NextResponse.json(
        { success: false, message: "Registration ID and new slot number are required." },
        { status: 400 }
      );
    }

    const slotNum = Number(newSlotNumber);
    if (isNaN(slotNum) || slotNum < 1) {
      return NextResponse.json(
        { success: false, message: "Invalid slot number." },
        { status: 400 }
      );
    }

    const registration = await prisma.tournamentRegistration.findUnique({
      where: { id: registrationId },
      include: {
        tournament: true,
        team: true,
      },
    });

    if (!registration) {
      return NextResponse.json(
        { success: false, message: "Registration record not found." },
        { status: 404 }
      );
    }

    if (slotNum > registration.tournament.maxTeams) {
      return NextResponse.json(
        { success: false, message: `Slot number exceeds tournament max slots (${registration.tournament.maxTeams}).` },
        { status: 400 }
      );
    }

    // Check if newSlotNumber is already assigned to another team in this tournament
    const existingOccupant = await prisma.tournamentRegistration.findFirst({
      where: {
        tournamentId: registration.tournamentId,
        slotNumber: slotNum,
        id: { not: registration.id },
        status: { notIn: ["REJECTED", "DISQUALIFIED", "CANCELLED"] },
      },
      include: {
        team: true,
      },
    });

    if (existingOccupant) {
      return NextResponse.json(
        { success: false, message: `Slot ${slotNum} is already assigned to "${existingOccupant.team.name}".` },
        { status: 400 }
      );
    }

    const oldSlot = registration.slotNumber;
    await prisma.tournamentRegistration.update({
      where: { id: registration.id },
      data: { slotNumber: slotNum },
    });

    // Write slot history for audit trail
    await prisma.slotHistory.create({
      data: {
        tournamentId: registration.tournamentId,
        slotNumber: slotNum,
        registrationId: registration.id,
        previousTeamId: registration.teamId,
        previousTeamName: registration.team.name,
        newTeamId: registration.teamId,
        newTeamName: registration.team.name,
        action: "ADMIN_OVERRIDE",
        changedById: user.id,
        changedByName: user.username,
        reason: `Admin reassigned from Slot ${oldSlot ? String(oldSlot).padStart(2, "0") : "N/A"} to Slot ${String(slotNum).padStart(2, "0")}`,
      },
    }).catch(() => {});

    await logAdminAction(
      user.id,
      "CHANGE_SLOT",
      registration.team.name,
      `Reassigned slot for "${registration.team.name}" in ${registration.tournament.title} from Slot ${oldSlot ? String(oldSlot).padStart(2, "0") : "N/A"} to Slot ${String(slotNum).padStart(2, "0")}`
    );

    await createNotification(
      registration.team.captainId,
      "Tournament Slot Updated",
      `Your slot for "${registration.team.name}" in ${registration.tournament.title} has been moved to Slot #${String(slotNum).padStart(2, "0")}.`,
      "INFO"
    );

    return NextResponse.json({
      success: true,
      message: `Slot successfully changed to Slot ${String(slotNum).padStart(2, "0")}.`,
    });
  } catch (error) {
    console.error("Change slot error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to change slot." },
      { status: 500 }
    );
  }
}
