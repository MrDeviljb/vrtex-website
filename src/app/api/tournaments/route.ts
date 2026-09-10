import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasAdminPermission } from "@/lib/auth";
import { logAdminAction } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const isScrimParam = searchParams.get("isScrim");
    const statusParam = searchParams.get("status");
    const search = searchParams.get("search") || "";
    const feeFilter = searchParams.get("fee"); // "free" | "paid"

    let where: any = {};

    if (isScrimParam !== null) {
      where.isScrim = isScrimParam === "true";
    }

    if (statusParam && statusParam !== "ALL") {
      where.status = statusParam;
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }

    if (feeFilter === "free") {
      where.entryFee = 0;
    } else if (feeFilter === "paid") {
      where.entryFee = { gt: 0 };
    }

    const tournaments = await prisma.tournament.findMany({
      where,
      include: {
        _count: {
          select: {
            registrations: true,
            matches: true,
          },
        },
      },
      orderBy: {
        startDate: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      tournaments,
    });
  } catch (error) {
    console.error("Tournaments GET error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch tournaments." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasAdminPermission(user.role, "TOURNAMENT")) {
      return NextResponse.json(
        { success: false, message: "Access denied. Tournament Admin permission required." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      title,
      slug,
      bannerUrl,
      description,
      gameMode,
      perspective,
      maxTeams,
      entryFee,
      prizePool,
      regStart,
      regEnd,
      startDate,
      status,
      isScrim,
      scoringRulesJson,
      rulesText,
    } = body;

    if (!title || !slug || !description) {
      return NextResponse.json(
        { success: false, message: "Title, slug, and description are required." },
        { status: 400 }
      );
    }

    const cleanSlug = slug
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-");

    const existing = await prisma.tournament.findUnique({
      where: { slug: cleanSlug },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, message: "A tournament with this URL slug already exists." },
        { status: 400 }
      );
    }

    const tournament = await prisma.tournament.create({
      data: {
        title: title.trim(),
        slug: cleanSlug,
        bannerUrl: bannerUrl || "/bgmi_hero.jpg",
        description: description.trim(),
        gameMode: gameMode || "Squad",
        perspective: perspective || "TPP",
        maxTeams: Number(maxTeams) || 25,
        entryFee: Number(entryFee) || 0,
        prizePool: Number(prizePool) || 0,
        regStart: new Date(regStart || Date.now()),
        regEnd: new Date(regEnd || Date.now() + 24 * 3600 * 1000),
        startDate: new Date(startDate || Date.now() + 26 * 3600 * 1000),
        status: status || "REGISTRATION_OPEN",
        isScrim: !!isScrim,
        scoringRulesJson: scoringRulesJson || JSON.stringify({
          placement: { "1": 10, "2": 6, "3": 5, "4": 4, "5": 3, "6": 2, "7": 1, "8": 1, "9": 0, "10": 0 },
          kill: 1,
        }),
        rulesText: rulesText || "Standard BGMI Esports rules apply.",
      },
    });

    await logAdminAction(
      user.id,
      "CREATE_TOURNAMENT",
      tournament.title,
      `Created ${tournament.isScrim ? "scrim" : "tournament"} (${tournament.slug})`
    );

    return NextResponse.json({
      success: true,
      message: "Tournament created successfully!",
      tournament,
    });
  } catch (error) {
    console.error("Tournament create error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create tournament." },
      { status: 500 }
    );
  }
}
