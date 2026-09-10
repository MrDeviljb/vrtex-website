import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasPermission } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || (!hasPermission(user, "APPROVE_PAYMENTS") && user.role !== "SUPER_ADMIN")) {
      return NextResponse.json(
        { success: false, message: "Access denied. Payment verification permission required." },
        { status: 403 }
      );
    }

    const { searchParams } = request.nextUrl;
    const statusParam = searchParams.get("status");

    let where: any = {};
    if (statusParam && statusParam !== "ALL") {
      where.status = statusParam;
    }

    const payments = await prisma.payment.findMany({
      where,
      include: {
        user: {
          include: {
            profile: true,
          },
        },
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
        registration: true,
      },
      orderBy: {
        submittedAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      payments,
    });
  } catch (error) {
    console.error("Admin payments error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch payment records." },
      { status: 500 }
    );
  }
}
