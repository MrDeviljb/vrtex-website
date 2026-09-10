import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasAdminPermission } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }

    const isAdmin = hasAdminPermission(user.role, "MODERATOR");

    const tickets = await prisma.supportTicket.findMany({
      where: isAdmin ? {} : { userId: user.id },
      include: {
        user: { select: { id: true, username: true, email: true } },
        replies: {
          include: {
            sender: { select: { id: true, username: true, role: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, tickets });
  } catch (error) {
    console.error("Support tickets GET error:", error);
    return NextResponse.json({ success: false, message: "Failed to load tickets." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }

    const { action, subject, category, message, ticketId, status } = await request.json();

    if (action === "REPLY") {
      if (!ticketId || !message) {
        return NextResponse.json({ success: false, message: "Ticket ID and message are required." }, { status: 400 });
      }

      const isAdmin = hasAdminPermission(user.role, "MODERATOR");

      const reply = await prisma.ticketReply.create({
        data: {
          ticketId,
          senderId: user.id,
          message: String(message).trim(),
          isAdmin,
        },
      });

      if (isAdmin && status) {
        await prisma.supportTicket.update({
          where: { id: ticketId },
          data: { status },
        });
      }

      return NextResponse.json({ success: true, message: "Reply sent.", reply });
    }

    // Default: CREATE TICKET
    if (!subject || !category || !message) {
      return NextResponse.json(
        { success: false, message: "Subject, category, and message are required." },
        { status: 400 }
      );
    }

    const ticket = await prisma.supportTicket.create({
      data: {
        userId: user.id,
        subject: String(subject).trim(),
        category: String(category).trim(),
        message: String(message).trim(),
        status: "OPEN",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Support dispute ticket submitted. Our team will review shortly.",
      ticket,
    });
  } catch (error) {
    console.error("Support ticket POST error:", error);
    return NextResponse.json({ success: false, message: "Failed to process ticket." }, { status: 500 });
  }
}
