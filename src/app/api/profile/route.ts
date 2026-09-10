import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyBgmiUidWithAluu } from "@/lib/aluu";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }

    const body = await request.json();
    const { bgmiUid, bio, avatarUrl } = body;

    let updateData: any = {};
    if (typeof bio === "string") updateData.bio = bio.slice(0, 300);
    if (typeof avatarUrl === "string") updateData.avatarUrl = avatarUrl;

    if (bgmiUid) {
      const cleanUid = String(bgmiUid).trim();
      const aluuResult = await verifyBgmiUidWithAluu(cleanUid);
      if (!aluuResult.success || !aluuResult.player) {
        return NextResponse.json(
          {
            success: false,
            message: aluuResult.message || "Failed to verify BGMI UID with game servers.",
          },
          { status: 400 }
        );
      }

      // Check if UID is already linked to another player
      const existing = await prisma.profile.findFirst({
        where: {
          bgmiUid: cleanUid,
          userId: { not: user.id },
        },
      });

      if (existing) {
        return NextResponse.json(
          {
            success: false,
            message: "This BGMI UID is already linked to another Vortex Esports account.",
          },
          { status: 400 }
        );
      }

      updateData.bgmiUid = cleanUid;
      updateData.bgmiUsername = aluuResult.player.username;
      updateData.isVerified = true;
    }

    const updatedProfile = await prisma.profile.upsert({
      where: { userId: user.id },
      update: updateData,
      create: {
        userId: user.id,
        ...updateData,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully.",
      profile: updatedProfile,
    });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update profile." },
      { status: 500 }
    );
  }
}
