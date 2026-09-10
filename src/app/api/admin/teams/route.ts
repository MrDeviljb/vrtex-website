import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasAdminPermission } from "@/lib/auth";
import { logAdminAction } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasAdminPermission(user.role, "MODERATOR")) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 403 });
    }

    const { searchParams } = request.nextUrl;
    const search = searchParams.get("search") || "";

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { tag: { contains: search } },
        { captain: { username: { contains: search } } },
        { captain: { profile: { bgmiUsername: { contains: search } } } },
      ];
    }

    const teams = await prisma.team.findMany({
      where,
      include: {
        captain: {
          select: {
            id: true,
            username: true,
            email: true,
            profile: {
              select: {
                bgmiUsername: true,
                bgmiUid: true,
              },
            },
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                profile: {
                  select: {
                    bgmiUsername: true,
                    bgmiUid: true,
                  },
                },
              },
            },
          },
        },
        registrations: {
          include: {
            tournament: {
              select: {
                id: true,
                title: true,
                slug: true,
              },
            },
          },
        },
        _count: {
          select: {
            members: true,
            registrations: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ success: true, teams });
  } catch (error) {
    console.error("Admin teams GET error:", error);
    return NextResponse.json({ success: false, message: "Failed to load teams." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasAdminPermission(user.role, "MODERATOR")) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 403 });
    }

    const { searchParams } = request.nextUrl;
    let teamId = searchParams.get("id");

    if (!teamId) {
      try {
        const body = await request.json();
        teamId = body.teamId;
      } catch {}
    }

    if (!teamId) {
      return NextResponse.json({ success: false, message: "Team ID is required." }, { status: 400 });
    }

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: { captain: true },
    });

    if (!team) {
      return NextResponse.json({ success: false, message: "Team not found." }, { status: 404 });
    }

    // Atomically delete the team and all dependencies
    await prisma.$transaction(async (tx) => {
      // 1. Delete slot histories
      await tx.slotHistory.deleteMany({
        where: {
          OR: [{ previousTeamId: team.id }, { newTeamId: team.id }],
        },
      });

      // 2. Delete tournament registrations
      await tx.tournamentRegistration.deleteMany({
        where: { teamId: team.id },
      });

      // 3. Delete match results
      await tx.result.deleteMany({
        where: { teamId: team.id },
      });

      // 4. Delete payments
      await tx.payment.deleteMany({
        where: { teamId: team.id },
      });

      // 5. Delete team members
      await tx.teamMember.deleteMany({
        where: { teamId: team.id },
      });

      // 6. Delete team
      await tx.team.delete({
        where: { id: team.id },
      });
    });

    await logAdminAction(
      user.id,
      "DELETE_TEAM",
      `Team "${team.name}" [${team.tag}]`,
      `Deleted team "${team.name}" (Captain: @${team.captain.username})`
    );

    return NextResponse.json({
      success: true,
      message: `Team "${team.name}" [${team.tag}] deleted successfully.`,
    });
  } catch (error) {
    console.error("Admin team DELETE error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete team." },
      { status: 500 }
    );
  }
}
