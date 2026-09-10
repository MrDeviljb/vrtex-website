import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Authentication required." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { registrationId, utrNumber, screenshot } = body;

    if (!registrationId) {
      return NextResponse.json(
        { success: false, message: "Registration ID is required." },
        { status: 400 }
      );
    }

    const cleanUtr = String(utrNumber || "").trim();
    if (!cleanUtr || cleanUtr.length < 6) {
      return NextResponse.json(
        { success: false, message: "Please enter a valid 12-digit UTR / Payment reference number." },
        { status: 400 }
      );
    }

    // Check registration
    const registration = await prisma.tournamentRegistration.findUnique({
      where: { id: registrationId },
      include: {
        tournament: true,
        team: true,
        payment: true,
      },
    });

    if (!registration) {
      return NextResponse.json(
        { success: false, message: "Registration not found." },
        { status: 404 }
      );
    }

    if (registration.team.captainId !== user.id) {
      return NextResponse.json(
        { success: false, message: "Only team captain can submit payment details." },
        { status: 403 }
      );
    }

    // Check UTR Uniqueness across ALL payments
    const existingUtr = await prisma.payment.findFirst({
      where: {
        utrNumber: cleanUtr,
        id: registration.paymentId ? { not: registration.paymentId } : undefined,
      },
    });

    if (existingUtr) {
      return NextResponse.json(
        { success: false, message: "This UTR / Payment reference number has already been used for another registration." },
        { status: 400 }
      );
    }

    // Create or Update Payment
    let payment;
    if (registration.paymentId) {
      payment = await prisma.payment.update({
        where: { id: registration.paymentId },
        data: {
          utrNumber: cleanUtr,
          screenshot: screenshot || null,
          status: "UNDER_REVIEW",
          submittedAt: new Date(),
        },
      });
    } else {
      payment = await prisma.payment.create({
        data: {
          userId: user.id,
          tournamentId: registration.tournamentId,
          teamId: registration.teamId,
          amount: registration.tournament.entryFee,
          upiId: "dev-millionaire@fam",
          utrNumber: cleanUtr,
          screenshot: screenshot || null,
          status: "UNDER_REVIEW",
          submittedAt: new Date(),
        },
      });

      await prisma.tournamentRegistration.update({
        where: { id: registration.id },
        data: {
          paymentId: payment.id,
          status: "UNDER_REVIEW",
        },
      });
    }

    await createNotification(
      user.id,
      "Payment Under Review",
      `Payment of ₹${registration.tournament.entryFee} for UTR ${cleanUtr} submitted. Admin will verify shortly.`,
      "INFO"
    );

    return NextResponse.json({
      success: true,
      message: "Payment submitted successfully! Payment will be manually verified by an authorized admin or moderator before your registration is approved.",
      payment,
    });
  } catch (error: any) {
    console.error("Payment submission error:", error);
    if (error.code === "P2002") {
      return NextResponse.json(
        { success: false, message: "This UTR number has already been registered." },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, message: "Failed to submit payment." },
      { status: 500 }
    );
  }
}
