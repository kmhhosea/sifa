import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession, verifyBusinessMembership } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("businessId");
    const unreadOnly = searchParams.get("unreadOnly") === "true";

    if (!businessId) return NextResponse.json({ error: "Business ID required" }, { status: 400 });

    const membership = await verifyBusinessMembership(session.userId, businessId);
    if (!membership) return NextResponse.json({ error: "Not a member of this business" }, { status: 403 });

    const where: Record<string, unknown> = { businessId, userId: session.userId };
    if (unreadOnly) where.isRead = false;

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.notification.count({
        where: { businessId, userId: session.userId, isRead: false },
      }),
    ]);

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    console.error("Notifications error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id, markAllRead, businessId } = await request.json();

    if (businessId) {
      const membership = await verifyBusinessMembership(session.userId, businessId);
      if (!membership) return NextResponse.json({ error: "Not a member of this business" }, { status: 403 });
    }

    if (markAllRead && businessId) {
      await prisma.notification.updateMany({
        where: { businessId, userId: session.userId, isRead: false },
        data: { isRead: true },
      });
    } else if (id) {
      await prisma.notification.update({
        where: { id },
        data: { isRead: true },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Notification update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
