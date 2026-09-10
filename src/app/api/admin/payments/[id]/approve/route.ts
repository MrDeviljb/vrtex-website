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

    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "APPROVED",
        reviewedBy: user.username,
        reviewedAt: new Date(),
      },
    });

    if (payment.registration) {
      await prisma.tournamentRegistration.update({
        where: { id: payment.registration.id },
        data: {
          status: "APPROVED",
        },
      });
    }

    await logAdminAction(
      user.id,
      "APPROVE_PAYMENT",
      payment.team.name,
      `Approved ₹${payment.amount} (UTR: ${payment.utrNumber || "N/A"}) for ${payment.tournament.title}`
    );

    await createNotification(
      payment.userId,
      "Payment & Registration Approved!",
      `Your payment of ₹${payment.amount} for "${payment.team.name}" in ${payment.tournament.title} has been APPROVED!`,
      "SUCCESS"
    );

    return NextResponse.json({
      success: true,
      message: "Payment APPROVED successfully! Registration is now approved.",
      payment: updatedPayment,
    });
  } catch (error) {
    console.error("Approve payment error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to approve payment." },
      { status: 500 }
    );
  }
}
