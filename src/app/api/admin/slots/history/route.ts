import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasPermission, hasAdminPermission } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/slots/history?tournamentId=xxx&slotNumber=yyy
 * Returns slot history records for admin display.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (
      !user ||
      (!hasAdminPermission(user.role, "ANY_ADMIN") &&
        !hasPermission(user, "MANAGE_SLOTS"))
    ) {
      return NextResponse.json(
        { success: false, message: "Access denied." },
        { status: 403 }
      );
    }

    const { searchParams } = request.nextUrl;
    const tournamentId = searchParams.get("tournamentId");
    const slotNumber = searchParams.get("slotNumber");

    if (!tournamentId) {
      return NextResponse.json(
        { success: false, message: "tournamentId is required." },
        { status: 400 }
      );
    }

    const where: any = { tournamentId };
    if (slotNumber) where.slotNumber = Number(slotNumber);

    const history = await prisma.slotHistory.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    return NextResponse.json({ success: true, history });
  } catch (error) {
    console.error("Slot history GET error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load slot history." },
      { status: 500 }
    );
  }
}
