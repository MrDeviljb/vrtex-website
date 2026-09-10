import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasAdminPermission } from "@/lib/auth";
import { logAdminAction } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasAdminPermission(user.role, "FINANCE")) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 403 });
    }

    const { searchParams } = request.nextUrl;
    const tournamentId = searchParams.get("tournamentId");

    const where: any = {};
    if (tournamentId) where.tournamentId = tournamentId;

    const prizes = await prisma.prize.findMany({
      where,
      include: {
        tournament: true,
      },
      orderBy: { rank: "asc" },
    });

    return NextResponse.json({ success: true, prizes });
  } catch (error) {
    console.error("Prizes GET error:", error);
    return NextResponse.json({ success: false, message: "Failed to load prizes." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasAdminPermission(user.role, "FINANCE")) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 403 });
    }

    const { prizeId, status, transactionId, notes } = await request.json();

    if (!prizeId || !status) {
      return NextResponse.json({ success: false, message: "Missing prizeId or status." }, { status: 400 });
    }

    const validStatuses = ["PENDING", "PROCESSING", "PAID", "FAILED"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ success: false, message: "Invalid prize status." }, { status: 400 });
    }

    const prize = await prisma.prize.update({
      where: { id: prizeId },
      data: {
        status,
        transactionId: transactionId || undefined,
        notes: notes || undefined,
        paidAt: status === "PAID" ? new Date() : undefined,
      },
      include: { tournament: true },
    });

    await logAdminAction(
      user.id,
      "UPDATE_PRIZE_PAYOUT",
      `Rank #${prize.rank} (₹${prize.amount}) in ${prize.tournament.title}`,
      `Status: ${status}, TxID: ${transactionId || "N/A"}`
    );

    return NextResponse.json({
      success: true,
      message: `Prize payout status updated to ${status}.`,
      prize,
    });
  } catch (error) {
    console.error("Prize update error:", error);
    return NextResponse.json({ success: false, message: "Failed to update prize." }, { status: 500 });
  }
}
