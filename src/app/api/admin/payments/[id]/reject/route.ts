import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { logAdminAction } from "@/lib/audit";
import { createNotification } from "@/lib/notifications";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user || (!hasPermission(user, "APPROVE_PAYMENTS") && user.role !== "SUPER_ADMIN")) {
      return NextResponse.json(
        { success: false, message: "Access denied. Payment approval permission required." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { rejectionReason } = body;

    if (!rejectionReason || String(rejectionReason).trim().length < 3) {
      return NextResponse.json(
        { success: false, message: "A clear rejection reason is required." },
        { status: 400 }
      );
    }

    const payment = await prisma.payment.findUnique({
      where: { id: params.id },
      include: {
        tournament: true,
        team: true,
        registration: true,
      },
    });

    if (!payment) {
      return NextResponse.json(
        { success: false, message: "Payment record not found." },
        { status: 404 }
      );
    }

    const cleanReason = String(rejectionReason).trim();

    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "REJECTED",
        rejectionReason: cleanReason,
        reviewedBy: user.username,
        reviewedAt: new Date(),
      },
    });

    if (payment.registration) {
      await prisma.tournamentRegistration.update({
        where: { id: payment.registration.id },
        data: {
          status: "REJECTED",
        },
      });
    }

    await logAdminAction(
      user.id,
      "REJECT_PAYMENT",
      payment.team.name,
      `Rejected ₹${payment.amount} (UTR: ${payment.utrNumber || "N/A"}) for ${payment.tournament.title}. Reason: ${cleanReason}`
    );

    await createNotification(
      payment.userId,
      "Payment Rejected",
      `Your payment of ₹${payment.amount} for "${payment.team.name}" in ${payment.tournament.title} was rejected. Reason: ${cleanReason}`,
      "WARNING"
    );

    return NextResponse.json({
      success: true,
      message: "Payment REJECTED. Registration status updated.",
      payment: updatedPayment,
    });
  } catch (error) {
    console.error("Reject payment error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to reject payment." },
      { status: 500 }
    );
  }
}
