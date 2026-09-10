import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const teams = await prisma.team.findMany({
      include: {
        captain: {
          include: { profile: true },
        },
        members: {
          include: {
            user: {
              include: { profile: true },
            },
          },
        },
        _count: {
          select: {
            registrations: true,
            results: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, teams });
  } catch (error) {
    console.error("Teams GET error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch teams." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "You must be logged in to create a team." },
        { status: 401 }
      );
    }

    if (!user.profile?.isVerified || !user.profile?.bgmiUid) {
      return NextResponse.json(
        {
          success: false,
          message: "Please verify your BGMI UID in your profile before creating a team.",
        },
        { status: 400 }
      );
    }

    const { name, tag, logoUrl } = await request.json();
    if (!name || !tag) {
      return NextResponse.json(
        { success: false, message: "Team name and team tag are required." },
        { status: 400 }
      );
    }

    const cleanName = String(name).trim();
    const cleanTag = String(tag).trim().toUpperCase();

    const existingName = await prisma.team.findUnique({
      where: { name: cleanName },
    });
    if (existingName) {
      return NextResponse.json(
        { success: false, message: "A team with this name already exists." },
        { status: 400 }
      );
    }

    // Generate readable random invite code
    const inviteCode = `${cleanTag}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    const team = await prisma.team.create({
      data: {
        name: cleanName,
        tag: cleanTag,
        logoUrl: logoUrl || null,
        captainId: user.id,
        inviteCode,
        members: {
          create: {
            userId: user.id,
            role: "CAPTAIN",
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              include: { profile: true },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Team created successfully!",
      team,
    });
  } catch (error) {
    console.error("Create team error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create team." },
      { status: 500 }
    );
  }
}
