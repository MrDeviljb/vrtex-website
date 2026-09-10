import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { registrationId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized access." },
        { status: 401 }
      );
    }

    const registration = await prisma.tournamentRegistration.findUnique({
      where: { id: params.registrationId },
      include: {
        tournament: true,
        team: {
          include: {
            captain: {
              include: {
                profile: true,
              },
            },
          },
        },
        payment: true,
      },
    });

    if (!registration) {
      return NextResponse.json(
        { success: false, message: "Registration record not found." },
        { status: 404 }
      );
    }

    // Verify user belongs to the team or is admin
    const isMember = registration.team.captainId === user.id ||
      user.role === "SUPER_ADMIN" ||
      user.role === "MODERATOR";

    if (!isMember) {
      return NextResponse.json(
        { success: false, message: "You do not have permission to view this payment page." },
        { status: 403 }
      );
    }

    const upiId = "dev-millionaire@fam";
    const amount = registration.tournament.entryFee;
    const upiUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent("Dev Millionaire")}&am=${amount}&cu=INR`;

    return NextResponse.json({
      success: true,
      data: {
        registrationId: registration.id,
        tournamentId: registration.tournament.id,
        tournamentName: registration.tournament.title,
        tournamentSlug: registration.tournament.slug,
        teamName: registration.team.name,
        captainName: registration.team.captain.profile?.bgmiUsername || registration.team.captain.username,
        bgmiUid: registration.team.captain.profile?.bgmiUid || "N/A",
        assignedSlot: registration.slotNumber ? `Slot ${String(registration.slotNumber).padStart(2, "0")}` : "Unassigned",
        slotNumber: registration.slotNumber,
        registrationFee: amount,
        registrationStatus: registration.status,
        upiId,
        upiUrl,
        payment: registration.payment,
      },
    });
  } catch (error) {
    console.error("Fetch payment error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch payment details." },
      { status: 500 }
    );
  }
}
