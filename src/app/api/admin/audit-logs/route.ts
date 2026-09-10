import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasAdminPermission } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !hasAdminPermission(user.role, "ANY_ADMIN")) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 403 });
    }

    const logs = await prisma.auditLog.findMany({
      include: {
        admin: {
          select: {
            username: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ success: true, logs });
  } catch (error) {
    console.error("Audit logs GET error:", error);
    return NextResponse.json({ success: false, message: "Failed to load audit logs." }, { status: 500 });
  }
}
