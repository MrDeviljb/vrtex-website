import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hashPassword } from "@/lib/auth";
import { logAdminAction } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, message: "Access denied. Super Admin privileges required." },
        { status: 403 }
      );
    }

    const moderators = await prisma.user.findMany({
      where: {
        role: { in: ["MODERATOR", "TOURNAMENT_ADMIN"] },
      },
      include: {
        profile: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      moderators,
    });
  } catch (error) {
    console.error("Fetch moderators error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch moderators." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, message: "Access denied. Super Admin privileges required." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { username, password, confirmPassword, displayName, permissions } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: "Username and password are required." },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { success: false, message: "Password and Confirm Password do not match." },
        { status: 400 }
      );
    }

    const cleanUsername = String(username).trim();
    const existing = await prisma.user.findUnique({
      where: { username: cleanUsername },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, message: "Username is already taken." },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);
    const validPermissions = Array.isArray(permissions) ? permissions : [];

    const newModerator = await prisma.user.create({
      data: {
        email: `${cleanUsername.toLowerCase()}@moderator.bgmi`,
        username: cleanUsername,
        passwordHash,
        role: "MODERATOR",
        permissions: JSON.stringify(validPermissions),
        profile: {
          create: {
            bio: displayName || `Moderator - ${cleanUsername}`,
            isVerified: true,
          },
        },
      },
      include: {
        profile: true,
      },
    });

    await logAdminAction(
      user.id,
      "CREATE_MODERATOR",
      cleanUsername,
      `Created Moderator account with ${validPermissions.length} granted permissions.`
    );

    return NextResponse.json({
      success: true,
      message: `Moderator account "${cleanUsername}" created successfully!`,
      moderator: newModerator,
    });
  } catch (error) {
    console.error("Create moderator error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create moderator account." },
      { status: 500 }
    );
  }
}
